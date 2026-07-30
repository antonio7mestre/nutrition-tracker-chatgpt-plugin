import assert from "node:assert/strict";
import test from "node:test";
import { WIDGET_HTML, WIDGET_URI } from "../src/widget.js";

test("day summaries expose per-ingredient quick removal controls", () => {
  assert.equal(WIDGET_URI, "ui://nutrition-tracker/dashboard-v4.html");
  assert.match(WIDGET_HTML, /data-remove-saved-item/);
  assert.match(WIDGET_HTML, /data-meal-id/);
  assert.match(WIDGET_HTML, /bindSavedIngredientRemovals\(meals\)/);
  assert.match(WIDGET_HTML, /await callTool\("delete_meal"/);
  assert.doesNotMatch(
    WIDGET_HTML,
    /data-meal-id="[^"]*"[\s\S]{0,120}items\.length === 1 \? " disabled"/,
  );
});

test("inline day UI uses two cards on a transparent host background", () => {
  assert.match(WIDGET_HTML, /background:\s*transparent/);
  assert.match(WIDGET_HTML, /two-card-view/);
  assert.doesNotMatch(WIDGET_HTML, /radial-gradient\(circle at/);
});
