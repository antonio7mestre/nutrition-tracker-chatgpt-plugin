export const MACRO_KEYS = [
  "calories",
  "proteinG",
  "carbsG",
  "fatG",
  "fiberG",
] as const;

export type MacroKey = (typeof MACRO_KEYS)[number];

export interface Nutrients {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface MealItemInput extends Nutrients {
  name: string;
  servingDescription: string;
  quantity?: number;
  unit?: string;
  confidence?: number;
  assumptions?: string[];
}

export interface MealInput {
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "other";
  eatenAt?: string;
  localDate?: string;
  restaurant?: string;
  source?: "photo" | "voice" | "text" | "restaurant" | "saved" | "manual";
  confidence?: number;
  assumptions?: string[];
  items: MealItemInput[];
}

export interface MealItem extends Required<MealItemInput> {
  id: string;
}

export interface Meal extends Omit<Required<MealInput>, "items" | "restaurant"> {
  id: string;
  restaurant: string | null;
  totals: Nutrients;
  items: MealItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Goals {
  calorieGoal: number | null;
  proteinGoalG: number | null;
  carbsGoalG: number | null;
  fatGoalG: number | null;
  fiberGoalG: number | null;
  targetWeight: number | null;
  weightUnit: "lb" | "kg";
  weeklyLossGoal: number | null;
  timezone: string;
  updatedAt: string | null;
}

export interface WeightEntry {
  id: string;
  localDate: string;
  weight: number;
  unit: "lb" | "kg";
  notes: string | null;
  createdAt: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  restaurant: string | null;
  notes: string | null;
  totals: Nutrients;
  items: MealItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DaySummary {
  date: string;
  totals: Nutrients;
  goals: Goals;
  remaining: {
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
    fiberG: number | null;
  };
  meals: Meal[];
}

export interface WeekDaySummary {
  date: string;
  totals: Nutrients;
  mealCount: number;
}

export interface WeekSummary {
  startDate: string;
  endDate: string;
  days: WeekDaySummary[];
  meals: Meal[];
  loggedDays: number;
  averages: Nutrients;
  calendarDayAverages: Nutrients;
  proteinGoalDays: number | null;
  proteinConsistencyPct: number | null;
  highestCalorieMeals: Array<{
    id: string;
    name: string;
    localDate: string;
    calories: number;
  }>;
}

export const ZERO_NUTRIENTS: Nutrients = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
};

export function round(value: number, digits = 1): number {
  const scale = 10 ** digits;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    calories: round(a.calories + b.calories),
    proteinG: round(a.proteinG + b.proteinG),
    carbsG: round(a.carbsG + b.carbsG),
    fatG: round(a.fatG + b.fatG),
    fiberG: round(a.fiberG + b.fiberG),
  };
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  return items.reduce(addNutrients, { ...ZERO_NUTRIENTS });
}

export function divideNutrients(value: Nutrients, divisor: number): Nutrients {
  if (divisor <= 0) return { ...ZERO_NUTRIENTS };
  return {
    calories: round(value.calories / divisor),
    proteinG: round(value.proteinG / divisor),
    carbsG: round(value.carbsG / divisor),
    fatG: round(value.fatG / divisor),
    fiberG: round(value.fiberG / divisor),
  };
}

export function clampConfidence(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0.8;
  return round(Math.max(0, Math.min(1, value)), 2);
}

export function mealConfidence(input: MealInput): number {
  if (input.confidence !== undefined) return clampConfidence(input.confidence);
  if (input.items.length === 0) return 0;
  return round(
    input.items.reduce((sum, item) => sum + clampConfidence(item.confidence), 0) /
      input.items.length,
    2,
  );
}
