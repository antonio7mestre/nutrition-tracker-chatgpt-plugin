import type { NutritionStore } from "./store.js";

export type Awaitable<T> = T | Promise<T>;

export interface NutritionStoreApi {
  previewMeal(
    input: Parameters<NutritionStore["previewMeal"]>[0],
  ): Awaitable<ReturnType<NutritionStore["previewMeal"]>>;
  createMeal(
    input: Parameters<NutritionStore["createMeal"]>[0],
  ): Awaitable<ReturnType<NutritionStore["createMeal"]>>;
  updateMeal(
    id: Parameters<NutritionStore["updateMeal"]>[0],
    patch: Parameters<NutritionStore["updateMeal"]>[1],
  ): Awaitable<ReturnType<NutritionStore["updateMeal"]>>;
  deleteMeal(
    id: Parameters<NutritionStore["deleteMeal"]>[0],
  ): Awaitable<ReturnType<NutritionStore["deleteMeal"]>>;
  getMeal(
    id: Parameters<NutritionStore["getMeal"]>[0],
  ): Awaitable<ReturnType<NutritionStore["getMeal"]>>;
  getToday(
    date?: Parameters<NutritionStore["getToday"]>[0],
  ): Awaitable<ReturnType<NutritionStore["getToday"]>>;
  getWeek(
    endDate?: Parameters<NutritionStore["getWeek"]>[0],
  ): Awaitable<ReturnType<NutritionStore["getWeek"]>>;
  getGoals(): Awaitable<ReturnType<NutritionStore["getGoals"]>>;
  setGoals(
    patch: Parameters<NutritionStore["setGoals"]>[0],
  ): Awaitable<ReturnType<NutritionStore["setGoals"]>>;
  logWeight(
    input: Parameters<NutritionStore["logWeight"]>[0],
  ): Awaitable<ReturnType<NutritionStore["logWeight"]>>;
  getWeightTrend(
    days?: Parameters<NutritionStore["getWeightTrend"]>[0],
  ): Awaitable<ReturnType<NutritionStore["getWeightTrend"]>>;
  saveMeal(
    input: Parameters<NutritionStore["saveMeal"]>[0],
  ): Awaitable<ReturnType<NutritionStore["saveMeal"]>>;
  listSavedMeals(): Awaitable<ReturnType<NutritionStore["listSavedMeals"]>>;
  logSavedMeal(
    savedMealId: Parameters<NutritionStore["logSavedMeal"]>[0],
    options: Parameters<NutritionStore["logSavedMeal"]>[1],
  ): Awaitable<ReturnType<NutritionStore["logSavedMeal"]>>;
  getDashboard(
    date?: Parameters<NutritionStore["getDashboard"]>[0],
  ): Awaitable<ReturnType<NutritionStore["getDashboard"]>>;
}
