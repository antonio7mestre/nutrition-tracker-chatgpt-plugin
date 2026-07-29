import assert from "node:assert/strict";
import test from "node:test";
import { NutritionStore } from "../src/store.js";
import type { MealInput } from "../src/domain.js";

function chickenBowl(overrides: Partial<MealInput> = {}): MealInput {
  return {
    name: "Chicken rice bowl",
    mealType: "lunch",
    localDate: "2026-07-28",
    eatenAt: "2026-07-28T19:00:00.000Z",
    source: "text",
    confidence: 0.72,
    assumptions: ["Rice estimated at one cooked cup."],
    items: [
      {
        name: "Chicken breast",
        servingDescription: "2 cooked breasts, about 12 oz total",
        calories: 560,
        proteinG: 104,
        carbsG: 0,
        fatG: 12,
        fiberG: 0,
        confidence: 0.8,
      },
      {
        name: "Cooked rice",
        servingDescription: "1 cup",
        calories: 205,
        proteinG: 4.3,
        carbsG: 44.5,
        fatG: 0.4,
        fiberG: 0.6,
        confidence: 0.7,
      },
      {
        name: "Avocado",
        servingDescription: "1/2 medium",
        calories: 120,
        proteinG: 1.5,
        carbsG: 6.4,
        fatG: 11,
        fiberG: 5,
        confidence: 0.75,
      },
    ],
    ...overrides,
  };
}

test("previews without saving and calculates totals", () => {
  const store = new NutritionStore(":memory:");
  const preview = store.previewMeal(chickenBowl());

  assert.equal(preview.kind, "meal_preview");
  assert.equal(preview.requiresConfirmation, true);
  assert.equal(preview.meal.totals.calories, 885);
  assert.equal(preview.meal.totals.proteinG, 109.8);
  assert.equal(preview.day.date, "2026-07-28");
  assert.equal(preview.day.totals.calories, 0);
  assert.equal(preview.projectedDay.date, "2026-07-28");
  assert.equal(preview.projectedDay.totals.calories, 885);
  assert.equal(preview.projectedDay.savedMealCount, 0);
  assert.equal(store.getToday("2026-07-28").meals.length, 0);
  store.close();
});

test("projects meal analysis totals only onto the selected local date", () => {
  const store = new NutritionStore(":memory:");
  store.createMeal(chickenBowl());

  const sameDay = store.previewMeal(
    chickenBowl({ name: "Dinner bowl", mealType: "dinner" }),
  );
  assert.equal(sameDay.day.totals.calories, 885);
  assert.equal(sameDay.projectedDay.totals.calories, 1770);
  assert.equal(sameDay.projectedDay.savedMealCount, 1);

  const nextDay = store.previewMeal(
    chickenBowl({
      name: "Next day bowl",
      localDate: "2026-07-29",
      eatenAt: "2026-07-29T19:00:00.000Z",
    }),
  );
  assert.equal(nextDay.day.date, "2026-07-29");
  assert.equal(nextDay.day.totals.calories, 0);
  assert.equal(nextDay.projectedDay.totals.calories, 885);
  assert.equal(nextDay.projectedDay.savedMealCount, 0);
  store.close();
});

test("creates, retrieves, edits, and deletes a meal", () => {
  const store = new NutritionStore(":memory:");
  const created = store.createMeal(chickenBowl());

  assert.match(created.id, /^[0-9a-f-]{36}$/);
  assert.equal(store.getToday("2026-07-28").totals.calories, 885);
  assert.equal(store.getMeal(created.id)?.items.length, 3);

  const edited = store.updateMeal(created.id, {
    name: "Large chicken rice bowl",
    items: chickenBowl().items.map((item) =>
      item.name === "Cooked rice"
        ? { ...item, servingDescription: "2 cups", calories: 410, carbsG: 89 }
        : item,
    ),
  });
  assert.equal(edited.name, "Large chicken rice bowl");
  assert.equal(edited.totals.calories, 1090);
  assert.equal(store.getToday("2026-07-28").totals.carbsG, 95.4);

  assert.equal(store.deleteMeal(created.id), true);
  assert.equal(store.getMeal(created.id), null);
  assert.equal(store.getToday("2026-07-28").meals.length, 0);
  store.close();
});

test("computes remaining goals and seven-day statistics", () => {
  const store = new NutritionStore(":memory:");
  store.setGoals({
    calorieGoal: 2_000,
    proteinGoalG: 150,
    carbsGoalG: 220,
    fatGoalG: 70,
    fiberGoalG: 30,
    timezone: "America/Los_Angeles",
  });
  store.createMeal(chickenBowl());
  store.createMeal(
    chickenBowl({
      name: "Second day bowl",
      localDate: "2026-07-29",
      eatenAt: "2026-07-29T19:00:00.000Z",
    }),
  );

  const day = store.getToday("2026-07-29");
  assert.equal(day.remaining.calories, 1115);
  assert.equal(day.remaining.proteinG, 40.2);

  const week = store.getWeek("2026-07-29");
  assert.equal(week.loggedDays, 2);
  assert.equal(week.averages.calories, 885);
  assert.equal(week.calendarDayAverages.calories, 252.9);
  assert.equal(week.proteinGoalDays, 0);
  assert.equal(week.proteinConsistencyPct, 0);
  assert.equal(week.highestCalorieMeals.length, 2);
  store.close();
});

test("upserts weights and calculates a descriptive weekly rate", () => {
  const store = new NutritionStore(":memory:");
  store.setGoals({ weightUnit: "lb", targetWeight: 170 });
  store.logWeight({ localDate: "2026-07-22", weight: 180, unit: "lb" });
  store.logWeight({ localDate: "2026-07-29", weight: 178, unit: "lb" });
  const replacement = store.logWeight({
    localDate: "2026-07-29",
    weight: 177.5,
    unit: "lb",
  });

  assert.equal(replacement.weight, 177.5);
  const trend = store.getWeightTrend(30);
  assert.equal(trend.entries.length, 2);
  assert.equal(trend.change, -2.5);
  assert.equal(trend.weeklyRate, -2.5);
  assert.equal(trend.targetWeight, 170);
  store.close();
});

test("saves and logs a recurring meal", () => {
  const store = new NutritionStore(":memory:");
  const saved = store.saveMeal({
    name: "Usual lunch",
    restaurant: "Sweetgreen",
    notes: "Dressing on the side.",
    items: chickenBowl().items,
  });
  assert.equal(store.listSavedMeals().length, 1);
  assert.equal(saved.totals.calories, 885);

  const logged = store.logSavedMeal(saved.id, {
    mealType: "lunch",
    localDate: "2026-07-29",
  });
  assert.equal(logged.source, "saved");
  assert.equal(logged.restaurant, "Sweetgreen");
  assert.equal(store.getToday("2026-07-29").totals.calories, 885);
  store.close();
});

test("dashboard surfaces low-confidence meals", () => {
  const store = new NutritionStore(":memory:");
  store.createMeal(
    chickenBowl({
      name: "Uncertain restaurant bowl",
      confidence: 0.55,
      localDate: "2026-07-29",
      eatenAt: "2026-07-29T19:00:00.000Z",
    }),
  );
  const dashboard = store.getDashboard("2026-07-29");
  assert.equal(dashboard.kind, "nutrition_dashboard");
  assert.equal(dashboard.lowConfidenceMeals.length, 1);
  assert.equal(dashboard.lowConfidenceMeals[0]?.name, "Uncertain restaurant bowl");
  store.close();
});
