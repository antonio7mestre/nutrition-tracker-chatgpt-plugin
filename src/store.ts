import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
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
      goals.calorieGoal === null
        ? null
        : round(goals.calorieGoal - totals.calories),
    proteinG:
      goals.proteinGoalG === null
        ? null
        : round(goals.proteinGoalG - totals.proteinG),
    carbsG:
      goals.carbsGoalG === null
        ? null
        : round(goals.carbsGoalG - totals.carbsG),
    fatG:
      goals.fatGoalG === null
        ? null
        : round(goals.fatGoalG - totals.fatG),
    fiberG:
      goals.fiberGoalG === null
        ? null
        : round(goals.fiberGoalG - totals.fiberG),
  };
}

export class NutritionStore {
  readonly dbPath: string;
  private readonly db: DatabaseSync;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.migrate();
  }

  close(): void {
    this.db.close();
  }

  private migrate(): void {
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        local_date TEXT NOT NULL,
        eaten_at TEXT NOT NULL,
        name TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        restaurant TEXT,
        source TEXT NOT NULL,
        confidence REAL NOT NULL,
        assumptions_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_meals_local_date
        ON meals(local_date, eaten_at);

      CREATE TABLE IF NOT EXISTS meal_items (
        id TEXT PRIMARY KEY,
        meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        name TEXT NOT NULL,
        serving_description TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit TEXT NOT NULL DEFAULT 'serving',
        calories REAL NOT NULL,
        protein_g REAL NOT NULL,
        carbs_g REAL NOT NULL,
        fat_g REAL NOT NULL,
        fiber_g REAL NOT NULL,
        confidence REAL NOT NULL,
        assumptions_json TEXT NOT NULL DEFAULT '[]'
      );

      CREATE INDEX IF NOT EXISTS idx_meal_items_meal
        ON meal_items(meal_id, sort_order);

      CREATE TABLE IF NOT EXISTS weights (
        id TEXT PRIMARY KEY,
        local_date TEXT NOT NULL UNIQUE,
        weight REAL NOT NULL,
        unit TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        calorie_goal REAL,
        protein_goal_g REAL,
        carbs_goal_g REAL,
        fat_goal_g REAL,
        fiber_goal_g REAL,
        target_weight REAL,
        weight_unit TEXT NOT NULL DEFAULT 'lb',
        weekly_loss_goal REAL,
        timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS saved_meals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        restaurant TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS saved_meal_items (
        id TEXT PRIMARY KEY,
        saved_meal_id TEXT NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        name TEXT NOT NULL,
        serving_description TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit TEXT NOT NULL DEFAULT 'serving',
        calories REAL NOT NULL,
        protein_g REAL NOT NULL,
        carbs_g REAL NOT NULL,
        fat_g REAL NOT NULL,
        fiber_g REAL NOT NULL,
        confidence REAL NOT NULL,
        assumptions_json TEXT NOT NULL DEFAULT '[]'
      );
    `);
  }

  getGoals(): Goals {
    const row = this.db
      .prepare("SELECT * FROM goals WHERE id = 1")
      .get() as GoalRow | undefined;
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

  setGoals(
    patch: Partial<Omit<Goals, "updatedAt">>,
  ): Goals {
    const current = this.getGoals();
    const next = { ...current, ...patch };
    new Intl.DateTimeFormat("en-US", { timeZone: next.timezone }).format(new Date());
    const now = new Date().toISOString();
    this.db
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
      .run(
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
      );
    return this.getGoals();
  }

  normalizeMeal(input: MealInput): MealInput & {
    eatenAt: string;
    localDate: string;
    source: NonNullable<MealInput["source"]>;
    confidence: number;
    assumptions: string[];
  } {
    if (!input.items.length) throw new Error("A meal must contain at least one item.");
    const goals = this.getGoals();
    const eatenDate = input.eatenAt ? new Date(input.eatenAt) : new Date();
    if (Number.isNaN(eatenDate.getTime())) {
      throw new Error("eatenAt must be a valid ISO date-time.");
    }
    const localDate =
      input.localDate ?? localDateInTimezone(eatenDate, goals.timezone);
    if (!isLocalDate(localDate)) {
      throw new Error("localDate must use YYYY-MM-DD.");
    }
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

  previewMeal(input: MealInput): {
    kind: "meal_preview";
    meal: ReturnType<NutritionStore["normalizeMeal"]> & { totals: Nutrients };
    day: DaySummary;
    projectedDay: {
      date: string;
      totals: Nutrients;
      goals: Goals;
      remaining: DaySummary["remaining"];
      savedMealCount: number;
    };
    requiresConfirmation: true;
    lowConfidence: boolean;
  } {
    const meal = this.normalizeMeal(input);
    const mealTotals = sumNutrients(meal.items.map(nutrientsFromItem));
    const day = this.getToday(meal.localDate);
    const projectedTotals = addNutrients(day.totals, mealTotals);
    return {
      kind: "meal_preview",
      meal: {
        ...meal,
        totals: mealTotals,
      },
      day,
      projectedDay: {
        date: day.date,
        totals: projectedTotals,
        goals: day.goals,
        remaining: remainingForTotals(day.goals, projectedTotals),
        savedMealCount: day.meals.length,
      },
      requiresConfirmation: true,
      lowConfidence: meal.confidence < 0.7,
    };
  }

  createMeal(input: MealInput): Meal {
    const meal = this.normalizeMeal(input);
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare(`
          INSERT INTO meals (
            id, local_date, eaten_at, name, meal_type, restaurant, source,
            confidence, assumptions_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
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
        );
      this.insertMealItems("meal_items", "meal_id", id, meal.items);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return this.getMeal(id)!;
  }

  updateMeal(id: string, patch: Partial<MealInput>): Meal {
    const current = this.getMeal(id);
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
    const meal = this.normalizeMeal(merged);
    const now = new Date().toISOString();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare(`
          UPDATE meals SET
            local_date = ?, eaten_at = ?, name = ?, meal_type = ?,
            restaurant = ?, source = ?, confidence = ?, assumptions_json = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .run(
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
        );
      this.db.prepare("DELETE FROM meal_items WHERE meal_id = ?").run(id);
      this.insertMealItems("meal_items", "meal_id", id, meal.items);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return this.getMeal(id)!;
  }

  deleteMeal(id: string): boolean {
    const result = this.db.prepare("DELETE FROM meals WHERE id = ?").run(id);
    return Number(result.changes) > 0;
  }

  getMeal(id: string): Meal | null {
    const row = this.db
      .prepare("SELECT * FROM meals WHERE id = ?")
      .get(id) as MealRow | undefined;
    return row ? this.mealFromRow(row) : null;
  }

  private mealFromRow(row: MealRow): Meal {
    const items = (
      this.db
        .prepare(`
          SELECT id, name, serving_description, quantity, unit, calories,
                 protein_g, carbs_g, fat_g, fiber_g, confidence,
                 assumptions_json
          FROM meal_items
          WHERE meal_id = ?
          ORDER BY sort_order
        `)
        .all(row.id) as unknown as ItemRow[]
    ).map(itemFromRow);
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

  private mealsBetween(startDate: string, endDate: string): Meal[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM meals
        WHERE local_date BETWEEN ? AND ?
        ORDER BY local_date DESC, eaten_at DESC
      `)
      .all(startDate, endDate) as unknown as MealRow[];
    return rows.map((row) => this.mealFromRow(row));
  }

  getToday(date?: string): DaySummary {
    const goals = this.getGoals();
    const targetDate = date ?? todayInTimezone(goals.timezone);
    if (!isLocalDate(targetDate)) throw new Error("date must use YYYY-MM-DD.");
    const meals = this.mealsBetween(targetDate, targetDate);
    const totals = sumNutrients(meals.map((meal) => meal.totals));
    return {
      date: targetDate,
      totals,
      goals,
      remaining: remainingForTotals(goals, totals),
      meals,
    };
  }

  getWeek(endDate?: string): WeekSummary {
    const goals = this.getGoals();
    const resolvedEnd = endDate ?? todayInTimezone(goals.timezone);
    if (!isLocalDate(resolvedEnd)) throw new Error("endDate must use YYYY-MM-DD.");
    const startDate = addDays(resolvedEnd, -6);
    const meals = this.mealsBetween(startDate, resolvedEnd);
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

  logWeight(input: {
    localDate?: string;
    weight: number;
    unit?: WeightEntry["unit"];
    notes?: string;
  }): WeightEntry {
    const goals = this.getGoals();
    const localDate = input.localDate ?? todayInTimezone(goals.timezone);
    if (!isLocalDate(localDate)) throw new Error("localDate must use YYYY-MM-DD.");
    const unit = input.unit ?? goals.weightUnit;
    const now = new Date().toISOString();
    const id = randomUUID();
    this.db
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
      .run(
        id,
        localDate,
        round(input.weight, 2),
        unit,
        input.notes?.trim() || null,
        now,
        now,
      );
    const row = this.db
      .prepare("SELECT * FROM weights WHERE local_date = ?")
      .get(localDate) as unknown as WeightRow;
    return this.weightFromRow(row);
  }

  private weightFromRow(row: WeightRow): WeightEntry {
    return {
      id: row.id,
      localDate: row.local_date,
      weight: row.weight,
      unit: row.unit,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  getWeightTrend(days = 90): {
    unit: WeightEntry["unit"];
    entries: WeightEntry[];
    change: number | null;
    weeklyRate: number | null;
    startWeight: number | null;
    latestWeight: number | null;
    targetWeight: number | null;
  } {
    const goals = this.getGoals();
    const end = todayInTimezone(goals.timezone);
    const start = addDays(end, -(Math.max(2, days) - 1));
    const rows = this.db
      .prepare(`
        SELECT * FROM weights
        WHERE local_date BETWEEN ? AND ?
        ORDER BY local_date ASC
      `)
      .all(start, end) as unknown as WeightRow[];
    const entries = rows.map((row) => this.weightFromRow(row));
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
      weeklyRate: normalized.length < 2 ? null : round((change / elapsedDays) * 7, 2),
      startWeight: first.weight,
      latestWeight: latest.weight,
      targetWeight: goals.targetWeight,
    };
  }

  saveMeal(input: {
    name: string;
    restaurant?: string;
    notes?: string;
    items: MealItemInput[];
  }): SavedMeal {
    if (!input.items.length) throw new Error("A saved meal needs at least one item.");
    const now = new Date().toISOString();
    const existing = this.db
      .prepare("SELECT id FROM saved_meals WHERE name = ? COLLATE NOCASE")
      .get(input.name.trim()) as { id: string } | undefined;
    const id = existing?.id ?? randomUUID();
    this.db.exec("BEGIN IMMEDIATE");
    try {
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
        .run(
          id,
          input.name.trim(),
          input.restaurant?.trim() || null,
          input.notes?.trim() || null,
          now,
          now,
        );
      const resolved = this.db
        .prepare("SELECT id FROM saved_meals WHERE name = ? COLLATE NOCASE")
        .get(input.name.trim()) as { id: string };
      this.db
        .prepare("DELETE FROM saved_meal_items WHERE saved_meal_id = ?")
        .run(resolved.id);
      this.insertMealItems(
        "saved_meal_items",
        "saved_meal_id",
        resolved.id,
        input.items,
      );
      this.db.exec("COMMIT");
      return this.getSavedMeal(resolved.id)!;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  listSavedMeals(): SavedMeal[] {
    const rows = this.db
      .prepare("SELECT * FROM saved_meals ORDER BY updated_at DESC")
      .all() as unknown as SavedMealRow[];
    return rows.map((row) => this.savedMealFromRow(row));
  }

  getSavedMeal(id: string): SavedMeal | null {
    const row = this.db
      .prepare("SELECT * FROM saved_meals WHERE id = ?")
      .get(id) as SavedMealRow | undefined;
    return row ? this.savedMealFromRow(row) : null;
  }

  private savedMealFromRow(row: SavedMealRow): SavedMeal {
    const items = (
      this.db
        .prepare(`
          SELECT id, name, serving_description, quantity, unit, calories,
                 protein_g, carbs_g, fat_g, fiber_g, confidence,
                 assumptions_json
          FROM saved_meal_items
          WHERE saved_meal_id = ?
          ORDER BY sort_order
        `)
        .all(row.id) as unknown as ItemRow[]
    ).map(itemFromRow);
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

  logSavedMeal(
    savedMealId: string,
    options: {
      mealType: MealInput["mealType"];
      eatenAt?: string;
      localDate?: string;
    },
  ): Meal {
    const saved = this.getSavedMeal(savedMealId);
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

  getLowConfidenceMeals(limit = 10): Meal[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM meals
        WHERE confidence < 0.7
        ORDER BY local_date DESC, eaten_at DESC
        LIMIT ?
      `)
      .all(Math.max(1, Math.min(50, limit))) as unknown as MealRow[];
    return rows.map((row) => this.mealFromRow(row));
  }

  getDashboard(date?: string): {
    kind: "nutrition_dashboard";
    generatedAt: string;
    today: DaySummary;
    week: WeekSummary;
    weightTrend: ReturnType<NutritionStore["getWeightTrend"]>;
    savedMeals: SavedMeal[];
    lowConfidenceMeals: Meal[];
  } {
    const today = this.getToday(date);
    return {
      kind: "nutrition_dashboard",
      generatedAt: new Date().toISOString(),
      today,
      week: this.getWeek(today.date),
      weightTrend: this.getWeightTrend(90),
      savedMeals: this.listSavedMeals().slice(0, 12),
      lowConfidenceMeals: this.getLowConfidenceMeals(10),
    };
  }

  private insertMealItems(
    table: "meal_items" | "saved_meal_items",
    parentColumn: "meal_id" | "saved_meal_id",
    parentId: string,
    items: MealItemInput[],
  ): void {
    const statement = this.db.prepare(`
      INSERT INTO ${table} (
        id, ${parentColumn}, sort_order, name, serving_description, quantity,
        unit, calories, protein_g, carbs_g, fat_g, fiber_g, confidence,
        assumptions_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    items.forEach((item, index) => {
      statement.run(
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
      );
    });
  }
}
