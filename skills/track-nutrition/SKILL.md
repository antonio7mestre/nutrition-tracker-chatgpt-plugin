---
name: track-nutrition
description: Interpret meal photos, voice notes, restaurant orders, and natural-language food descriptions; estimate calories, protein, carbs, fat, and fiber; immediately save analyzed meals; and use the Nutrition Tracker MCP tools for later natural-language corrections, goals, saved orders, dashboards, and weight trends. Use whenever the user wants to log, edit, delete, save, analyze, or review personal nutrition or weight data.
---

# Track Nutrition

Use ChatGPT's native visual, audio, and language understanding to structure the meal. Use the plugin only for deterministic calculation, embedded UI, persistence, and reporting.

## Meal logging

1. Interpret the user's description or media into foods and portions.
2. Estimate each item's total calories, protein, carbs, fat, and fiber for the stated portion. Record concise assumptions and confidence from 0 to 1.
3. Resolve the meal's local date before saving it. Use the date the user states (including relative dates such as yesterday); otherwise let the plugin resolve the current date in the timezone stored in goals.
4. Call `log_meal` immediately with the complete estimate and resolved `localDate`. Do not require a preview or separate confirmation.
5. Present the returned component, which shows every ingredient, the saved meal total, and totals for that exact day. Briefly mention material assumptions so the user knows what they may want to correct.
6. Use `preview_meal` only when the user explicitly asks to see an estimate before it is saved.

If the user supplies exact nutrition facts, treat those values as high-confidence and preserve them. Do not invent missing micronutrients; this plugin tracks calories, protein, carbs, fat, and fiber only.

## Corrections after saving

- Treat "I ate..." and equivalent meal descriptions as permission to analyze and immediately save the meal.
- When the user corrects an ingredient, portion, preparation, calories, or macros in natural language, use `get_meal` when needed and then call `edit_meal` without asking for another confirmation.
- If the correction does not include a meal ID, use the conversation's most recent `log_meal` result or call `get_today` for the relevant date to identify the intended meal. Ask only when more than one meal plausibly matches.
- Preserve every unchanged ingredient and field when applying a correction.
- If the user says to remove one ingredient, update the meal with the remaining items. Do not leave a meal with zero ingredients; delete the meal only when the user explicitly asks.
- Never claim that a meal was saved or updated until the corresponding tool succeeds.
- Use `delete_meal` only for a specific meal ID after the user explicitly asks to remove it.

## Estimation rules

- Make uncertainty visible instead of silently choosing a precise-looking value.
- Prefer portion-specific assumptions such as "about 1 cup cooked rice" over vague caveats.
- Include cooking fats and calorie-dense condiments when visible or likely; label the assumption.
- For mixed dishes, split into useful components when doing so improves editability.
- Set confidence below 0.7 when the portion, preparation, or hidden ingredients could materially change the estimate.
- Avoid medical or diagnostic claims. Describe logged trends as estimates, not clinical advice.

## Retrieval and analysis

- Use `get_today` for remaining daily calories or macros and meal-level review. Pass the exact requested local date so the embedded daily totals component stays day-specific.
- Use `get_week` for seven-day averages, protein consistency, highest-calorie meals, and deficit questions.
- Use `render_dashboard` when the user asks to see the dashboard or when a compact visual materially helps.
- Use `get_weight_trend` or the dashboard for weight change. State that scale weight fluctuates and the trend is descriptive.
- Use saved-meal tools for recurring meals and restaurant orders. Prefer `log_saved_meal` over rebuilding a known order.
- Use the timezone stored in goals. If the user's day boundary appears wrong, update the timezone with `set_goals`.
