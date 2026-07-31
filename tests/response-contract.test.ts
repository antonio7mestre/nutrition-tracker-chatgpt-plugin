import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  NUTRITION_SERVER_INSTRUCTIONS,
  UI_ONLY_TOOL_PREFIX,
} from "../src/server.js";

test("server enforces UI-only responses on every plugin-enabled turn", () => {
  assert.match(NUTRITION_SERVER_INSTRUCTIONS, /Use its tools on every turn/);
  assert.match(
    NUTRITION_SERVER_INSTRUCTIONS,
    /Every non-question turn must end with an embedded Nutrition Tracker UI/,
  );
  assert.match(
    NUTRITION_SERVER_INSTRUCTIONS,
    /call render_dashboard as the final tool/,
  );
  assert.match(
    NUTRITION_SERVER_INSTRUCTIONS,
    /return absolutely no assistant prose/,
  );
  assert.match(
    NUTRITION_SERVER_INSTRUCTIONS,
    /first assistant action must be a plugin tool call/,
  );
});

test("server makes assumptions and reserves questions for true blockers", () => {
  assert.match(NUTRITION_SERVER_INSTRUCTIONS, /Make reasonable/);
  assert.match(NUTRITION_SERVER_INSTRUCTIONS, /Questions must be rare/);
  assert.match(
    NUTRITION_SERVER_INSTRUCTIONS,
    /Do not ask for confirmation, portion review, or routine missing details/,
  );
});

test("each UI tool forbids host copy before and after the component", () => {
  assert.match(
    UI_ONLY_TOOL_PREFIX,
    /first assistant action must be this tool call/,
  );
  assert.match(
    UI_ONLY_TOOL_PREFIX,
    /before or after this tool/,
  );
});

test("bundled skill mirrors the strict server response contract", async () => {
  const skill = await readFile(
    new URL("../skills/track-nutrition/SKILL.md", import.meta.url),
    "utf8",
  );

  assert.match(skill, /Use the Nutrition Tracker tools on every turn/);
  assert.match(skill, /Every non-question turn must end/);
  assert.match(skill, /send no assistant text/);
  assert.match(skill, /call `render_dashboard` as the fallback/);
  assert.match(skill, /first assistant action must be a Nutrition Tracker tool call/);
});
