export const WIDGET_URI = "ui://nutrition-tracker/dashboard-v4.html";

export const WIDGET_HTML = String.raw`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      color-scheme: dark;
      --ink: #f7f9fc;
      --muted: #a7b3c4;
      --line: rgba(183,197,217,.16);
      --paper: #05070b;
      --card: #0b0f16;
      --card-strong: #121a26;
      --accent: #2f6bff;
      --accent-2: #6e9aff;
      --lime: #8ab0ff;
      --gold: #cdd6e3;
      --rose: #8aaeff;
      --shadow: none;
    }
    * { box-sizing: border-box; }
    html { background:transparent; }
    body {
      margin: 0;
      padding: 0;
      color: var(--ink);
      background: transparent;
      font: 600 14px/1.42 ui-rounded, "SF Pro Rounded", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow-x:hidden;
    }
    button { position:relative; z-index:2; pointer-events:auto; font:inherit; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
    .shell { max-width:760px; margin:0 auto; }
    .two-card-view { display:grid; gap:10px; }
    .eyebrow { color:var(--muted); font-size:11px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
    h1 { margin:4px 0 0; font-size:clamp(27px,6vw,40px); font-weight:900; line-height:1.02; letter-spacing:-.05em; }
    .pill { border:1px solid var(--line); border-radius:999px; padding:8px 11px; color:var(--ink); font-weight:800; background:var(--card-strong); white-space:nowrap; }
    .card { border:1px solid var(--line); border-radius:20px; background:var(--card); box-shadow:none; overflow:hidden; }
    .card-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:17px 18px; border-bottom:1px solid var(--line); }
    .card-heading h2 { margin:3px 0 0; font-size:20px; font-weight:900; letter-spacing:-.035em; }
    .meals-card { overflow:hidden; }
    .meal-entry + .meal-entry { border-top:1px solid var(--line); }
    .hero { display:grid; grid-template-columns:1.25fr .75fr; overflow:hidden; }
    .hero-main { padding:22px; }
    .hero-side { padding:22px; background:linear-gradient(145deg,#dce3ed,#94a3b8); color:var(--paper); display:flex; flex-direction:column; justify-content:space-between; min-height:190px; }
    .metric-big { font-size:clamp(44px,10vw,70px); font-weight:950; letter-spacing:-.07em; line-height:.95; margin:8px 0 5px; }
    .metric-sub { color:var(--muted); }
    .hero-side .metric-sub { color:color-mix(in srgb, var(--paper) 65%, transparent); }
    .remaining { font-size:28px; font-weight:900; letter-spacing:-.04em; }
    .progress { height:10px; border-radius:99px; background:var(--line); overflow:hidden; margin-top:15px; }
    .progress > i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--accent),var(--accent-2)); width:0; }
    .macros { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:12px 0; }
    .macro { padding:14px; min-width:0; }
    .macro strong { display:block; font-size:21px; font-weight:900; letter-spacing:-.035em; margin-top:4px; }
    .macro:nth-child(2) strong { color:var(--accent-2); }
    .macro:nth-child(3) strong { color:#c5ceda; }
    .macro:nth-child(4) strong { color:#4d7fff; }
    .section { margin:0; }
    .section-head { display:flex; align-items:center; justify-content:space-between; margin:0 2px 9px; }
    .section h2 { font-size:16px; margin:0; letter-spacing:-.02em; }
    .list { overflow:hidden; }
    .row { display:grid; grid-template-columns:1fr auto; gap:12px; align-items:center; padding:14px 16px; border-top:1px solid var(--line); }
    .row:first-child { border-top:0; }
    .row-title { font-weight:850; }
    .row-meta { color:var(--muted); font-size:12px; margin-top:2px; }
    .row-value { text-align:right; font-weight:900; }
    .tabs { display:flex; gap:4px; margin:0; padding:12px; border-bottom:1px solid var(--line); overflow:auto; background:transparent; }
    .tab { border:0; border-radius:10px; padding:8px 11px; color:var(--muted); background:transparent; cursor:pointer; white-space:nowrap; }
    .tab[aria-selected="true"] { background:var(--ink); color:var(--paper); }
    .panel { display:none; }
    .panel.active { display:block; }
    .week-chart { display:grid; grid-template-columns:repeat(7,1fr); align-items:end; gap:8px; height:170px; padding:20px 16px 12px; }
    .bar-wrap { display:flex; flex-direction:column; justify-content:flex-end; align-items:center; height:100%; gap:7px; min-width:0; }
    .bar { width:100%; max-width:42px; min-height:3px; border-radius:9px 9px 4px 4px; background:linear-gradient(var(--accent-2),var(--accent)); }
    .bar-label { color:var(--muted); font-size:10px; }
    .spark { width:100%; height:180px; padding:12px; }
    .spark svg { width:100%; height:100%; overflow:visible; }
    .empty { padding:28px 18px; text-align:center; color:var(--muted); }
    .actions { display:flex; gap:8px; flex-wrap:wrap; margin:16px 0 0; }
    .btn { min-height:48px; border:1px solid var(--line); border-radius:14px; padding:12px 16px; background:var(--card-strong); color:var(--ink); cursor:pointer; font-weight:900; touch-action:manipulation; }
    .btn.primary { border-color:var(--accent); background:linear-gradient(135deg,var(--accent-2),var(--accent)); color:white; box-shadow:0 10px 24px rgba(47,107,255,.28); }
    .btn.ghost { min-height:38px; padding:7px 10px; font-size:11px; color:var(--muted); }
    .quick-edit { min-height:38px; border:1px solid var(--line); border-radius:11px; padding:7px 11px; color:var(--ink); background:transparent; cursor:pointer; font-weight:900; }
    .btn:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; }
    .preview { padding:20px; }
    .preview-total { display:flex; align-items:end; justify-content:space-between; gap:14px; margin:18px 0; }
    .ingredient-head { display:flex; align-items:end; justify-content:space-between; gap:12px; margin:18px 2px 9px; }
    .ingredient-head h2 { margin:3px 0 0; font-size:18px; font-weight:900; letter-spacing:-.025em; }
    .ingredient-stack { display:grid; gap:10px; }
    .ingredient-card { position:relative; padding:14px; border:1px solid var(--line); border-radius:17px; background:rgba(5,7,11,.62); }
    .ingredient-top { display:grid; grid-template-columns:minmax(0,1fr) 92px 42px; gap:8px; align-items:end; }
    .ingredient-fields { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-top:9px; }
    .field { display:block; min-width:0; }
    .field > span { display:block; margin:0 0 5px 2px; color:var(--muted); font-size:10px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .field input { width:100%; min-height:44px; border:1px solid var(--line); border-radius:12px; padding:10px 11px; color:var(--ink); background:var(--card-strong); font:inherit; font-size:15px; font-weight:800; outline:none; }
    .field input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(47,107,255,.18); }
    .field.portion { margin-top:9px; }
    .remove-ingredient { width:44px; min-width:44px; height:44px; border:1px solid rgba(47,107,255,.52); border-radius:12px; color:var(--rose); background:rgba(47,107,255,.14); font-size:23px; font-weight:900; cursor:pointer; pointer-events:auto; touch-action:manipulation; }
    .add-ingredient { width:100%; margin-top:10px; border-style:dashed; color:var(--lime); }
    .ingredient-breakdown { display:grid; gap:7px; margin:0 16px 14px; padding-top:13px; border-top:1px solid var(--line); }
    .ingredient-line { display:flex; align-items:center; justify-content:space-between; gap:10px; color:var(--muted); }
    .ingredient-line > span { flex:1; min-width:0; }
    .ingredient-line strong { color:var(--ink); font-weight:900; }
    .ingredient-line .remove-ingredient { flex:0 0 44px; width:44px; height:44px; }
    .assumptions { margin:14px 0 0; padding:13px 14px; border-radius:14px; background:rgba(167,179,196,.11); color:var(--muted); }
    .assumptions ul { margin:7px 0 0; padding-left:18px; }
    .status { padding:10px 12px; border-radius:12px; background:rgba(47,107,255,.16); color:var(--ink); margin-top:12px; }
    .day-card { margin:0; padding:18px; overflow:hidden; }
    .day-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
    .day-title { margin:3px 0 0; font-size:19px; letter-spacing:-.025em; }
    .day-kcal { display:flex; align-items:baseline; gap:7px; margin-top:17px; }
    .day-kcal strong { font-size:40px; font-weight:950; line-height:1; letter-spacing:-.055em; }
    .day-remaining { margin-left:auto; color:var(--muted); font-size:12px; font-weight:850; }
    .day-macros { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:14px; }
    .day-macro { padding:11px 12px; border:1px solid var(--line); border-radius:14px; background:color-mix(in srgb, var(--card) 75%, transparent); min-width:0; }
    .day-macro strong { display:block; margin-top:3px; font-size:18px; font-weight:900; letter-spacing:-.03em; }
    .day-comparison { margin-top:13px; padding-top:12px; border-top:1px solid var(--line); color:var(--muted); font-size:12px; }
    .dashboard-card .panel { padding:0; }
    .dashboard-card .week-chart, .dashboard-card .spark { border:0; }
    .summary-card { padding:18px; }
    .summary-card .card-heading { margin:-18px -18px 16px; }
    .summary-grid { display:grid; grid-template-columns:1.2fr .8fr; gap:16px; align-items:end; }
    .summary-remaining { text-align:right; }
    .summary-card .macros { margin:16px 0 0; }
    .summary-card .macro { border:1px solid var(--line); border-radius:14px; background:transparent; }
    .dashboard-card .macros { margin:0; padding:14px; }
    .dashboard-card .macro { border:1px solid var(--line); border-radius:14px; background:transparent; }
    .dashboard-card > .actions { padding:0 14px 14px; }
    @media (max-width:640px) {
      body { padding:0; }
      .shell { width:100%; }
      .hero { grid-template-columns:1fr; }
      .hero-side { min-height:120px; }
      .summary-grid { grid-template-columns:1fr; }
      .summary-remaining { text-align:left; }
      .macros { grid-template-columns:repeat(2,1fr); }
      .preview { padding:17px; }
      .preview-total { align-items:flex-start; }
      .ingredient-fields { grid-template-columns:repeat(2,1fr); }
      .day-head { display:block; }
      .day-head .pill { display:inline-block; margin-top:9px; }
      .day-macros { grid-template-columns:repeat(2,1fr); }
      .actions { display:grid; grid-template-columns:1fr 1fr; padding:10px 0 max(4px, env(safe-area-inset-bottom)); }
      .actions .btn { width:100%; }
    }
    @media (max-width:400px) {
      .preview-total { display:block; }
      .preview-total .row-value { margin-top:16px; text-align:left; }
      .ingredient-top { grid-template-columns:minmax(0,1fr) 82px 42px; }
      .day-kcal { flex-wrap:wrap; }
      .day-remaining { width:100%; margin:1px 0 0; }
      .row { padding:13px 14px; }
    }
  </style>
</head>
<body>
  <main id="root" class="shell"><div class="card empty">Loading nutrition data…</div></main>
  <script>
    (() => {
      const root = document.getElementById("root");
      const pending = new Map();
      let requestId = 1;
      let latestOutput = window.openai?.toolOutput;

      const esc = (value) => String(value ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
      const num = (value, digits = 0) => Number.isFinite(Number(value))
        ? Number(value).toLocaleString(document.documentElement.lang || "en-US", { maximumFractionDigits: digits })
        : "—";
      const pct = (value, goal) => !goal ? 0 : Math.max(0, Math.min(100, Number(value || 0) / Number(goal) * 100));
      const dateLabel = (date) => {
        if (!date) return "Selected day";
        const parsed = new Date(date + "T12:00:00");
        return Number.isNaN(parsed.getTime())
          ? String(date)
          : parsed.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric"
            });
      };

      function request(method, params) {
        const id = requestId++;
        window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
        return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      }
      function notify(method, params = {}) {
        window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
      }
      async function callTool(name, args) {
        if (window.openai?.callTool) return window.openai.callTool(name, args);
        return request("tools/call", { name, arguments: args });
      }
      async function sendMessage(text) {
        if (window.openai?.sendFollowUpMessage) return window.openai.sendFollowUpMessage({ prompt: text });
        return request("ui/message", { role: "user", content: [{ type: "text", text }] });
      }
      function ingredientBreakdown(items, options = {}) {
        if (!items?.length) return "";
        return '<div class="ingredient-breakdown">' + items.map((item, index) =>
          '<div class="ingredient-line"><span>' + esc(item.name) + ' · ' +
          esc(item.servingDescription) + '</span><strong>' + num(item.calories) +
          ' cal</strong>' + (options.removable
            ? '<button type="button" class="remove-ingredient" data-remove-saved-item="' + index +
              '" data-meal-id="' + esc(options.mealId || "") +
              '" aria-label="Remove ' + esc(item.name) + '">×</button>'
            : "") + '</div>').join("") + '</div>';
      }
      function mealRows(meals, options = {}) {
        if (!meals?.length) return '<div class="empty">No meals logged yet.</div>';
        return meals.map((meal) => {
          const remove = options.canDelete
            ? '<button type="button" class="btn ghost" data-delete="' + esc(meal.id) + '">Remove</button>' : "";
          return '<div class="meal-entry"><div class="row"><div><div class="row-title">🍽️ ' + esc(meal.name) +
            '</div><div class="row-meta">' + esc(meal.mealType) + ' · ' +
            num(meal.totals?.proteinG) + 'g protein</div></div><div><div class="row-value">' +
            num(meal.totals?.calories) + ' cal</div><button type="button" class="quick-edit" data-edit-meal="' +
            esc(meal.id) + '">Edit</button>' + remove + '</div></div>' +
            ingredientBreakdown(meal.items, {
              removable: options.removable !== false,
              mealId: meal.id
            }) + '</div>';
        }).join("");
      }
      function bindSavedIngredientRemovals(meals) {
        const byId = new Map((meals || []).map((meal) => [meal.id, meal]));
        document.querySelectorAll("[data-remove-saved-item]").forEach((button) => {
          button.addEventListener("click", async () => {
            const meal = byId.get(button.dataset.mealId);
            if (!meal) return;
            button.disabled = true;
            button.textContent = "…";
            if ((meal.items || []).length === 1) {
              try {
                await callTool("delete_meal", { mealId: meal.id, confirmed: true });
                const result = await callTool("get_today", { date: meal.localDate });
                if (result?.structuredContent) render(result.structuredContent);
              } catch (error) {
                button.disabled = false;
                button.textContent = "×";
                button.title = "Could not remove ingredient: " + (error?.message || error);
              }
              return;
            }
            const remainingItems = meal.items
              .filter((_item, index) => index !== Number(button.dataset.removeSavedItem))
              .map(({ id: _id, ...item }) => item);
            try {
              const result = await callTool("edit_meal", {
                mealId: meal.id,
                items: remainingItems
              });
              if (result?.structuredContent) render(result.structuredContent);
            } catch (error) {
              button.disabled = false;
              button.textContent = "×";
              button.title = "Could not remove ingredient: " + (error?.message || error);
            }
          });
        });
      }
      function bindMealEdits(meals) {
        const byId = new Map((meals || []).map((meal) => [meal.id, meal]));
        document.querySelectorAll("[data-edit-meal]").forEach((button) => {
          button.addEventListener("click", async () => {
            const meal = byId.get(button.dataset.editMeal);
            if (!meal) return;
            button.disabled = true;
            button.textContent = "Opening…";
            try {
              await sendMessage('Change my saved meal "' + meal.name +
                '" (meal ID ' + meal.id + '). Preserve everything I do not mention.');
            } catch (error) {
              button.disabled = false;
              button.textContent = "Edit";
              button.title = "Could not open chat edit: " + (error?.message || error);
            }
          });
        });
      }
      function dayTotalsCard(day, options = {}) {
        if (!day?.date) return "";
        const totals = day.totals || {};
        const goals = day.goals || {};
        const remaining = day.remaining || {};
        const mealCount = options.projected
          ? Number(day.savedMealCount || 0)
          : Number(day.meals?.length || 0);
        const countLabel = options.projected
          ? mealCount + " saved + estimate"
          : mealCount + " meal" + (mealCount === 1 ? "" : "s");
        const calorieRemaining = Number(remaining.calories);
        const remainingLabel = remaining.calories == null
          ? "No calorie goal set"
          : calorieRemaining >= 0
            ? num(calorieRemaining) + " cal left"
            : num(Math.abs(calorieRemaining)) + " cal over";
        const comparison = options.projected && options.current
          ? '<div class="day-comparison">Currently saved: <strong>' +
            num(options.current.totals?.calories) + ' cal</strong> · This estimate adds <strong>' +
            num(options.mealCalories) + ' cal</strong>. Preview only.</div>'
          : "";
        return '<section class="card day-card"><div class="day-head"><div><div class="eyebrow">' +
          (options.projected ? "Day total if logged" : "Daily totals") +
          '</div><h2 class="day-title">' + esc(dateLabel(day.date)) + '</h2></div><span class="pill">' +
          esc(countLabel) + '</span></div><div class="day-kcal"><strong>' + num(totals.calories) +
          '</strong><span>calories</span><span class="day-remaining">' + esc(remainingLabel) +
          '</span></div><div class="progress"><i style="width:' + pct(totals.calories, goals.calorieGoal) +
          '%"></i></div><div class="day-macros"><div class="day-macro"><div class="eyebrow">Protein</div><strong>' +
          num(totals.proteinG) + 'g</strong></div><div class="day-macro"><div class="eyebrow">Carbs</div><strong>' +
          num(totals.carbsG) + 'g</strong></div><div class="day-macro"><div class="eyebrow">Fat</div><strong>' +
          num(totals.fatG) + 'g</strong></div><div class="day-macro"><div class="eyebrow">Fiber</div><strong>' +
          num(totals.fiberG) + 'g</strong></div></div>' + comparison + '</section>';
      }
      const nutrientFields = ["calories", "proteinG", "carbsG", "fatG", "fiberG"];
      const roundNutrient = (value) => Math.round((Number(value) || 0) * 10) / 10;
      function recalculateMeal(meal) {
        meal.totals = Object.fromEntries(nutrientFields.map((field) => [
          field,
          roundNutrient((meal.items || []).reduce((sum, item) => sum + Number(item[field] || 0), 0))
        ]));
      }
      function refreshPreviewTotals(data) {
        const meal = data.meal || {};
        recalculateMeal(meal);
        const base = data.day?.totals || {};
        const projected = data.projectedDay || {};
        projected.totals = Object.fromEntries(nutrientFields.map((field) => [
          field,
          roundNutrient(Number(base[field] || 0) + Number(meal.totals[field] || 0))
        ]));
        const goals = projected.goals || {};
        const goalFields = {
          calories: "calorieGoal",
          proteinG: "proteinGoalG",
          carbsG: "carbsGoalG",
          fatG: "fatGoalG",
          fiberG: "fiberGoalG"
        };
        projected.remaining = Object.fromEntries(nutrientFields.map((field) => {
          const goal = goals[goalFields[field]];
          return [field, goal == null ? null : roundNutrient(Number(goal) - Number(projected.totals[field] || 0))];
        }));
        data.projectedDay = projected;
        const caloriesNode = document.getElementById("meal-calories");
        const macrosNode = document.getElementById("meal-macros");
        const projectionNode = document.getElementById("projection");
        if (caloriesNode) caloriesNode.textContent = num(meal.totals.calories);
        if (macrosNode) macrosNode.innerHTML = '<strong>' + num(meal.totals.proteinG) +
          'g protein</strong><br><span class="row-meta">' + num(meal.totals.carbsG) +
          'g carbs · ' + num(meal.totals.fatG) + 'g fat · ' + num(meal.totals.fiberG) +
          'g fiber</span>';
        if (projectionNode) projectionNode.innerHTML = dayTotalsCard(projected, {
          projected: true,
          current: data.day,
          mealCalories: meal.totals.calories
        });
      }
      function ingredientEditor(items) {
        return '<div class="ingredient-stack">' + items.map((item, index) =>
          '<article class="ingredient-card"><div class="ingredient-top"><label class="field"><span>Ingredient</span>' +
          '<input data-item-index="' + index + '" data-item-field="name" value="' + esc(item.name) +
          '" aria-label="Ingredient ' + (index + 1) + ' name"></label><label class="field"><span>Calories</span>' +
          '<input type="number" inputmode="decimal" min="0" step="0.1" data-item-index="' + index +
          '" data-item-field="calories" value="' + esc(item.calories) + '" aria-label="' +
          esc(item.name) + ' calories"></label><button type="button" class="remove-ingredient" data-remove-item="' +
          index + '" aria-label="Remove ' + esc(item.name) + '"' +
          (items.length === 1 ? " disabled" : "") + '>×</button></div>' +
          '<label class="field portion"><span>Portion</span><input data-item-index="' + index +
          '" data-item-field="servingDescription" value="' + esc(item.servingDescription) +
          '" aria-label="' + esc(item.name) + ' portion"></label><div class="ingredient-fields">' +
          [["proteinG","Protein g"],["carbsG","Carbs g"],["fatG","Fat g"],["fiberG","Fiber g"]]
            .map(([field, label]) => '<label class="field"><span>' + label +
              '</span><input type="number" inputmode="decimal" min="0" step="0.1" data-item-index="' +
              index + '" data-item-field="' + field + '" value="' + esc(item[field]) +
              '" aria-label="' + esc(item.name) + ' ' + label + '"></label>').join("") +
          '</div></article>').join("") + '</div>';
      }
      function bindIngredientEditor(data) {
        const meal = data.meal || {};
        document.querySelectorAll("[data-item-field]").forEach((input) => {
          input.addEventListener("input", () => {
            const item = meal.items?.[Number(input.dataset.itemIndex)];
            if (!item) return;
            const field = input.dataset.itemField;
            item[field] = nutrientFields.includes(field)
              ? Math.max(0, Number(input.value) || 0)
              : input.value;
            refreshPreviewTotals(data);
          });
        });
        document.querySelectorAll("[data-remove-item]").forEach((button) => {
          button.addEventListener("click", () => {
            if ((meal.items || []).length <= 1) return;
            meal.items.splice(Number(button.dataset.removeItem), 1);
            recalculateMeal(meal);
            renderPreview(data);
          });
        });
        const addButton = document.getElementById("add-ingredient");
        if (addButton) addButton.addEventListener("click", () => {
          meal.items.push({
            name: "New ingredient",
            servingDescription: "Enter portion",
            quantity: 1,
            unit: "serving",
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
            fiberG: 0,
            confidence: 0.6,
            assumptions: []
          });
          recalculateMeal(meal);
          renderPreview(data);
        });
      }
      function setupTabs() {
        document.querySelectorAll(".tab").forEach((button) => {
          button.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach((item) => item.setAttribute("aria-selected", "false"));
            document.querySelectorAll(".panel").forEach((item) => item.classList.remove("active"));
            button.setAttribute("aria-selected", "true");
            document.getElementById("panel-" + button.dataset.tab)?.classList.add("active");
          });
        });
      }
      function renderPreview(data) {
        const meal = data.meal || {};
        const items = meal.items || [];
        const assumptions = [...(meal.assumptions || []), ...items.flatMap((item) => item.assumptions || [])];
        root.innerHTML =
          '<div class="two-card-view"><section class="card preview"><div class="card-heading"><div>' +
          '<div class="eyebrow">Meal preview</div><h2>' + esc(meal.name || "Meal estimate") +
          '</h2></div><span class="pill">' + Math.round(Number(meal.confidence || 0) * 100) +
          '%</span></div><div class="preview-total"><div><div class="eyebrow">Meal total</div>' +
          '<div id="meal-calories" class="metric-big">' + num(meal.totals?.calories) + '</div><div class="metric-sub">calories</div></div>' +
          '<div id="meal-macros" class="row-value"><strong>' + num(meal.totals?.proteinG) + 'g protein</strong><br><span class="row-meta">' +
          num(meal.totals?.carbsG) + 'g carbs · ' + num(meal.totals?.fatG) + 'g fat · ' +
          num(meal.totals?.fiberG) + 'g fiber</span></div></div>' +
          '<div class="ingredient-head"><div><h2>Ingredients</h2></div>' +
          '<span class="pill">' + items.length + ' items</span></div>' + ingredientEditor(items) +
          '<button type="button" id="add-ingredient" class="btn add-ingredient">＋ Add ingredient</button>' +
          (assumptions.length ? '<div class="assumptions"><strong>Assumptions</strong><ul>' +
            assumptions.map((item) => '<li>' + esc(item) + '</li>').join("") + '</ul></div>' : '') +
          '<div id="preview-status"></div><div class="actions"><button type="button" id="confirm" class="btn primary">Save meal</button>' +
          '<button type="button" id="adjust" class="btn">Change in chat</button></div></section>' +
          '<div id="projection">' + dayTotalsCard(data.projectedDay, {
            projected: true,
            current: data.day,
            mealCalories: meal.totals?.calories
          }) + '</div></div>';
        bindIngredientEditor(data);
        document.getElementById("confirm").onclick = async () => {
          const button = document.getElementById("confirm");
          button.disabled = true;
          button.textContent = "Saving…";
          try {
            const { totals, ...payload } = meal;
            const result = await callTool("log_meal", payload);
            const output = result?.structuredContent;
            if (output) render(output);
            else document.getElementById("preview-status").innerHTML = '<div class="status">Meal saved.</div>';
          } catch (error) {
            button.disabled = false;
            button.textContent = "Try again";
            document.getElementById("preview-status").innerHTML =
              '<div class="status">Could not save: ' + esc(error?.message || error) + '</div>';
          }
        };
        document.getElementById("adjust").onclick = () =>
          sendMessage("I want to change this meal preview.");
      }
      function renderSaved(data) {
        const day = data.day || {};
        renderDayView(day);
      }
      function renderDaySummary(data) {
        const day = data.day || {};
        renderDayView(day);
      }
      function renderDayView(day) {
        const meals = day.meals || [];
        root.innerHTML = '<div class="two-card-view">' + dayTotalsCard(day) +
          '<section class="card meals-card"><div class="card-heading"><div><div class="eyebrow">Breakdown</div>' +
          '<h2>Meals</h2></div><span class="pill">' + meals.length + '</span></div>' +
          '<div class="list">' + mealRows(meals) + '</div></section></div>';
        bindSavedIngredientRemovals(meals);
        bindMealEdits(meals);
      }
      function renderDashboard(data) {
        const today = data.today || {};
        const totals = today.totals || {};
        const goals = today.goals || {};
        const remaining = today.remaining || {};
        const days = data.week?.days || [];
        const maxCalories = Math.max(Number(goals.calorieGoal || 0), ...days.map((d) => Number(d.totals?.calories || 0)), 1);
        const weights = data.weightTrend?.entries || [];
        const points = weights.map((entry, index) => {
          const x = weights.length < 2 ? 50 : 5 + index / (weights.length - 1) * 90;
          const vals = weights.map((w) => Number(w.weight));
          const min = Math.min(...vals), max = Math.max(...vals);
          const y = max === min ? 50 : 85 - (Number(entry.weight) - min) / (max - min) * 70;
          return x + "," + y;
        }).join(" ");
        const saved = data.savedMeals || [];
        const review = data.lowConfidenceMeals || [];
        root.innerHTML =
          '<div class="two-card-view">' + dayTotalsCard(today) +
          '<section class="card dashboard-card"><nav class="tabs" aria-label="Dashboard views">' +
          '<button type="button" class="tab" data-tab="today" aria-selected="true">Meals</button>' +
          '<button type="button" class="tab" data-tab="week" aria-selected="false">7 days</button>' +
          '<button type="button" class="tab" data-tab="weight" aria-selected="false">Weight</button>' +
          '<button type="button" class="tab" data-tab="saved" aria-selected="false">Saved</button>' +
          '<button type="button" class="tab" data-tab="review" aria-selected="false">Check</button></nav>' +
          '<section id="panel-today" class="panel active"><div class="list">' +
          mealRows(today.meals, { canDelete: true }) + '</div></section>' +
          '<section id="panel-week" class="panel"><div class="week-chart">' +
          days.map((day) => '<div class="bar-wrap"><div class="row-meta">' + num(day.totals?.calories) +
          '</div><div class="bar" style="height:' + Math.max(2, Number(day.totals?.calories || 0) / maxCalories * 100) +
          '%"></div><div class="bar-label">' + esc(new Date(day.date + 'T12:00:00Z').toLocaleDateString(undefined,{weekday:'short'}).slice(0,1)) +
          '</div></div>').join("") + '</div><div class="macros"><div class="macro"><div class="eyebrow">Avg calories</div><strong>' +
          num(data.week?.averages?.calories) + '</strong></div><div class="macro"><div class="eyebrow">Protein consistency</div><strong>' +
          num(data.week?.proteinConsistencyPct) + '%</strong></div></div></section>' +
          '<section id="panel-weight" class="panel">' +
          (weights.length ? '<div class="spark"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Weight trend"><polyline points="' +
            esc(points) + '" fill="none" stroke="#2f6bff" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<div class="row"><div><div class="row-title">' + num(data.weightTrend?.latestWeight, 2) + ' ' +
            esc(data.weightTrend?.unit) + '</div><div class="row-meta">latest weight</div></div><div class="row-value">' +
            num(data.weightTrend?.weeklyRate, 2) + ' / week</div></div>' : '<div class="empty">No weight entries yet.</div>') +
          '</section><section id="panel-saved" class="panel"><div class="list">' +
          (saved.length ? saved.map((meal) => '<div class="row"><div><div class="row-title">' + esc(meal.name) +
            '</div><div class="row-meta">' + esc(meal.restaurant || "Saved meal") + ' · ' + num(meal.totals?.proteinG) +
            'g protein</div></div><div><div class="row-value">' + num(meal.totals?.calories) +
            ' cal</div><button type="button" class="btn ghost" data-log-saved="' + esc(meal.id) +
            '">Log now</button></div></div>').join("")
            : '<div class="empty">No saved meals yet.</div>') + '</div></section>' +
          '<section id="panel-review" class="panel"><div class="list">' +
          (review.length ? mealRows(review) : '<div class="empty">No low-confidence entries.</div>') +
          '</div></section>' +
          (!goals.calorieGoal || !goals.proteinGoalG
            ? '<div class="actions"><button type="button" id="set-goals" class="btn primary">Set goals</button></div>'
            : '') + '</section></div>';
        setupTabs();
        bindSavedIngredientRemovals([...(today.meals || []), ...review]);
        bindMealEdits([...(today.meals || []), ...review]);
        document.querySelectorAll("[data-delete]").forEach((button) => {
          button.addEventListener("click", async () => {
            if (!confirm("Remove this meal from your history?")) return;
            await callTool("delete_meal", { mealId: button.dataset.delete, confirmed: true });
            const next = await callTool("render_dashboard", { date: today.date });
            if (next?.structuredContent) render(next.structuredContent);
          });
        });
        document.querySelectorAll("[data-log-saved]").forEach((button) => {
          button.addEventListener("click", async () => {
            const result = await callTool("log_saved_meal", {
              savedMealId: button.dataset.logSaved,
              mealType: "other",
              localDate: today.date
            });
            if (result?.structuredContent) render(result.structuredContent);
          });
        });
        const goalsButton = document.getElementById("set-goals");
        if (goalsButton) goalsButton.onclick = () =>
          sendMessage("Help me set calorie, protein, macro, fiber, weight, and timezone goals.");
      }
      function render(data) {
        latestOutput = data;
        if (data?.kind === "meal_preview") renderPreview(data);
        else if (data?.kind === "meal_saved") renderSaved(data);
        else if (data?.kind === "day_summary") renderDaySummary(data);
        else if (data?.kind === "nutrition_dashboard") renderDashboard(data);
        else root.innerHTML = '<div class="card empty">Nutrition data is ready.</div>';
      }
      window.addEventListener("message", (event) => {
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!message || message.jsonrpc !== "2.0") return;
        if (message.id !== undefined && pending.has(message.id)) {
          const task = pending.get(message.id);
          pending.delete(message.id);
          message.error ? task.reject(message.error) : task.resolve(message.result);
          return;
        }
        if (message.method === "ui/notifications/tool-result") {
          const output = message.params?.structuredContent;
          if (output) render(output);
        }
      }, { passive: true });
      if (latestOutput) render(latestOutput);
      request("ui/initialize", {
        appInfo: { name: "nutrition-tracker", version: "1.0.0" },
        appCapabilities: {},
        protocolVersion: "2025-11-21"
      }).then(() => notify("ui/notifications/initialized")).catch(() => {});
      const resize = new ResizeObserver(() => notify("ui/notifications/size-changed", {
        width: Math.ceil(document.documentElement.getBoundingClientRect().width),
        height: Math.ceil(document.documentElement.getBoundingClientRect().height)
      }));
      resize.observe(document.documentElement);
    })();
  </script>
</body>
</html>
`.trim();
