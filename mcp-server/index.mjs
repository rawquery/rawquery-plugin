#!/usr/bin/env node

/**
 * rawquery MCP Server
 *
 * Exposes rawquery platform capabilities as MCP tools.
 *
 * Transports:
 *   - stdio (default): local use, credentials from env vars
 *   - sse (--sse): remote/multi-tenant, credentials from HTTP headers per connection
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { createServer } from "http";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = process.env.RAWQUERY_API_URL || "https://api.rawquery.dev";
const args = process.argv.slice(2);
const useSSE = args.includes("--sse");
const portArg = args.find((_, i) => args[i - 1] === "--port");
const port = parseInt(portArg || process.env.PORT || "3100", 10);

// SSE security limits
const MAX_SESSIONS = 50;
const MAX_SESSIONS_PER_IP = 3;
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min
const MAX_MESSAGE_BYTES = 512 * 1024; // 512 KB
const API_KEY_MIN_LENGTH = 8;
const WORKSPACE_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

// ---------------------------------------------------------------------------
// HTTP client factory - returns api() and ws() bound to specific credentials
// ---------------------------------------------------------------------------

function createClient(apiKey, workspace) {
  async function api(method, path, body = null) {
    const url = `${API_BASE}/api/v1${path}`;
    const headers = { "X-API-Key": apiKey, "Content-Type": "application/json" };
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    const text = await res.text();

    if (!res.ok) {
      let detail = text;
      try {
        const parsed = JSON.parse(text);
        detail = parsed.error?.message || parsed.detail || text;
      } catch {}
      throw new Error(`${res.status} ${detail}`);
    }

    return text ? JSON.parse(text) : null;
  }

  function ws(path) {
    return `/workspaces/${workspace}${path}`;
  }

  return { api, ws };
}

// ---------------------------------------------------------------------------
// Tool registration - registers all tools on a server using the given client
// ---------------------------------------------------------------------------

function registerTools(server, client) {
  const { api, ws } = client;

  // ---- Exploration --------------------------------------------------------

  server.tool(
    "list_tables",
    "List all tables in the workspace with row counts and sizes",
    {},
    async () => {
      const data = await api("GET", ws("/query/tables"));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "describe_table",
    "Show columns, types, row count and size for a table",
    { table: z.string().describe("Full table name: schema.table (e.g. stripe.customers)") },
    async ({ table }) => {
      const data = await api("GET", ws(`/query/tables/${encodeURIComponent(table)}/metadata`));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "execute_query",
    "Execute a SQL query and return results. DuckDB dialect, Postgres-compatible syntax. Tables are schema.table format.",
    {
      sql: z.string().describe("SQL query to execute"),
      estimate_only: z.boolean().optional().describe("If true, only estimate cost without executing"),
    },
    async ({ sql, estimate_only }) => {
      const body = { sql };
      if (estimate_only) body.estimate_only = true;
      const data = await api("POST", ws("/query"), body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ---- Connections --------------------------------------------------------

  server.tool(
    "list_connections",
    "List all data source connections in the workspace",
    {},
    async () => {
      const data = await api("GET", ws("/connections"));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_connection",
    "Get details for a specific connection including sync status",
    { connection_id: z.string().describe("Connection UUID") },
    async ({ connection_id }) => {
      const data = await api("GET", ws(`/connections/${connection_id}`));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "trigger_sync",
    "Trigger a data sync for a connection. Returns a job ID to poll.",
    {
      connection_id: z.string().describe("Connection UUID"),
      full_refresh: z.boolean().optional().describe("Force full refresh instead of incremental"),
    },
    async ({ connection_id, full_refresh }) => {
      const body = full_refresh ? { full_refresh: true } : {};
      const data = await api("POST", ws(`/connections/${connection_id}/sync`), body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_sync_status",
    "Get sync status for a connection",
    { connection_id: z.string().describe("Connection UUID") },
    async ({ connection_id }) => {
      const data = await api("GET", ws(`/connections/${connection_id}/sync-status`));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ---- Saved Queries ------------------------------------------------------

  server.tool(
    "list_saved_queries",
    "List all saved queries in the workspace",
    {},
    async () => {
      const data = await api("GET", ws("/saved-queries"));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_saved_query",
    "Create a new saved query. Names must be lowercase with hyphens (e.g. monthly-revenue).",
    {
      name: z.string().describe("Query name (lowercase, hyphens: my-query)"),
      sql: z.string().describe("SQL query"),
      description: z.string().optional().describe("Description of the query"),
    },
    async ({ name, sql, description }) => {
      const body = { name, sql };
      if (description) body.description = description;
      const data = await api("POST", ws("/saved-queries"), body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "run_saved_query",
    "Execute a saved query by name",
    {
      name: z.string().describe("Saved query name"),
      parameters: z.record(z.string()).optional().describe("Parameters for parameterized queries"),
    },
    async ({ name, parameters }) => {
      const body = parameters ? { parameters } : {};
      const data = await api("POST", ws(`/saved-queries/${encodeURIComponent(name)}/run`), body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ---- Charts -------------------------------------------------------------

  server.tool(
    "list_charts",
    "List all charts in the workspace",
    {},
    async () => {
      const data = await api("GET", ws("/charts"));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_chart",
    "Create a chart from a saved query. Types: bar, horizontal_bar, line, area, scatter, pie, number, table.",
    {
      name: z.string().describe("Chart name (lowercase, hyphens)"),
      query_name: z.string().describe("Name of the saved query to visualize"),
      type: z.enum(["bar", "horizontal_bar", "line", "area", "scatter", "pie", "number", "table"]).describe("Chart type"),
      x: z.string().optional().describe("X-axis column (required for bar/line/area/scatter)"),
      y: z.string().optional().describe("Y-axis column (required for bar/line/area/scatter)"),
      label: z.string().optional().describe("Label column (required for pie)"),
      value: z.string().optional().describe("Value column (required for pie and number)"),
      title: z.string().optional().describe("Chart title"),
    },
    async ({ name, query_name, type, x, y, label, value, title }) => {
      const config = { type };
      if (x) config.x = x;
      if (y) config.y = y;
      if (label) config.label = label;
      if (value) config.value = value;
      if (title) config.title = title;
      const data = await api("POST", ws("/charts"), { name, query_name, config });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "publish_chart",
    "Publish a chart to make it publicly accessible. Returns the public URL.",
    {
      name: z.string().describe("Chart name"),
      password: z.string().optional().describe("Optional password protection"),
    },
    async ({ name, password }) => {
      const body = password ? { password } : {};
      const data = await api("POST", ws(`/charts/${encodeURIComponent(name)}/publish`), body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ---- Pages --------------------------------------------------------------

  server.tool(
    "list_pages",
    "List all pages/dashboards in the workspace",
    {},
    async () => {
      const data = await api("GET", ws("/pages"));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_page",
    "Create a dashboard page from multiple charts",
    {
      name: z.string().describe("Page name (lowercase, hyphens)"),
      title: z.string().optional().describe("Page title"),
      columns: z.number().min(1).max(4).optional().describe("Grid columns (1-4, default 2)"),
      charts: z.array(z.object({
        name: z.string().describe("Chart name"),
        span: z.number().optional().describe("Column span (default 1)"),
      })).describe("Charts to include"),
    },
    async ({ name, title, columns, charts }) => {
      const body = { name, charts };
      if (title) body.title = title;
      if (columns) body.columns = columns;
      const data = await api("POST", ws("/pages"), body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "publish_page",
    "Publish a page to make it publicly accessible. Returns the public URL.",
    {
      name: z.string().describe("Page name"),
      password: z.string().optional().describe("Optional password protection"),
    },
    async ({ name, password }) => {
      const body = password ? { password } : {};
      const data = await api("POST", ws(`/pages/${encodeURIComponent(name)}/publish`), body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ---- Transforms ---------------------------------------------------------

  server.tool(
    "list_transforms",
    "List all SQL transforms in the workspace",
    {},
    async () => {
      const data = await api("GET", ws("/transforms"));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "run_transform",
    "Execute a transform immediately",
    { transform_id: z.string().describe("Transform UUID") },
    async ({ transform_id }) => {
      const data = await api("POST", ws(`/transforms/${transform_id}/run`));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ---- Usage --------------------------------------------------------------

  server.tool(
    "get_usage",
    "Get workspace usage for the current billing period",
    {},
    async () => {
      const data = await api("GET", ws("/usage/current"));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

// ---------------------------------------------------------------------------
// Transport: stdio (local, single-tenant)
// ---------------------------------------------------------------------------

if (!useSSE) {
  const apiKey = process.env.RAWQUERY_API_KEY;
  const workspace = process.env.RAWQUERY_WORKSPACE;

  if (!apiKey) {
    console.error("RAWQUERY_API_KEY is required. Create one at rawquery.dev > Settings > API Keys.");
    process.exit(1);
  }
  if (!workspace) {
    console.error("RAWQUERY_WORKSPACE is required. Set it to your workspace slug.");
    process.exit(1);
  }

  const server = new McpServer({ name: "rawquery", version: "1.2.0" });
  registerTools(server, createClient(apiKey, workspace));

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// ---------------------------------------------------------------------------
// Transport: SSE (remote, multi-tenant - credentials from HTTP headers)
// ---------------------------------------------------------------------------

if (useSSE) {
  const sessions = {};        // sessionId -> { transport, server, ip, lastActivity, timer }
  const ipSessionCount = {};  // ip -> count

  function getClientIP(req) {
    // Caddy sets X-Forwarded-For
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.socket.remoteAddress;
  }

  function destroySession(sessionId) {
    const session = sessions[sessionId];
    if (!session) return;
    clearTimeout(session.timer);
    if (session.ip && ipSessionCount[session.ip] > 0) {
      ipSessionCount[session.ip]--;
      if (ipSessionCount[session.ip] === 0) delete ipSessionCount[session.ip];
    }
    delete sessions[sessionId];
  }

  function resetIdleTimer(sessionId) {
    const session = sessions[sessionId];
    if (!session) return;
    clearTimeout(session.timer);
    session.lastActivity = Date.now();
    session.timer = setTimeout(() => {
      console.error(`Session ${sessionId} idle timeout, closing`);
      destroySession(sessionId);
    }, SESSION_IDLE_TIMEOUT_MS);
  }

  async function validateApiKey(apiKey, workspace) {
    // Validate key by hitting a lightweight endpoint
    const url = `${API_BASE}/api/v1/workspaces/${encodeURIComponent(workspace)}/usage/current`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-API-Key": apiKey },
    });
    return res.ok || res.status === 403; // 403 = valid key but no access to workspace
  }

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const ip = getClientIP(req);

    // No CORS - MCP clients connect server-side, not from browsers
    // If a browser-based client needs it, add specific origin, not *

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check - no session count leak
    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // SSE connection
    if (url.pathname === "/sse" && req.method === "GET") {
      const apiKey = req.headers["x-api-key"];
      const workspace = req.headers["x-workspace"];

      // --- Input validation ---
      if (!apiKey || typeof apiKey !== "string" || apiKey.length < API_KEY_MIN_LENGTH) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or missing X-API-Key header" }));
        return;
      }

      if (!workspace || typeof workspace !== "string" || !WORKSPACE_PATTERN.test(workspace)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or missing X-Workspace header" }));
        return;
      }

      // --- Global session cap ---
      if (Object.keys(sessions).length >= MAX_SESSIONS) {
        console.error(`Global session limit reached (${MAX_SESSIONS}), rejecting ${ip}`);
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server at capacity, try again later" }));
        return;
      }

      // --- Per-IP session cap ---
      const currentIPSessions = ipSessionCount[ip] || 0;
      if (currentIPSessions >= MAX_SESSIONS_PER_IP) {
        console.error(`Per-IP session limit (${MAX_SESSIONS_PER_IP}) reached for ${ip}`);
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Too many sessions from this IP" }));
        return;
      }

      // --- Validate API key against the real API before accepting ---
      try {
        const valid = await validateApiKey(apiKey, workspace);
        if (!valid) {
          console.error(`Invalid API key from ${ip}`);
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid API key" }));
          return;
        }
      } catch (err) {
        console.error(`API key validation failed: ${err.message}`);
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Could not validate API key" }));
        return;
      }

      // --- Create session ---
      const mcpServer = new McpServer({ name: "rawquery", version: "1.2.0" });
      registerTools(mcpServer, createClient(apiKey, workspace));

      const transport = new SSEServerTransport("/messages", res);
      const sessionId = transport.sessionId;

      ipSessionCount[ip] = (ipSessionCount[ip] || 0) + 1;

      sessions[sessionId] = {
        transport,
        server: mcpServer,
        ip,
        lastActivity: Date.now(),
        timer: null,
      };

      resetIdleTimer(sessionId);

      res.on("close", () => destroySession(sessionId));

      console.error(`Session ${sessionId} opened for workspace ${workspace} from ${ip} (${Object.keys(sessions).length} active)`);
      await mcpServer.connect(transport);
      return;
    }

    // Message routing
    if (url.pathname === "/messages" && req.method === "POST") {
      const sessionId = url.searchParams.get("sessionId");
      const session = sessions[sessionId];
      if (!session) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
        return;
      }

      // Body size limit
      let body = "";
      let exceeded = false;
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > MAX_MESSAGE_BYTES) {
          exceeded = true;
          req.destroy();
        }
      });
      req.on("end", async () => {
        if (exceeded) {
          if (!res.headersSent) {
            res.writeHead(413, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Message too large" }));
          }
          return;
        }

        resetIdleTimer(sessionId);

        try {
          await session.transport.handlePostMessage(req, res, body);
        } catch (err) {
          console.error("Message handling error:", err.message);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal error" }));
          }
        }
      });
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  httpServer.listen(port, () => {
    console.error(`rawquery MCP server (SSE) listening on port ${port}`);
    console.error(`API backend: ${API_BASE}`);
    console.error(`Limits: ${MAX_SESSIONS} sessions max, ${MAX_SESSIONS_PER_IP}/IP, ${SESSION_IDLE_TIMEOUT_MS / 60000}min idle timeout`);
  });
}
