# rawquery plugin for Claude Code

Claude Code plugin for the [rawquery](https://rawquery.dev) data platform. Query your data with SQL, explore schemas, manage connections, build charts and dashboards through natural language.

## Connect to rawquery

### CLI (recommended)

The `rq` CLI is the core interface. Install it, log in, and generate the Claude Code skill:

```bash
curl -fsSL https://dl.rawquery.dev/install.sh | sh
rq login
rq claude-init
```

This creates `.claude/skills/rq/SKILL.md` in your current directory. Claude Code picks it up automatically and can run `rq` commands on your behalf.

### Plugin (CLI + extras)

Same CLI integration, plus a data-analyst agent and guided commands:

```
/plugin install github:rawquery/rawquery-plugin
```

Requires `rq` CLI installed and logged in.

### MCP server (no CLI needed)

For environments where you can't install the CLI (Cowork, remote setups). Add this to your MCP config:

```json
{
  "mcpServers": {
    "rawquery": {
      "type": "sse",
      "url": "https://mcp.rawquery.dev/sse",
      "headers": {
        "X-API-Key": "rq_your_key_here",
        "X-Workspace": "your-workspace-slug"
      }
    }
  }
}
```

Get your API key at [rawquery.dev](https://rawquery.dev) > Settings > API Keys. Zero install, works anywhere.

## What's included

### MCP tools (20 tools)

Available when using the MCP server (remote or local via plugin):

| Tool | What it does |
|------|-------------|
| `list_tables` | List all tables with row counts and sizes |
| `describe_table` | Show columns, types, metadata for a table |
| `execute_query` | Run SQL queries (DuckDB, Postgres-compatible) |
| `list_connections` | List data source connections |
| `get_connection` | Get connection details and sync status |
| `trigger_sync` | Start a data sync |
| `get_sync_status` | Check sync progress |
| `list_saved_queries` | List saved queries |
| `create_saved_query` | Save a SQL query for reuse |
| `run_saved_query` | Execute a saved query |
| `list_charts` | List charts |
| `create_chart` | Create a chart from a saved query |
| `publish_chart` | Make a chart publicly accessible |
| `list_pages` | List dashboard pages |
| `create_page` | Create a dashboard from charts |
| `publish_page` | Make a page publicly accessible |
| `list_transforms` | List SQL transforms |
| `run_transform` | Execute a transform |
| `get_usage` | Show current billing period usage |

### Skill, agent, commands

The plugin includes a skill (auto-invoked context for rawquery work), a `data-analyst` agent for deep exploration, and guided commands (`/rawquery:explore`, `/rawquery:dashboard`). These work with both MCP tools and the `rq` CLI.

## Self-host the MCP server

```bash
cd mcp-server
npm install
RAWQUERY_API_KEY=rq_... RAWQUERY_WORKSPACE=my-workspace node index.mjs --sse --port 3100
```

Or with Docker:

```bash
cd mcp-server
docker build -t rawquery-mcp .
docker run -p 3100:3100 \
  -e RAWQUERY_API_URL=https://api.rawquery.dev \
  rawquery-mcp
```

The SSE server is multi-tenant: each client passes their own API key and workspace via HTTP headers.

## Docs

[rawquery.dev/docs/claude-code](https://rawquery.dev/docs/claude-code)
