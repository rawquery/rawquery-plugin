# rawquery plugin for Claude Code

Claude Code plugin for the [rawquery](https://rawquery.dev) data platform. Query your data with SQL, explore schemas, manage connections, build charts and dashboards — all through natural language in Claude Code.

## Two ways to connect

| Mode | How it works | Best for |
|------|-------------|----------|
| **MCP Server** | Talks directly to the rawquery API. No CLI needed. | Cowork, remote environments, quick setup |
| **CLI wrapping** | Uses the `rq` CLI on your machine. | Local development, full CLI access |

The plugin includes both. Use whichever fits your setup.

## Install

From Claude Code:

```
/plugin install github:rawquery/rawquery-plugin
```

Or load locally for testing:

```bash
claude --plugin-dir ./rawquery-plugin
```

## Setup: MCP Server (recommended)

The MCP server connects directly to the rawquery API using your API key. No CLI installation needed.

### 1. Get your API key

Go to [rawquery.dev](https://rawquery.dev) > Settings > API Keys and create a new key.

### 2. Configure the MCP server

After installing the plugin, configure the environment variables. In Claude Code settings or your shell environment:

```bash
export RAWQUERY_API_KEY="rq_your_key_here"
export RAWQUERY_WORKSPACE="your-workspace-slug"
```

The plugin's `.mcp.json` will start the MCP server automatically.

### Remote MCP server

For environments without local Node.js (like Cowork), you can connect to a hosted MCP server:

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

### Self-host the MCP server

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
  -e RAWQUERY_API_KEY=rq_... \
  -e RAWQUERY_WORKSPACE=my-workspace \
  rawquery-mcp
```

## Setup: CLI mode

If you prefer using the `rq` CLI directly:

1. Install the CLI: `curl -fsSL https://dl.rawquery.dev/install.sh | sh`
2. Login: `rq login`

The skill and commands will use `rq` commands on your behalf.

## What's included

### MCP Server tools

The MCP server exposes these tools to Claude:

| Tool | What it does |
|------|-------------|
| `list_tables` | List all tables with row counts and sizes |
| `describe_table` | Show columns, types, metadata for a table |
| `execute_query` | Run SQL queries (DuckDB, Postgres-compatible) |
| `list_connections` | List data source connections |
| `get_connection` | Get connection details and sync status |
| `trigger_sync` | Start a data sync for a connection |
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

### Skill: `rq`

Auto-invoked by Claude when you discuss your data, ask SQL questions, or need to interact with rawquery. Gives Claude full context of your workspace — schemas, tables, connections, saved queries, transforms, charts, and pages.

### Agent: `data-analyst`

A specialized agent for data exploration and analysis. Use it when you need to:
- Investigate a metric or business question
- Explore unfamiliar data across multiple tables
- Build complex queries iteratively

### Commands

| Command | What it does |
|---------|-------------|
| `/rawquery:explore` | Guided exploration of your workspace — schemas, tables, data preview |
| `/rawquery:explore customers` | Jump straight to exploring a specific table or topic |
| `/rawquery:dashboard` | Guided dashboard creation — from SQL to published page |
| `/rawquery:dashboard revenue` | Start building a dashboard around a specific topic |

## How it works

**MCP mode**: The MCP server makes authenticated HTTP requests to the rawquery API (`api.rawquery.dev`). Auth via API key, same permissions as your account.

**CLI mode**: Claude runs `rq` commands on your behalf — same auth, same workspace, same data. No additional API keys or configuration needed beyond `rq login`.

Everything `rq` can do, Claude can do through this plugin: query, connect sources, sync data, create charts, build dashboards, manage transforms.

## Docs

Full documentation: [rawquery.dev/docs/claude-code](https://rawquery.dev/docs/claude-code)
