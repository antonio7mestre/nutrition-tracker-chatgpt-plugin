import { homedir, platform } from "node:os";
import { join } from "node:path";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createNutritionServer } from "./server.js";
import { NutritionStore } from "./store.js";
import { WIDGET_HTML } from "./widget.js";
import {
  dashboardPreviewData,
  mealPreviewData,
  savedMealPreviewData,
} from "./preview-data.js";

function defaultDbPath(): string {
  if (platform() === "darwin") {
    return join(
      homedir(),
      "Library",
      "Application Support",
      "Nutrition Tracker",
      "nutrition.sqlite",
    );
  }
  if (platform() === "win32") {
    const appData = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appData, "Nutrition Tracker", "nutrition.sqlite");
  }
  const dataHome = process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
  return join(dataHome, "nutrition-tracker", "nutrition.sqlite");
}

function resolveDbPath(): string {
  return process.env.NUTRITION_DB_PATH?.trim() || defaultDbPath();
}

async function runStdio(): Promise<void> {
  const store = new NutritionStore(resolveDbPath());
  const server = createNutritionServer(store);
  const transport = new StdioServerTransport();
  const shutdown = async () => {
    await server.close();
    store.close();
  };
  process.once("SIGINT", () => void shutdown().finally(() => process.exit(0)));
  process.once("SIGTERM", () => void shutdown().finally(() => process.exit(0)));
  await server.connect(transport);
}

async function runHttp(): Promise<void> {
  const store = new NutritionStore(resolveDbPath());
  const app = createMcpExpressApp();
  const host = process.env.HOST?.trim() || "127.0.0.1";
  const port = Number.parseInt(process.env.PORT || "3000", 10);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "nutrition-tracker", version: "0.1.0" });
  });
  if (host === "127.0.0.1" || host === "localhost" || host === "::1") {
    app.get("/widget-preview", (req, res) => {
      const preview =
        req.query.kind === "meal"
          ? mealPreviewData
          : req.query.kind === "saved"
            ? savedMealPreviewData
            : dashboardPreviewData;
      const previewScript = `<script>window.postMessage(${JSON.stringify({
        jsonrpc: "2.0",
        method: "ui/notifications/tool-result",
        params: { structuredContent: preview },
      })}, "*");</script>`;
      res.type("html").send(WIDGET_HTML.replace("</body>", `${previewScript}</body>`));
    });
  }

  app.post("/mcp", async (req, res) => {
    const server = createNutritionServer(store);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.once("close", () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      console.error("MCP request failed", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.all("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
  });

  const listener = app.listen(port, host, (error?: Error) => {
    if (error) throw error;
    console.error(`Nutrition Tracker MCP listening at http://${host}:${port}/mcp`);
  });
  const shutdown = () => {
    listener.close(() => {
      store.close();
      process.exit(0);
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

const mode = process.argv.includes("--http") ? "http" : "stdio";
await (mode === "http" ? runHttp() : runStdio());
