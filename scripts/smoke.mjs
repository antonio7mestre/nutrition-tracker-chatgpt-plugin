import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const temporaryDirectory = mkdtempSync(join(tmpdir(), "nutrition-tracker-smoke-"));
const databasePath = join(temporaryDirectory, "nutrition.sqlite");
const client = new Client({ name: "nutrition-smoke-test", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["--no-warnings", "dist/server.mjs", "--stdio"],
  cwd: process.cwd(),
  env: {
    PATH: process.env.PATH || "",
    NUTRITION_DB_PATH: databasePath,
  },
  stderr: "pipe",
});

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const names = new Set(tools.tools.map((tool) => tool.name));
  for (const expected of [
    "preview_meal",
    "log_meal",
    "edit_meal",
    "delete_meal",
    "get_today",
    "get_week",
    "render_dashboard",
    "log_weight",
    "set_goals",
    "save_meal",
    "log_saved_meal",
  ]) {
    assert(names.has(expected), `Missing tool: ${expected}`);
  }
  const logMealTool = tools.tools.find((tool) => tool.name === "log_meal");
  assert(!logMealTool?.inputSchema?.required?.includes("confirmed"));
  const editMealTool = tools.tools.find((tool) => tool.name === "edit_meal");
  assert(!editMealTool?.inputSchema?.required?.includes("confirmed"));

  const meal = {
    name: "Smoke test meal",
    mealType: "lunch",
    localDate: "2026-07-29",
    source: "text",
    confidence: 0.9,
    items: [
      {
        name: "Chicken and rice",
        servingDescription: "1 bowl",
        calories: 600,
        proteinG: 48,
        carbsG: 62,
        fatG: 16,
        fiberG: 4,
        confidence: 0.9,
      },
    ],
  };
  const preview = await client.callTool({
    name: "preview_meal",
    arguments: meal,
  });
  assert.equal(preview.structuredContent?.kind, "meal_preview");
  assert.equal(preview.structuredContent?.day?.date, "2026-07-29");
  assert.equal(preview.structuredContent?.day?.totals?.calories, 0);
  assert.equal(preview.structuredContent?.projectedDay?.totals?.calories, 600);

  const saved = await client.callTool({
    name: "log_meal",
    arguments: meal,
  });
  assert.equal(saved.structuredContent?.kind, "meal_saved");

  const edited = await client.callTool({
    name: "edit_meal",
    arguments: {
      mealId: saved.structuredContent?.meal?.id,
      items: [
        {
          ...meal.items[0],
          servingDescription: "1 large bowl",
          calories: 650,
          carbsG: 72,
        },
      ],
    },
  });
  assert.equal(edited.structuredContent?.kind, "meal_saved");

  const today = await client.callTool({
    name: "get_today",
    arguments: { date: "2026-07-29" },
  });
  assert.equal(today.structuredContent?.day?.totals?.calories, 650);

  const dashboard = await client.callTool({
    name: "render_dashboard",
    arguments: { date: "2026-07-29" },
  });
  assert.equal(dashboard.structuredContent?.kind, "nutrition_dashboard");
  console.log(`Smoke test passed with ${tools.tools.length} tools.`);
} finally {
  await transport.close();
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
