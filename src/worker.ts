import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createNutritionServer } from "./server.js";
import { D1NutritionStore } from "./d1-store.js";

interface Env {
  DB: D1Database;
  NUTRITION_ACCESS_KEY: string;
  OPENAI_APPS_CHALLENGE?: string;
}

const VERSION = "0.2.0";

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...securityHeaders,
    },
  });
}

function text(value: string, status = 200): Response {
  return new Response(value, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...securityHeaders,
    },
  });
}

function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} · Nutrition Tracker</title>
  <style>
    :root{color-scheme:dark;--bg:#05070b;--card:#101722;--line:#28354a;--ink:#f7f9fc;--muted:#a7b3c4;--blue:#2f6bff}
    *{box-sizing:border-box}body{margin:0;padding:28px 18px;background:radial-gradient(circle at 90% 0,rgba(47,107,255,.2),transparent 35%),var(--bg);color:var(--ink);font:600 16px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif}
    main{max-width:720px;margin:auto;padding:28px;border:1px solid var(--line);border-radius:24px;background:rgba(16,23,34,.94)}
    h1{margin:0 0 18px;font-size:clamp(32px,8vw,52px);line-height:1;letter-spacing:-.05em}h2{margin-top:30px}p,li{color:var(--muted)}strong,a{color:var(--ink)}a{text-decoration-color:var(--blue)}.mark{width:48px;height:7px;margin-bottom:22px;border-radius:99px;background:var(--blue)}
  </style>
</head>
<body><main><div class="mark"></div><h1>${title}</h1>${body}</main></body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        ...securityHeaders,
      },
    },
  );
}

function landing(): Response {
  return page(
    "Nutrition Tracker",
    `<p>A private ChatGPT plugin for meal, macro, goal, saved-order, and weight tracking.</p>
     <p>ChatGPT interprets meal photos, voice notes, restaurant orders, and natural-language descriptions. Nutrition Tracker stores the structured result and calculates date-specific totals.</p>
     <h2>Support</h2>
     <p>Use the support page below for connection and data-management guidance.</p>
     <p><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/support">Support</a></p>`,
  );
}

function privacy(): Response {
  return page(
    "Privacy policy",
    `<p><strong>Effective July 29, 2026.</strong></p>
     <p>Nutrition Tracker stores the structured nutrition information you ask it to save: meal dates and times, meal and ingredient names, portions, calories, protein, carbohydrates, fat, fiber, confidence estimates, assumptions, goals, saved meals, restaurant names, weight entries, and optional notes.</p>
     <p>The service uses this information only to provide nutrition logging, editing, summaries, trends, and the embedded dashboard. It does not sell data, serve advertising, or make OpenAI API calls.</p>
     <p>Data is stored in a private Cloudflare D1 database. ChatGPT sends tool inputs to the service when you invoke the plugin. Cloudflare and OpenAI may process request data under their own terms.</p>
     <p>You can edit or delete individual entries through the plugin. Disconnecting the plugin stops future access. Complete export and deletion controls are being prepared before any public release.</p>
     <p>This service is for general nutrition tracking and is not medical advice.</p>`,
  );
}

function terms(): Response {
  return page(
    "Terms of use",
    `<p><strong>Effective July 29, 2026.</strong></p>
     <p>Nutrition Tracker provides approximate nutrition estimates and personal tracking tools. Estimates can be wrong, especially when based on photos, restaurant meals, or incomplete descriptions.</p>
     <p>Do not use the service as a substitute for professional medical, dietary, or emergency advice. You are responsible for reviewing and correcting entries that affect your decisions.</p>
     <p>You may use the service for lawful personal nutrition tracking. Do not attempt to access another person's data, disrupt the service, or reverse-engineer access credentials.</p>
     <p>The service is provided as-is without warranties. Features may change as the plugin is improved.</p>
     <p>These terms apply to the personal preview. Public-release support details will be added before directory submission.</p>`,
  );
}

function support(): Response {
  return page(
    "Support",
    `<p>This page supports the personal preview of Nutrition Tracker.</p>
     <h2>Fast fixes</h2>
     <ul>
       <li>Correct a meal by describing the change naturally in the same ChatGPT conversation.</li>
       <li>Ask “show my nutrition dashboard for today” to refresh the date-specific card.</li>
       <li>If a day is wrong, ask ChatGPT to update the timezone in your nutrition goals.</li>
       <li>Disconnect the plugin from ChatGPT Settings to stop future access.</li>
     </ul>`,
  );
}

function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
      "Access-Control-Expose-Headers": "MCP-Session-Id, MCP-Protocol-Version",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") return landing();
    if (url.pathname === "/health") {
      return json({ ok: true, service: "nutrition-tracker", version: VERSION });
    }
    if (url.pathname === "/privacy") return privacy();
    if (url.pathname === "/terms") return terms();
    if (url.pathname === "/support") return support();
    if (url.pathname === "/.well-known/openai-apps-challenge") {
      return env.OPENAI_APPS_CHALLENGE
        ? text(env.OPENAI_APPS_CHALLENGE)
        : text("Challenge not configured.", 404);
    }

    const accessKey = env.NUTRITION_ACCESS_KEY?.trim();
    if (!accessKey || url.pathname !== `/mcp/${accessKey}`) {
      return json({ error: "Not found." }, 404);
    }
    if (request.method === "OPTIONS") return corsPreflight();

    const store = new D1NutritionStore(env.DB);
    const server = createNutritionServer(store);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    try {
      await server.connect(transport);
      const response = await transport.handleRequest(request);
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set(
        "Access-Control-Expose-Headers",
        "MCP-Session-Id, MCP-Protocol-Version",
      );
      ctx.waitUntil(
        Promise.allSettled([transport.close(), server.close()]).then(() => undefined),
      );
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error("MCP request failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      ctx.waitUntil(
        Promise.allSettled([transport.close(), server.close()]).then(() => undefined),
      );
      return json(
        {
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        },
        500,
      );
    }
  },
};
