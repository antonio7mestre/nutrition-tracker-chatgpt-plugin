# Nutrition Tracker

A personal ChatGPT and Codex plugin for meal logging, nutrition goals, saved orders, and weight trends.

ChatGPT handles meal photos, voice notes, restaurant orders, and natural-language interpretation with the model already available in the product. The plugin makes no OpenAI API calls. It calculates totals, saves analyzed meals immediately, supports natural-language corrections afterward, and persists only structured nutrition data in SQLite locally or Cloudflare D1 in production. While the plugin is active, it makes reasonable assumptions, asks only when genuinely blocked, and uses the embedded UI as the complete response on every successful turn.

## What it includes

- Immediate meal logging with a date-specific totals card
- Ingredient-by-ingredient calorie breakdown with natural-language corrections afterward
- Calories, protein, carbs, fat, and fiber
- Daily remaining goals and seven-day averages
- Weight history and descriptive weekly rate
- Reusable meals and restaurant orders
- Low-confidence entry review queue
- Embedded MCP Apps dashboard
- Focused MCP tools for reading and changing data

## Data and privacy

The local Codex version stores its database outside the plugin cache:

- macOS: `~/Library/Application Support/Nutrition Tracker/nutrition.sqlite`
- Windows: `%APPDATA%\Nutrition Tracker\nutrition.sqlite`
- Linux: `${XDG_DATA_HOME:-~/.local/share}/nutrition-tracker/nutrition.sqlite`

Set `NUTRITION_DB_PATH` to override the location. Reinstalling the plugin does not remove the database. The plugin has no analytics, advertising, or network calls.

The production ChatGPT version runs as a Cloudflare Worker and stores its data in a private D1 database. Its MCP endpoint uses a high-entropy private URL so only the connected personal plugin can reach it. The public service does not expose a meal or dashboard web interface.

Production service: `https://nutrition-tracker-mcp.antonio7mestre.workers.dev`

## Development

```bash
npm install
npm run check
npm test
npm run build
npm run smoke
```

Run the local Streamable HTTP endpoint for MCP Inspector:

```bash
npm run start:http
```

Then connect the inspector to `http://127.0.0.1:3000/mcp`.

Run the production-shaped Worker locally:

```bash
npm run d1:migrate:local
npm run dev:worker
npm run smoke:worker
```

## Important health note

Nutrition estimates are approximate and are not medical advice. Weight trends are descriptive and can be affected by hydration and other short-term changes.
