import { randomUUID } from "node:crypto";
import { addDays, dateRange, isLocalDate, localDateInTimezone, todayInTimezone } from "./dates.js";
import {
  ZERO_NUTRIENTS,
  addNutrients,
  clampConfidence,
  divideNutrients,
  mealConfidence,
  round,
  sumNutrients,
  type DaySummary,
  type Goals,
  type Meal,
  type MealInput,
  type MealItem,
  type MealItemInput,
  type Nutrients,
  type SavedMeal,
  type WeekSummary,
  type WeightEntry,
} from "./domain.js";
import type { NutritionStoreApi } from "./store-api.js";

interface MealRow {
  id: string;
  local_date: string;
  eaten_at: string;
  name: string;
  meal_type: Meal["mealType"];
  restaurant: string | null;
  source: Meal["source"];
  confidence: number;
  assumptions_json: string;
  created_at: string;
  updated_at: string;
}

interface ItemRow {
  id: string;
  name: string;
  serving_description: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  confidence: number;
  assumptions_json: string;
}

interface WeightRow {
  id: string;
  local_date: string;
  weight: number;
  unit: WeightEntry["unit"];
  notes: string | null;
  created_at: string;
}

interface SavedMealRow {
  id: string;
  name: string;
  restaurant: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface GoalRow {
  calorie_goal: number | null;
  protein_goal_g: number | null;
  carbs_goal_g: number | null;
  fat_goal_g: number | null;
  fiber_goal_g: number | null;
  target_weight: number | null;
  weight_unit: Goals["weightUnit"];
  weekly_loss_goal: number | null;
  timezone: string;
  updated_at: string;
}

const DEFAULT_TIMEZONE = "America/Los_Angeles";

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function itemFromRow(row: ItemRow): MealItem {
  return {
    id: row.id,
    name: row.name,
    servingDescription: row.serving_description,
    quantity: row.quantity,
    unit: row.unit,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    confidence: row.confidence,
    assumptions: parseJsonArray(row.assumptions_json),
  };
}

function nutrientsFromItem(item: MealItem | MealItemInput): Nutrients {
  return {
    calories: round(item.calories),
    proteinG: round(item.proteinG),
    carbsG: round(item.carbsG),
    fatG: round(item.fatG),
    fiberG: round(item.fiberG),
  };
}

function convertWeight(
  weight: number,
  from: WeightEntry["unit"],
  to: WeightEntry["unit"],
): number {
  if (from === to) return weight;
  return from === "kg" ? weight * 2.2046226218 : weight / 2.2046226218;
}

function remainingForTotals(
  goals: Goals,
  totals: Nutrients,
): DaySummary["remaining"] {
  return {
    calories:
      goals.calorieGoal === null ? null : round(goals.calorieGoal - totals.calories),
    proteinG:
      goals.proteinGoalG === null
        ? null
        : round(goals.proteinGoalG - totals.proteinG),
    carbsG:
      goals.carbsGoalG === null ? null : round(goals.carbsGoalG - totals.carbsG),
    fatG: goals.fatGoalG === null ? null : round(goals.fatGoalG - totals.fatG),
    fiberG:
      goals.fiberGoalG === null ? null : round(goals.fiberGoalG - totals.fiberG),
  };
}

function weightFromRow(row: WeightRow): WeightEntry {
  return {
    id: row.id,
    localDate: row.local_date,
    weight: row.weight,
    unit: row.unit,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export class D1NutritionStore implements NutritionStoreApi {
  constructor(private readonly db: D1Database) {}

  async getGoals(): Promise<Goals> {
    const row = await this.db
      .prepare("SELECT * FROM goals WHERE id = 1")
      .first<GoalRow>();
    if (!row) {
      return {
        calorieGoal: null,
        proteinGoalG: null,
        carbsGoalG: null,
        fatGoalG: null,
        fiberGoalG: null,
        targetWeight: null,
        weightUnit: "lb",
        weeklyLossGoal: null,
        timezone: DEFAULT_TIMEZONE,
        updatedAt: null,
      };
    }
    return {
      calorieGoal: row.calorie_goal,
      proteinGoalG: row.protein_goal_g,
      carbsGoalG: row.carbs_goal_g,
      fatGoalG: row.fat_goal_g,
      fiberGoalG: row.fiber_goal_g,
      targetWeight: row.target_weight,
      weightUnit: row.weight_unit,
      weeklyLossGoal: row.weekly_loss_goal,
      timezone: row.timezone,
      updatedAt: row.updated_at,
    };
  }

  async setGoals(patch: Partial<Omit<Goals, "updatedAt">>): Promise<Goals> {
    const current = await this.getGoals();
    const next = { ...current, ...patch };
    new Intl.DateTimeFormat("en-US", { timeZone: next.timezone }).format(new Date());
    const now = new Date().toISOString();
    await this.db
      .prepare(`
        INSERT INTO goals (
          id, calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g,
          fiber_goal_g, target_weight, weight_unit, weekly_loss_goal,
          timezone, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          calorie_goal = excluded.calorie_goal,
          protein_goal_g = excluded.protein_goal_g,
          carbs_goal_g = excluded.carbs_goal_g,
          fat_goal_g = excluded.fat_goal_g,
          fiber_goal_g = excluded.fiber_goal_g,
          target_weight = excluded.target_weight,
          weight_unit = excluded.weight_unit,
          weekly_loss_goal = excluded.weekly_loss_goal,
          timezone = excluded.timezone,
          updated_at = excluded.updated_at
      `)
      .bind(
        next.calorieGoal,
        next.proteinGoalG,
        next.carbsGoalG,
        next.fatGoalG,
        next.fiberGoalG,
        next.targetWeight,
        next.weightUnit,
        next.weeklyLossGoal,
        next.timezone,
        now,
      )
      .run();
    return this.getGoals();
  }

  private async normalizeMeal(input: MealInput): Promise<MealInput & {
    eatenAt: string;
    localDate: string;
    source: NonNullable<MealInput["source"]>;
    confidence: number;
    assumptions: string[];
  }> {
    if (!input.items.length) throw new Error("A meal must contain at least one item.");
    const goals = await this.getGoals();
    const eatenDate = input.eatenAt ? new Date(input.eatenAt) : new Date();
    if (Number.isNaN(eatenDate.getTime())) {
      throw new Error("eatenAt must be a valid ISO date-time.");
    }
    const localDate =
      input.localDate ?? localDateInTimezone(eatenDate, goals.timezone);
    if (!isLocalDate(localDate)) throw new Error("localDate must use YYYY-MM-DD.");
    return {
      ...input,
      name: input.name.trim(),
      restaurant: input.restaurant?.trim() || undefined,
      eatenAt: eatenDate.toISOString(),
      localDate,
      source: input.source ?? "text",
      confidence: mealConfidence(input),
      assumptions: input.assumptions ?? [],
      items: input.items.map((item) => ({
        ...item,
        name: item.name.trim(),
        servingDescription: item.servingDescription.trim(),
        quantity: item.quantity ?? 1,
        unit: item.unit?.trim() || "serving",
        calories: round(item.calories),
        proteinG: round(item.proteinG),
        carbsG: round(item.carbsG),
        fatG: round(item.fatG),
        fiberG: round(item.fiberG),
        confidence: clampConfidence(item.confidence),
        assumptions: item.assumptions ?? [],
      })),
    };
  }

  async previewMeal(input: MealInput) {
    const meal = await this.normalizeMeal(input);
    const totals = sumNutrients(meal.items.map(nutrientsFromItem));
    const day = await this.getToday(meal.localDate);
    const projectedTotals = addNutrients(day.totals, totals);
    return {
      kind: "meal_preview" as const,
      meal: { ...meal, totals },
      day,
      projectedDay: {
        date: day.date,
        totals: projectedTotals,
        goals: day.goals,
        remaining: remainingForTotals(day.goals, projectedTotals),
        savedMealCount: day.meals.length,
      },
      requiresConfirmation: true as const,
      lowConfidence: meal.confidence < 0.7,
    };
  }

  private itemStatements(
    table: "meal_items" | "saved_meal_items",
    parentColumn: "meal_id" | "saved_meal_id",
    parentId: string,
    items: MealItemInput[],
  ): D1PreparedStatement[] {
    return items.map((item, index) =>
      this.db
        .prepare(`
          INSERT INTO ${table} (
            id, ${parentColumn}, sort_order, name, serving_description, quantity,
            unit, calories, protein_g, carbs_g, fat_g, fiber_g, confidence,
            assumptions_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          randomUUID(),
          parentId,
          index,
          item.name.trim(),
          item.servingDescription.trim(),
          item.quantity ?? 1,
          item.unit?.trim() || "serving",
          round(item.calories),
          round(item.proteinG),
          round(item.carbsG),
          round(item.fatG),
          round(item.fiberG),
          clampConfidence(item.confidence),
          JSON.stringify(item.assumptions ?? []),
        ),
    );
  }

  async createMeal(input: MealInput): Promise<Meal> {
    const meal = await this.normalizeMeal(input);
    const id = randomUUID();
    const now = new Date().toISOString();
    await this.db.batch([
      this.db
        .prepare(`
          INSERT INTO meals (
            id, local_date, eaten_at, name, meal_type, restaurant, source,
            confidence, assumptions_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          meal.localDate,
          meal.eatenAt,
          meal.name,
          meal.mealType,
          meal.restaurant ?? null,
          meal.source,
          meal.confidence,
          JSON.stringify(meal.assumptions),
          now,
          now,
        ),
      ...this.itemStatements("meal_items", "meal_id", id, meal.items),
    ]);
    return (await this.getMeal(id))!;
  }

  async updateMeal(id: string, patch: Partial<MealInput>): Promise<Meal> {
    const current = await this.getMeal(id);
    if (!current) throw new Error(`Meal not found: ${id}`);
    const merged: MealInput = {
      name: patch.name ?? current.name,
      mealType: patch.mealType ?? current.mealType,
      eatenAt: patch.eatenAt ?? current.eatenAt,
      localDate: patch.localDate ?? current.localDate,
      restaurant:
        patch.restaurant === undefined
          ? current.restaurant ?? undefined
          : patch.restaurant,
      source: patch.source ?? current.source,
      confidence: patch.confidence ?? current.confidence,
      assumptions: patch.assumptions ?? current.assumptions,
      items: patch.items ?? current.items,
    };
    const meal = await this.normalizeMeal(merged);
    const now = new Date().toISOString();
    await this.db.batch([
      this.db
        .prepare(`
          UPDATE meals SET
            local_date = ?, eaten_at = ?, name = ?, meal_type = ?,
            restaurant = ?, source = ?, confidence = ?, assumptions_json = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .bind(
          meal.localDate,
          meal.eatenAt,
          meal.name,
          meal.mealType,
          meal.restaurant ?? null,
          meal.source,
          meal.confidence,
          JSON.stringify(meal.assumptions),
          now,
          id,
        ),
      this.db.prepare("DELETE FROM meal_items WHERE meal_id = ?").bind(id),
      ...this.itemStatements("meal_items", "meal_id", id, meal.items),
    ]);
    return (await this.getMeal(id))!;
  }

  async deleteMeal(id: string): Promise<boolean> {
    const result = await this.db
      .prepare("DELETE FROM meals WHERE id = ?")
      .bind(id)
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async getMeal(id: string): Promise<Meal | null> {
    const row = await this.db
      .prepare("SELECT * FROM meals WHERE id = ?")
      .bind(id)
      .first<MealRow>();
    return row ? this.mealFromRow(row) : null;
  }

  private async mealFromRow(row: MealRow): Promise<Meal> {
    const query = await this.db
      .prepare(`
        SELECT id, name, serving_description, quantity, unit, calories,
               protein_g, carbs_g, fat_g, fiber_g, confidence,
               assumptions_json
        FROM meal_items
        WHERE meal_id = ?
        ORDER BY sort_order
      `)
      .bind(row.id)
      .all<ItemRow>();
    const items = query.results.map(itemFromRow);
    return {
      id: row.id,
      localDate: row.local_date,
      eatenAt: row.eaten_at,
      name: row.name,
      mealType: row.meal_type,
      restaurant: row.restaurant,
      source: row.source,
      confidence: row.confidence,
      assumptions: parseJsonArray(row.assumptions_json),
      items,
      totals: sumNutrients(items.map(nutrientsFromItem)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async mealsBetween(startDate: string, endDate: string): Promise<Meal[]> {
    const query = await this.db
      .prepare(`
        SELECT * FROM meals
        WHERE local_date BETWEEN ? AND ?
        ORDER BY local_date DESC, eaten_at DESC
      `)
      .bind(startDate, endDate)
      .all<MealRow>();
    return Promise.all(query.results.map((row) => this.mealFromRow(row)));
  }

  async getToday(date?: string): Promise<DaySummary> {
    const goals = await this.getGoals();
    const targetDate = date ?? todayInTimezone(goals.timezone);
    if (!isLocalDate(targetDate)) throw new Error("date must use YYYY-MM-DD.");
    const meals = await this.mealsBetween(targetDate, targetDate);
    const totals = sumNutrients(meals.map((meal) => meal.totals));
    return {
      date: targetDate,
      totals,
      goals,
      remaining: remainingForTotals(goals, totals),
      meals,
    };
  }

  async getWeek(endDate?: string): Promise<WeekSummary> {
    const goals = await this.getGoals();
    const resolvedEnd = endDate ?? todayInTimezone(goals.timezone);
    if (!isLocalDate(resolvedEnd)) throw new Error("endDate must use YYYY-MM-DD.");
    const startDate = addDays(resolvedEnd, -6);
    const meals = await this.mealsBetween(startDate, resolvedEnd);
    const days = dateRange(startDate, resolvedEnd).map((date) => {
      const dayMeals = meals.filter((meal) => meal.localDate === date);
      return {
        date,
        totals: sumNutrients(dayMeals.map((meal) => meal.totals)),
        mealCount: dayMeals.length,
      };
    });
    const logged = days.filter((day) => day.mealCount > 0);
    const weekTotals = days.reduce(
      (total, day) => addNutrients(total, day.totals),
      { ...ZERO_NUTRIENTS },
    );
    const proteinGoalDays =
      goals.proteinGoalG === null
        ? null
        : logged.filter((day) => day.totals.proteinG >= goals.proteinGoalG!).length;
    return {
      startDate,
      endDate: resolvedEnd,
      days,
      meals,
      loggedDays: logged.length,
      averages: divideNutrients(weekTotals, logged.length),
      calendarDayAverages: divideNutrients(weekTotals, 7),
      proteinGoalDays,
      proteinConsistencyPct:
        proteinGoalDays === null || logged.length === 0
          ? null
          : round((proteinGoalDays / logged.length) * 100, 0),
      highestCalorieMeals: [...meals]
        .sort((a, b) => b.totals.calories - a.totals.calories)
        .slice(0, 5)
        .map((meal) => ({
          id: meal.id,
          name: meal.name,
          localDate: meal.localDate,
          calories: meal.totals.calories,
        })),
    };
  }

  async logWeight(input: {
    localDate?: string;
    weight: number;
    unit?: WeightEntry["unit"];
    notes?: string;
  }): Promise<WeightEntry> {
    const goals = await this.getGoals();
    const localDate = input.localDate ?? todayInTimezone(goals.timezone);
    if (!isLocalDate(localDate)) throw new Error("localDate must use YYYY-MM-DD.");
    const unit = input.unit ?? goals.weightUnit;
    const now = new Date().toISOString();
    const id = randomUUID();
    await this.db
      .prepare(`
        INSERT INTO weights (
          id, local_date, weight, unit, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(local_date) DO UPDATE SET
          weight = excluded.weight,
          unit = excluded.unit,
          notes = excluded.notes,
          updated_at = excluded.updated_at
      `)
      .bind(
        id,
        localDate,
        round(input.weight, 2),
        unit,
        input.notes?.trim() || null,
        now,
        now,
      )
      .run();
    const row = await this.db
      .prepare("SELECT * FROM weights WHERE local_date = ?")
      .bind(localDate)
      .first<WeightRow>();
    if (!row) throw new Error("Weight entry could not be saved.");
    return weightFromRow(row);
  }

  async getWeightTrend(days = 90) {
    const goals = await this.getGoals();
    const end = todayInTimezone(goals.timezone);
    const start = addDays(end, -(Math.max(2, days) - 1));
    const query = await this.db
      .prepare(`
        SELECT * FROM weights
        WHERE local_date BETWEEN ? AND ?
        ORDER BY local_date ASC
      `)
      .bind(start, end)
      .all<WeightRow>();
    const entries = query.results.map(weightFromRow);
    const normalized = entries.map((entry) => ({
      ...entry,
      weight: round(convertWeight(entry.weight, entry.unit, goals.weightUnit), 2),
      unit: goals.weightUnit,
    }));
    const first = normalized[0];
    const latest = normalized.at(-1);
    if (!first || !latest) {
      return {
        unit: goals.weightUnit,
        entries: normalized,
        change: null,
        weeklyRate: null,
        startWeight: first?.weight ?? null,
        latestWeight: latest?.weight ?? null,
        targetWeight: goals.targetWeight,
      };
    }
    const elapsedDays = Math.max(
      1,
      Math.round(
        (Date.parse(`${latest.localDate}T12:00:00Z`) -
          Date.parse(`${first.localDate}T12:00:00Z`)) /
          86_400_000,
      ),
    );
    const change = round(latest.weight - first.weight, 2);
    return {
      unit: goals.weightUnit,
      entries: normalized,
      change,
      weeklyRate:
        normalized.length < 2 ? null : round((change / elapsedDays) * 7, 2),
      startWeight: first.weight,
      latestWeight: latest.weight,
      targetWeight: goals.targetWeight,
    };
  }

  async saveMeal(input: {
    name: string;
    restaurant?: string;
    notes?: string;
    items: MealItemInput[];
  }): Promise<SavedMeal> {
    if (!input.items.length) throw new Error("A saved meal needs at least one item.");
    const now = new Date().toISOString();
    const existing = await this.db
      .prepare("SELECT id FROM saved_meals WHERE name = ? COLLATE NOCASE")
      .bind(input.name.trim())
      .first<{ id: string }>();
    const id = existing?.id ?? randomUUID();
    await this.db.batch([
      this.db
        .prepare(`
          INSERT INTO saved_meals (
            id, name, restaurant, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(name) DO UPDATE SET
            restaurant = excluded.restaurant,
            notes = excluded.notes,
            updated_at = excluded.updated_at
        `)
        .bind(
          id,
          input.name.trim(),
          input.restaurant?.trim() || null,
          input.notes?.trim() || null,
          now,
          now,
        ),
      this.db
        .prepare("DELETE FROM saved_meal_items WHERE saved_meal_id = ?")
        .bind(id),
      ...this.itemStatements("saved_meal_items", "saved_meal_id", id, input.items),
    ]);
    return (await this.getSavedMeal(id))!;
  }

  async listSavedMeals(): Promise<SavedMeal[]> {
    const query = await this.db
      .prepare("SELECT * FROM saved_meals ORDER BY updated_at DESC")
      .all<SavedMealRow>();
    return Promise.all(query.results.map((row) => this.savedMealFromRow(row)));
  }

  private async getSavedMeal(id: string): Promise<SavedMeal | null> {
    const row = await this.db
      .prepare("SELECT * FROM saved_meals WHERE id = ?")
      .bind(id)
      .first<SavedMealRow>();
    return row ? this.savedMealFromRow(row) : null;
  }

  private async savedMealFromRow(row: SavedMealRow): Promise<SavedMeal> {
    const query = await this.db
      .prepare(`
        SELECT id, name, serving_description, quantity, unit, calories,
               protein_g, carbs_g, fat_g, fiber_g, confidence,
               assumptions_json
        FROM saved_meal_items
        WHERE saved_meal_id = ?
        ORDER BY sort_order
      `)
      .bind(row.id)
      .all<ItemRow>();
    const items = query.results.map(itemFromRow);
    return {
      id: row.id,
      name: row.name,
      restaurant: row.restaurant,
      notes: row.notes,
      items,
      totals: sumNutrients(items.map(nutrientsFromItem)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async logSavedMeal(
    savedMealId: string,
    options: {
      mealType: MealInput["mealType"];
      eatenAt?: string;
      localDate?: string;
    },
  ): Promise<Meal> {
    const saved = await this.getSavedMeal(savedMealId);
    if (!saved) throw new Error(`Saved meal not found: ${savedMealId}`);
    return this.createMeal({
      name: saved.name,
      mealType: options.mealType,
      eatenAt: options.eatenAt,
      localDate: options.localDate,
      restaurant: saved.restaurant ?? undefined,
      source: "saved",
      confidence:
        saved.items.reduce((sum, item) => sum + item.confidence, 0) /
        Math.max(1, saved.items.length),
      assumptions: saved.notes ? [saved.notes] : [],
      items: saved.items,
    });
  }

  private async getLowConfidenceMeals(limit = 10): Promise<Meal[]> {
    const query = await this.db
      .prepare(`
        SELECT * FROM meals
        WHERE confidence < 0.7
        ORDER BY local_date DESC, eaten_at DESC
        LIMIT ?
      `)
      .bind(Math.max(1, Math.min(50, limit)))
      .all<MealRow>();
    return Promise.all(query.results.map((row) => this.mealFromRow(row)));
  }

  async getDashboard(date?: string) {
    const today = await this.getToday(date);
    const [week, weightTrend, savedMeals, lowConfidenceMeals] = await Promise.all([
      this.getWeek(today.date),
      this.getWeightTrend(90),
      this.listSavedMeals(),
      this.getLowConfidenceMeals(10),
    ]);
    return {
      kind: "nutrition_dashboard" as const,
      generatedAt: new Date().toISOString(),
      today,
      week,
      weightTrend,
      savedMeals: savedMeals.slice(0, 12),
      lowConfidenceMeals,
    };
  }
}
