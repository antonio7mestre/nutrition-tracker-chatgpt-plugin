import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import * as z from "zod/v4";
import type { NutritionStoreApi } from "./store-api.js";
import {
  genericObjectOutputSchema,
  mealItemSchema,
  mealPatchSchema,
  mealSchema,
} from "./schemas.js";
import { WIDGET_HTML, WIDGET_URI } from "./widget.js";
import type { MealInput } from "./domain.js";

function result(kind: string, data: Record<string, unknown>, text: string) {
  return {
    structuredContent: { kind, ...data },
    content: [{ type: "text" as const, text }],
  };
}

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;

const localWrite = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
} as const;

export function createNutritionServer(store: NutritionStoreApi): McpServer {
  const server = new McpServer(
    {
      name: "nutrition-tracker",
      version: "0.1.0",
    },
    {
      instructions:
        "For every newly analyzed meal, call log_meal immediately so the embedded UI shows the saved ingredient breakdown and totals for that meal's local date. Use preview_meal only when the user specifically asks to review an estimate before saving. The host interprets photos, voice, and natural-language corrections; this server validates, calculates, stores, and reports structured nutrition data. Use get_meal and edit_meal to apply later corrections without an extra confirmation step. Use the user's stated date when provided; otherwise dates are local to the timezone in goals. Use render_dashboard for the embedded visual dashboard. The embedded UI already contains the totals and ingredient list, so do not repeat them in a second long text response.",
    },
  );

  registerAppResource(
    server,
    "Nutrition meal and daily totals UI",
    WIDGET_URI,
    {
      description:
        "Interactive ingredient breakdown, post-save correction, daily totals, and nutrition dashboard for Nutrition Tracker.",
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: WIDGET_HTML,
          _meta: {
            ui: {
              prefersBorder: false,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
          },
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "preview_meal",
    {
      title: "Preview meal estimate",
      description:
        "Optionally calculate a meal estimate without saving it when the user explicitly asks for a preview. The card includes projected daily totals for the meal's exact local date.",
      inputSchema: mealSchema,
      outputSchema: genericObjectOutputSchema,
      annotations: readOnly,
      _meta: {
        ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Calculating meal estimate…",
        "openai/toolInvocation/invoked": "Meal estimate ready.",
      },
    },
    async (input) => {
      const preview = await store.previewMeal(input as MealInput);
      return {
        structuredContent: preview,
        content: [
          {
            type: "text",
            text: `Estimated ${preview.meal.totals.calories} calories and ${preview.meal.totals.proteinG}g protein. If saved, ${preview.projectedDay.date} would total ${preview.projectedDay.totals.calories} calories and ${preview.projectedDay.totals.proteinG}g protein.`,
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "log_meal",
    {
      title: "Log analyzed meal",
      description:
        "Immediately save a newly analyzed meal. No separate review or confirmation is required; the user can correct it afterward with edit_meal.",
      inputSchema: mealSchema,
      outputSchema: genericObjectOutputSchema,
      annotations: localWrite,
      _meta: {
        ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Saving meal…",
        "openai/toolInvocation/invoked": "Meal saved.",
      },
    },
    async (input) => {
      const meal = await store.createMeal(input as MealInput);
      const day = await store.getToday(meal.localDate);
      return result(
        "meal_saved",
        { meal, day },
        `Saved ${meal.name}. ${day.date} now totals ${day.totals.calories} calories and ${day.totals.proteinG}g protein.`,
      );
    },
  );

  server.registerTool(
    "get_meal",
    {
      title: "Get meal",
      description:
        "Retrieve one meal by its stable ID before applying a correction.",
      inputSchema: {
        mealId: z.string().uuid(),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: readOnly,
    },
    async ({ mealId }) => {
      const meal = await store.getMeal(mealId);
      if (!meal) throw new Error(`Meal not found: ${mealId}`);
      return result("meal", { meal }, `Retrieved ${meal.name}.`);
    },
  );

  registerAppTool(
    server,
    "edit_meal",
    {
      title: "Edit saved meal",
      description:
        "Update a specific saved meal from the user's natural-language correction. Retrieve it first when needed and apply only the requested change; no separate confirmation is required.",
      inputSchema: {
        mealId: z.string().uuid(),
        ...mealPatchSchema,
      },
      outputSchema: genericObjectOutputSchema,
      annotations: localWrite,
      _meta: {
        ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Updating meal…",
        "openai/toolInvocation/invoked": "Meal updated.",
      },
    },
    async ({ mealId, ...patch }) => {
      const meal = await store.updateMeal(mealId, patch as Partial<MealInput>);
      const day = await store.getToday(meal.localDate);
      return result(
        "meal_saved",
        { meal, day },
        `Updated ${meal.name}. ${day.date} now totals ${day.totals.calories} calories.`,
      );
    },
  );

  server.registerTool(
    "delete_meal",
    {
      title: "Delete meal",
      description:
        "Permanently remove one specific meal after the user explicitly asks to delete it.",
      inputSchema: {
        mealId: z.string().uuid(),
        confirmed: z.literal(true),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      },
    },
    async ({ mealId }) => {
      const deleted = await store.deleteMeal(mealId);
      if (!deleted) throw new Error(`Meal not found: ${mealId}`);
      return result("meal_deleted", { mealId }, "Deleted the meal.");
    },
  );

  registerAppTool(
    server,
    "get_today",
    {
      title: "Get daily nutrition",
      description:
        "Get meals, totals, goals, and remaining calories/macros for today or a specific local date.",
      inputSchema: {
        date: z.iso.date().optional(),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: readOnly,
      _meta: {
        ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Calculating daily totals…",
        "openai/toolInvocation/invoked": "Daily totals ready.",
      },
    },
    async ({ date }) => {
      const day = await store.getToday(date);
      return result(
        "day_summary",
        { day },
        `${day.date}: ${day.totals.calories} calories and ${day.totals.proteinG}g protein across ${day.meals.length} meals.`,
      );
    },
  );

  server.registerTool(
    "get_week",
    {
      title: "Get seven-day nutrition",
      description:
        "Get a seven-day nutrition summary ending on a date, including averages, protein consistency, all meals, and highest-calorie meals.",
      inputSchema: {
        endDate: z.iso.date().optional(),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: readOnly,
    },
    async ({ endDate }) => {
      const week = await store.getWeek(endDate);
      return result(
        "week_summary",
        { week },
        `${week.startDate} to ${week.endDate}: ${week.averages.calories} average calories on ${week.loggedDays} logged days.`,
      );
    },
  );

  registerAppTool(
    server,
    "render_dashboard",
    {
      title: "Show nutrition dashboard",
      description:
        "Render the opinionated nutrition dashboard for today or a specific local date, plus seven-day trends, weight, saved meals, and low-confidence entries.",
      inputSchema: {
        date: z.iso.date().optional(),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: readOnly,
      _meta: {
        ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Building nutrition dashboard…",
        "openai/toolInvocation/invoked": "Nutrition dashboard ready.",
      },
    },
    async ({ date }) => {
      const dashboard = await store.getDashboard(date);
      return {
        structuredContent: dashboard,
        content: [
          {
            type: "text",
            text: `Dashboard for ${dashboard.today.date}: ${dashboard.today.totals.calories} calories and ${dashboard.today.totals.proteinG}g protein.`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "set_goals",
    {
      title: "Set nutrition and weight goals",
      description:
        "Set or clear daily calorie, protein, carbs, fat, fiber, target weight, weekly loss, weight unit, and timezone goals. Omitted fields stay unchanged; null clears a goal.",
      inputSchema: {
        calorieGoal: z.number().positive().max(20_000).nullable().optional(),
        proteinGoalG: z.number().positive().max(2_000).nullable().optional(),
        carbsGoalG: z.number().positive().max(5_000).nullable().optional(),
        fatGoalG: z.number().positive().max(2_000).nullable().optional(),
        fiberGoalG: z.number().positive().max(500).nullable().optional(),
        targetWeight: z.number().positive().max(2_000).nullable().optional(),
        weightUnit: z.enum(["lb", "kg"]).optional(),
        weeklyLossGoal: z.number().nonnegative().max(20).nullable().optional(),
        timezone: z.string().min(1).max(100).optional(),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: localWrite,
    },
    async (patch) => {
      const goals = await store.setGoals(patch);
      return result("goals", { goals }, "Updated nutrition goals.");
    },
  );

  server.registerTool(
    "get_goals",
    {
      title: "Get goals",
      description: "Retrieve current nutrition, weight, and timezone goals.",
      inputSchema: {},
      outputSchema: genericObjectOutputSchema,
      annotations: readOnly,
    },
    async () => {
      const goals = await store.getGoals();
      return result("goals", { goals }, "Retrieved current goals.");
    },
  );

  server.registerTool(
    "log_weight",
    {
      title: "Log weight",
      description:
        "Save or replace a weight entry for a local date after the user asks to log it.",
      inputSchema: {
        localDate: z.iso.date().optional(),
        weight: z.number().positive().max(2_000),
        unit: z.enum(["lb", "kg"]).optional(),
        notes: z.string().trim().max(500).optional(),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: localWrite,
    },
    async (input) => {
      const weight = await store.logWeight(input);
      const trend = await store.getWeightTrend(90);
      return result(
        "weight_saved",
        { weight, trend },
        `Saved ${weight.weight} ${weight.unit} for ${weight.localDate}.`,
      );
    },
  );

  server.registerTool(
    "get_weight_trend",
    {
      title: "Get weight trend",
      description:
        "Get weight entries and the descriptive rate of change for a recent period.",
      inputSchema: {
        days: z.number().int().min(2).max(730).optional(),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: readOnly,
    },
    async ({ days }) => {
      const trend = await store.getWeightTrend(days ?? 90);
      return result(
        "weight_trend",
        { trend },
        trend.latestWeight === null
          ? "No weight entries found."
          : `Latest weight: ${trend.latestWeight} ${trend.unit}; descriptive weekly rate: ${trend.weeklyRate ?? "not enough data"}.`,
      );
    },
  );

  server.registerTool(
    "save_meal",
    {
      title: "Save reusable meal",
      description:
        "Immediately save or replace a reusable meal or restaurant order after the user asks for it.",
      inputSchema: {
        name: z.string().trim().min(1).max(160),
        restaurant: z.string().trim().min(1).max(160).optional(),
        notes: z.string().trim().max(500).optional(),
        items: z.array(z.object(mealItemSchema)).min(1).max(50),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: localWrite,
    },
    async (input) => {
      const savedMeal = await store.saveMeal(input);
      return result(
        "saved_meal",
        { savedMeal },
        `Saved ${savedMeal.name} for quick reuse.`,
      );
    },
  );

  server.registerTool(
    "list_saved_meals",
    {
      title: "List saved meals",
      description: "List reusable meals and restaurant orders with nutrition totals.",
      inputSchema: {},
      outputSchema: genericObjectOutputSchema,
      annotations: readOnly,
    },
    async () => {
      const savedMeals = await store.listSavedMeals();
      return result(
        "saved_meals",
        { savedMeals },
        `Found ${savedMeals.length} saved meals.`,
      );
    },
  );

  registerAppTool(
    server,
    "log_saved_meal",
    {
      title: "Log saved meal",
      description:
        "Immediately add a known saved meal or restaurant order to nutrition history after the user names or chooses it.",
      inputSchema: {
        savedMealId: z.string().uuid(),
        mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]),
        eatenAt: z.iso.datetime({ offset: true }).optional(),
        localDate: z.iso.date().optional(),
      },
      outputSchema: genericObjectOutputSchema,
      annotations: localWrite,
      _meta: {
        ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Logging saved meal…",
        "openai/toolInvocation/invoked": "Saved meal logged.",
      },
    },
    async ({
      savedMealId,
      mealType,
      eatenAt,
      localDate,
    }) => {
      const meal = await store.logSavedMeal(savedMealId, {
        mealType,
        eatenAt,
        localDate,
      });
      const day = await store.getToday(meal.localDate);
      return result(
        "meal_saved",
        { meal, day },
        `Logged saved meal ${meal.name}. ${day.date} now totals ${day.totals.calories} calories.`,
      );
    },
  );

  return server;
}
