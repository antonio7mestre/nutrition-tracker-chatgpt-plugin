export const WIDGET_URI = "ui://nutrition-tracker/dashboard-v6.html";

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
    .progress > i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--accent),var(--accent-2)); width:0; transition:width .72s cubic-bezier(.22,1,.36,1); }
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
    .row > div:first-child { min-width:0; }
    .row-title { font-weight:850; overflow-wrap:anywhere; }
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
    .btn:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; }
    .preview { padding:20px; }
    .preview-total { display:flex; align-items:end; justify-content:space-between; gap:14px; margin:18px 0; }
    .ingredient-head { display:flex; align-items:end; justify-content:space-between; gap:12px; margin:18px 2px 9px; }
    .ingredient-head h2 { margin:3px 0 0; font-size:18px; font-weight:900; letter-spacing:-.025em; }
    .ingredient-breakdown { display:grid; gap:7px; margin:0 16px 14px; padding-top:13px; border-top:1px solid var(--line); }
    .ingredient-line { display:flex; align-items:center; justify-content:space-between; gap:10px; color:var(--muted); }
    .ingredient-line > span { flex:1; min-width:0; }
    .ingredient-line strong { color:var(--ink); font-weight:900; }
    .meal-metrics, .ingredient-metrics { text-align:right; white-space:nowrap; }
    .meal-metrics strong, .ingredient-metrics strong { display:block; color:var(--ink); font-weight:900; }
    .meal-metrics small, .ingredient-metrics small { display:block; margin-top:2px; color:var(--muted); font-size:11px; font-weight:800; }
    .meal-disclosure { border-top:1px solid var(--line); }
    .meal-disclosure summary {
      min-height:48px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:12px 16px;
      color:var(--accent-2);
      cursor:pointer;
      list-style:none;
      font-weight:900;
      touch-action:manipulation;
    }
    .meal-disclosure summary::-webkit-details-marker { display:none; }
    .meal-disclosure summary::after { content:"⌄"; font-size:18px; line-height:1; transition:transform .16s ease; }
    .meal-disclosure[open] summary::after { transform:rotate(180deg); }
    .meal-disclosure .when-open { display:none; }
    .meal-disclosure[open] .when-closed { display:none; }
    .meal-disclosure[open] .when-open { display:inline; }
    .assumptions { margin:14px 0 0; padding:13px 14px; border-radius:14px; background:rgba(167,179,196,.11); color:var(--muted); }
    .assumptions ul { margin:7px 0 0; padding-left:18px; }
    .status { padding:10px 12px; border-radius:12px; background:rgba(47,107,255,.16); color:var(--ink); margin-top:12px; }
    .day-card { margin:0; padding:18px; overflow:hidden; }
    .day-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
    .day-title { margin:3px 0 0; font-size:19px; letter-spacing:-.025em; }
    .day-kcal { display:flex; align-items:baseline; gap:7px; margin-top:14px; }
    .day-kcal strong { color:var(--accent-2); font-size:46px; font-weight:950; line-height:1; letter-spacing:-.06em; }
    .day-remaining { margin-left:auto; color:var(--muted); font-size:12px; font-weight:850; white-space:nowrap; }
    .day-macros { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; margin-top:12px; }
    .day-macro { padding:11px 12px; border:1px solid var(--line); border-radius:14px; background:color-mix(in srgb, var(--card) 75%, transparent); min-width:0; }
    .day-macro .eyebrow { font-size:9px; letter-spacing:.08em; }
    .day-macro strong { display:block; margin-top:3px; font-size:18px; font-weight:900; letter-spacing:-.035em; white-space:nowrap; }
    .day-macro.protein-share strong { color:var(--accent-2); }
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
      .day-head { display:flex; }
      .day-head .pill { padding:7px 9px; font-size:11px; }
      .day-macros { grid-template-columns:repeat(4,minmax(0,1fr)); }
      .day-macro { padding:9px 8px; }
      .day-macro strong { font-size:16px; }
      .actions { display:grid; grid-template-columns:1fr 1fr; padding:10px 0 max(4px, env(safe-area-inset-bottom)); }
      .actions .btn { width:100%; }
    }
    @media (max-width:400px) {
      .preview-total { display:block; }
      .preview-total .row-value { margin-top:16px; text-align:left; }
      .day-kcal { gap:6px; }
      .day-kcal strong { font-size:42px; }
      .day-remaining { margin-left:auto; font-size:10px; }
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
      const proteinCaloriePct = (totals) => Number(totals?.calories) > 0
        ? Math.max(0, Math.min(100, Math.round(Number(totals?.proteinG || 0) * 4 / Number(totals.calories) * 100)))
        : 0;
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
      function ingredientBreakdown(items) {
        if (!items?.length) return "";
        return '<div class="ingredient-breakdown">' + items.map((item) =>
          '<div class="ingredient-line"><span>' + esc(item.name) + ' · ' +
          esc(item.servingDescription) + '</span><div class="ingredient-metrics"><strong>' +
          num(item.proteinG) + 'g protein</strong><small>' + num(item.calories) +
          ' cal</small></div></div>').join("") + '</div>';
      }
      function mealRows(meals) {
        if (!meals?.length) return '<div class="empty">No meals logged yet.</div>';
        return meals.map((meal) => {
          return '<div class="meal-entry"><div class="row"><div><div class="row-title">🍽️ ' + esc(meal.name) +
            '</div><div class="row-meta">' + esc(meal.mealType) + '</div></div><div class="meal-metrics"><strong>' +
            num(meal.totals?.proteinG) + 'g protein</strong><small>' +
            num(meal.totals?.calories) + ' cal</small></div></div>' +
            ingredientBreakdown(meal.items) + '</div>';
        }).join("");
      }
      function collapsibleMealRows(meals) {
        if (!meals?.length) return '<div class="list"><div class="empty">No meals logged yet.</div></div>';
        const recent = meals.slice(0, 1);
        const older = meals.slice(1);
        return '<div class="list recent-meals">' + mealRows(recent) + '</div>' +
          (older.length
            ? '<details class="meal-disclosure"><summary><span class="when-closed">View all ' +
              meals.length + ' meals</span><span class="when-open">Show latest meal</span></summary>' +
              '<div class="list">' + mealRows(older) + '</div></details>'
            : "");
      }
      function dayTotalsCard(day, options = {}) {
        if (!day?.date) return "";
        const totals = day.totals || {};
        const goals = day.goals || {};
        const mealCount = options.projected
          ? Number(day.savedMealCount || 0)
          : Number(day.meals?.length || 0);
        const countLabel = options.projected
          ? (mealCount + 1) + " meals"
          : mealCount + " meal" + (mealCount === 1 ? "" : "s");
        const proteinGoal = Number(goals.proteinGoalG || 200);
        const proteinRemaining = proteinGoal - Number(totals.proteinG || 0);
        const newestMealProtein = Number(day.meals?.[0]?.totals?.proteinG || 0);
        const previousProtein = options.projected && options.current
          ? Number(options.current.totals?.proteinG || 0)
          : Math.max(0, Number(totals.proteinG || 0) - newestMealProtein);
        const progressStart = pct(previousProtein, proteinGoal);
        const progressTarget = pct(totals.proteinG, proteinGoal);
        const remainingLabel = proteinRemaining >= 0
          ? num(proteinRemaining) + "g to goal"
          : num(Math.abs(proteinRemaining)) + "g over goal";
        const proteinShare = proteinCaloriePct(totals);
        const comparison = options.projected && options.current
          ? '<div class="day-comparison">Currently saved: <strong>' +
            num(options.current.totals?.proteinG) + 'g protein</strong> · This estimate adds <strong>' +
            num(options.mealProtein) + 'g</strong>. Preview only.</div>'
          : "";
        return '<section class="card day-card"><div class="day-head"><div><div class="eyebrow">' +
          (options.projected ? "Protein if logged" : "Daily protein") +
          '</div><h2 class="day-title">' + esc(dateLabel(day.date)) + '</h2></div><span class="pill">' +
          esc(countLabel) + '</span></div><div class="day-kcal"><strong>' + num(totals.proteinG) +
          '</strong><span>g protein</span><span class="day-remaining">' + esc(remainingLabel) +
          '</span></div><div class="progress"><i data-progress-target="' + progressTarget +
          '" style="width:' + progressStart + '%"></i></div><div class="day-macros"><div class="day-macro"><div class="eyebrow">Calories</div><strong>' +
          num(totals.calories) + '</strong></div><div class="day-macro protein-share"><div class="eyebrow">% from P</div><strong>' +
          num(proteinShare) + '%</strong></div><div class="day-macro"><div class="eyebrow">Fiber</div><strong>' +
          num(totals.fiberG) + 'g</strong></div><div class="day-macro"><div class="eyebrow">Carbs</div><strong>' +
          num(totals.carbsG) + 'g</strong></div></div>' + comparison + '</section>';
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
          '<div id="meal-protein" class="metric-big">' + num(meal.totals?.proteinG) + '</div><div class="metric-sub">grams protein</div></div>' +
          '<div id="meal-summary" class="row-value"><strong>' + num(meal.totals?.calories) + ' calories</strong><br><span class="row-meta">' +
          num(proteinCaloriePct(meal.totals)) + '% from P · ' +
          num(meal.totals?.fiberG) + 'g fiber</span></div></div>' +
          '<div class="ingredient-head"><div><h2>Ingredients</h2></div>' +
          '<span class="pill">' + items.length + ' items</span></div>' + ingredientBreakdown(items) +
          (assumptions.length ? '<div class="assumptions"><strong>Assumptions</strong><ul>' +
            assumptions.map((item) => '<li>' + esc(item) + '</li>').join("") + '</ul></div>' : '') +
          '<div id="preview-status"></div><div class="actions"><button type="button" id="confirm" class="btn primary">Save meal</button>' +
          '<button type="button" id="adjust" class="btn">Change in chat</button></div></section>' +
          '<div id="projection">' + dayTotalsCard(data.projectedDay, {
            projected: true,
            current: data.day,
            mealProtein: meal.totals?.proteinG
          }) + '</div></div>';
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
          '<section class="card meals-card">' + collapsibleMealRows(meals) + '</section></div>';
      }
      function renderDashboard(data) {
        const today = data.today || {};
        const goals = today.goals || {};
        const days = data.week?.days || [];
        const maxProtein = Math.max(Number(goals.proteinGoalG || 200), ...days.map((d) => Number(d.totals?.proteinG || 0)), 1);
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
          '<section id="panel-today" class="panel active">' +
          collapsibleMealRows(today.meals) + '</section>' +
          '<section id="panel-week" class="panel"><div class="week-chart">' +
          days.map((day) => '<div class="bar-wrap"><div class="row-meta">' + num(day.totals?.proteinG) + 'g' +
          '</div><div class="bar" style="height:' + Math.max(2, Number(day.totals?.proteinG || 0) / maxProtein * 100) +
          '%"></div><div class="bar-label">' + esc(new Date(day.date + 'T12:00:00Z').toLocaleDateString(undefined,{weekday:'short'}).slice(0,1)) +
          '</div></div>').join("") + '</div><div class="macros"><div class="macro"><div class="eyebrow">Avg protein</div><strong>' +
          num(data.week?.averages?.proteinG) + 'g</strong></div><div class="macro"><div class="eyebrow">Protein goal days</div><strong>' +
          num(data.week?.proteinConsistencyPct) + '%</strong></div></div></section>' +
          '<section id="panel-weight" class="panel">' +
          (weights.length ? '<div class="spark"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Weight trend"><polyline points="' +
            esc(points) + '" fill="none" stroke="#2f6bff" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<div class="row"><div><div class="row-title">' + num(data.weightTrend?.latestWeight, 2) + ' ' +
            esc(data.weightTrend?.unit) + '</div><div class="row-meta">latest weight</div></div><div class="row-value">' +
            num(data.weightTrend?.weeklyRate, 2) + ' / week</div></div>' : '<div class="empty">No weight entries yet.</div>') +
          '</section><section id="panel-saved" class="panel"><div class="list">' +
          (saved.length ? saved.map((meal) => '<div class="row"><div><div class="row-title">' + esc(meal.name) +
            '</div><div class="row-meta">' + esc(meal.restaurant || "Saved meal") +
            '</div></div><div><div class="meal-metrics"><strong>' + num(meal.totals?.proteinG) +
            'g protein</strong><small>' + num(meal.totals?.calories) +
            ' cal</small></div><button type="button" class="btn ghost" data-log-saved="' + esc(meal.id) +
            '">Log now</button></div></div>').join("")
            : '<div class="empty">No saved meals yet.</div>') + '</div></section>' +
          '<section id="panel-review" class="panel"><div class="list">' +
          (review.length ? mealRows(review) : '<div class="empty">No low-confidence entries.</div>') +
          '</div></section>' +
          (!goals.calorieGoal || !goals.proteinGoalG
            ? '<div class="actions"><button type="button" id="set-goals" class="btn primary">Set goals</button></div>'
            : '') + '</section></div>';
        setupTabs();
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
      function animateProteinProgress() {
        document.querySelectorAll("[data-progress-target]").forEach((bar) => {
          const target = Math.max(0, Math.min(100, Number(bar.dataset.progressTarget || 0)));
          requestAnimationFrame(() => requestAnimationFrame(() => {
            bar.style.width = target + "%";
          }));
        });
      }
      function render(data) {
        latestOutput = data;
        if (data?.kind === "meal_preview") renderPreview(data);
        else if (data?.kind === "meal_saved") renderSaved(data);
        else if (data?.kind === "day_summary") renderDaySummary(data);
        else if (data?.kind === "nutrition_dashboard") renderDashboard(data);
        else root.innerHTML = '<div class="card empty">Nutrition data is ready.</div>';
        animateProteinProgress();
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
