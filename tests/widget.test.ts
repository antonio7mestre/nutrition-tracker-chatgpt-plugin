import assert from "node:assert/strict";
import test from "node:test";
import { WIDGET_HTML, WIDGET_URI } from "../src/widget.js";

test("day summaries expose per-ingredient quick removal controls", () => {
  assert.equal(WIDGET_URI, "ui://nutrition-tracker/dashboard-v3.html");
  assert.match(WIDGET_HTML, /data-remove-saved-item/);
  assert.match(WIDGET_HTML, /data-meal-id/);
  assert.match(WIDGET_HTML, /bindSavedIngredientRemovals\(day\.meals\)/);
});
