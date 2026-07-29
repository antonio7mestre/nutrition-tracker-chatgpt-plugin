import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url =
  process.env.NUTRITION_MCP_URL ||
  "http://127.0.0.1:8787/mcp/local-dev-only";
const client = new Client({
  name: "nutrition-worker-smoke-test",
  version: "1.0.0",
});
const transport = new StreamableHTTPClientTransport(new URL(url));

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const names = new Set(tools.tools.map((tool) => tool.name));
  for (const expected of [
    "log_meal",
    "edit_meal",
    "delete_meal",
    "get_today",
    "render_dashboard",
  ]) {
    assert(names.has(expected), `Missing tool: ${expected}`);
  }

  const resources = await client.listResources();
  assert(
    resources.resources.some(
      (resource) => resource.uri === "ui://nutrition-tracker/dashboard-v3.html",
    ),
    "Missing nutrition UI resource",
  );

  const meal = await client.callTool({
    name: "log_meal",
    arguments: {
      name: "Worker smoke meal",
      mealType: "snack",
      localDate: "2026-07-29",
      source: "manual",
      confidence: 1,
      items: [
        {
          name: "Greek yogurt",
          servingDescription: "1 cup",
          calories: 180,
          proteinG: 20,
          carbsG: 12,
          fatG: 4,
          fiberG: 0,
          confidence: 1,
        },
      ],
    },
  });
  assert.equal(meal.structuredContent?.kind, "meal_saved");
  assert.equal(meal.structuredContent?.day?.date, "2026-07-29");

  const mealId = meal.structuredContent?.meal?.id;
  assert.equal(typeof mealId, "string");
  const deleted = await client.callTool({
    name: "delete_meal",
    arguments: { mealId, confirmed: true },
  });
  assert.equal(deleted.structuredContent?.kind, "meal_deleted");
  console.log(
    `Worker smoke test passed with ${tools.tools.length} tools and embedded UI.`,
  );
} finally {
  await transport.close();
}
