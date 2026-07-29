import * as z from "zod/v4";

const nutrient = z.number().finite().nonnegative().max(100_000);
const confidence = z.number().finite().min(0).max(1);

export const mealItemSchema = {
  name: z.string().trim().min(1).max(160),
  servingDescription: z.string().trim().min(1).max(240),
  quantity: z.number().finite().positive().max(1_000).optional(),
  unit: z.string().trim().min(1).max(40).optional(),
  calories: nutrient.describe("Total calories for this described portion."),
  proteinG: nutrient.describe("Total protein grams for this described portion."),
  carbsG: nutrient.describe("Total carbohydrate grams for this described portion."),
  fatG: nutrient.describe("Total fat grams for this described portion."),
  fiberG: nutrient.describe("Total fiber grams for this described portion."),
  confidence: confidence.optional(),
  assumptions: z.array(z.string().trim().min(1).max(240)).max(12).optional(),
};

export const mealSchema = {
  name: z.string().trim().min(1).max(160),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]),
  eatenAt: z.iso.datetime({ offset: true }).optional(),
  localDate: z.iso.date().optional(),
  restaurant: z.string().trim().min(1).max(160).optional(),
  source: z
    .enum(["photo", "voice", "text", "restaurant", "saved", "manual"])
    .optional(),
  confidence: confidence.optional(),
  assumptions: z.array(z.string().trim().min(1).max(240)).max(20).optional(),
  items: z.array(z.object(mealItemSchema)).min(1).max(50),
};

export const mealPatchSchema = {
  name: mealSchema.name.optional(),
  mealType: mealSchema.mealType.optional(),
  eatenAt: mealSchema.eatenAt,
  localDate: mealSchema.localDate,
  restaurant: z.string().trim().max(160).optional(),
  source: mealSchema.source,
  confidence: mealSchema.confidence,
  assumptions: mealSchema.assumptions,
  items: z.array(z.object(mealItemSchema)).min(1).max(50).optional(),
};

export const mealOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  localDate: z.string(),
  totals: z.object({
    calories: z.number(),
    proteinG: z.number(),
    carbsG: z.number(),
    fatG: z.number(),
    fiberG: z.number(),
  }),
}).passthrough();

export const genericObjectOutputSchema = z.object({}).passthrough();
