import assert from "node:assert/strict";
import test from "node:test";
import { WIDGET_HTML, WIDGET_URI } from "../src/widget.js";

test("day summaries keep meal details display-only and protein-first", () => {
  assert.equal(WIDGET_URI, "ui://nutrition-tracker/dashboard-v6.html");
  assert.match(WIDGET_HTML, /meal-metrics/);
  assert.match(WIDGET_HTML, /ingredient-metrics/);
  assert.doesNotMatch(WIDGET_HTML, /data-remove-saved-item/);
  assert.doesNotMatch(WIDGET_HTML, /data-edit-meal/);
  assert.doesNotMatch(WIDGET_HTML, /quick-edit/);
  assert.doesNotMatch(WIDGET_HTML, /<div class="eyebrow">Breakdown/);
});

test("inline day UI uses two cards on a transparent host background", () => {
  assert.match(WIDGET_HTML, /background:\s*transparent/);
  assert.match(WIDGET_HTML, /two-card-view/);
  assert.doesNotMatch(WIDGET_HTML, /radial-gradient\(circle at/);
});

test("daily stats are protein-first and older meals are collapsed", () => {
  assert.match(WIDGET_HTML, /Daily protein/);
  assert.match(WIDGET_HTML, /% from P/);
  assert.match(WIDGET_HTML, /Fiber/);
  assert.match(WIDGET_HTML, /Carbs/);
  assert.match(WIDGET_HTML, /goals\.proteinGoalG \|\| 200/);
  assert.match(WIDGET_HTML, /collapsibleMealRows/);
  assert.match(WIDGET_HTML, /View all/);
  assert.match(WIDGET_HTML, /meals\.slice\(0, 1\)/);
});

test("protein progress animates from the pre-meal total", () => {
  assert.match(WIDGET_HTML, /newestMealProtein/);
  assert.match(WIDGET_HTML, /previousProtein/);
  assert.match(WIDGET_HTML, /data-progress-target/);
  assert.match(WIDGET_HTML, /animateProteinProgress/);
  assert.match(WIDGET_HTML, /transition:width \.72s/);
});
