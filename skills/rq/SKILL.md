---
name: rq
description: Use when working with rawquery — querying data with SQL, exploring tables and schemas, managing data sources and syncs, running transforms, managing async jobs, creating charts and dashboards. Auto-invoke when the user discusses their data, wants SQL help, needs to visualize results, or needs to interact with their rawquery workspace.
allowed-tools: Bash(rq *)
---

# rawquery CLI

rawquery is a data platform: connect your SaaS, query with SQL, zero infra. CLI is the canonical interface — the UI is the viewer.

## Principles

- **If it needs docs for the simple case, it's a bug.** The happy path must be self-evident.
- **If the error doesn't say what to do, it's a bug.** Every error includes what went wrong, why, and what to do next.
- **CLI first.** `rq` is the power tool. Everything a user can do in the UI, they can do from the CLI.
- **Schema = connection name.** Connection "my-pg" becomes SQL schema `my_pg`. Tables live at `schema.table`.
- **Charts, pages are private by default.** `create` does NOT publish. Use `publish` to get a public URL.

## How to work

1. **Before using a subcommand you haven't used before**, run `rq <command> --help` to discover flags and options.
2. **After a sync**, run `rq describe schema.table` to check actual column names — some connectors normalize them (e.g. Google Sheets lowercases + snake_cases).
3. **Use `-f json`** when you need to parse results programmatically. Use `-f table` when showing to the user.
4. **Use single quotes** for SQL in `rq query`. Zsh/bash mangle `!` in double quotes.
5. **Use LIMIT** when exploring. Use `rq jobs submit` for long-running queries.
6. **Saved query names** use hyphens (`my-query`). **Transform names** use underscores (`my_transform`). Don't mix them up.
7. **Values prefixed with `@`** are read from file (e.g. `-c service_account_json=@key.json`).

## Workspace Context

!`rq config 2>&1 || echo "Not logged in — run: rq login"`

Schemas:
!`rq schemas -f json 2>/dev/null || echo "[]"`

Tables:
!`rq tables -f json 2>/dev/null || echo "[]"`

Connections:
!`rq connections -f json 2>/dev/null || echo "[]"`

Saved queries:
!`rq queries -f json 2>/dev/null || echo "[]"`

Transforms:
!`rq transforms -f json 2>/dev/null || echo "[]"`

Charts:
!`rq charts -f json 2>/dev/null || echo "[]"`

Pages:
!`rq pages -f json 2>/dev/null || echo "[]"`

## Commands

Top-level commands — run `rq <command> --help` for full usage.

| Command | What it does |
|---------|-------------|
| `query` | Execute a SQL query |
| `schemas` | List schemas with table counts |
| `tables` | List available tables |
| `describe` | Show table schema and metadata |
| `connections` | Manage data source connections (create, sync, test, delete) |
| `connect` | Create an HTTP connector from a spec file |
| `push` | Push data into a table (JSON, CSV, JSONL) |
| `queries` | Manage saved queries |
| `transforms` | Manage SQL transforms (DAG, scheduling) |
| `charts` | Manage charts (create, publish, unpublish) |
| `pages` | Manage pages/dashboards (create, publish, unpublish) |
| `jobs` | Manage async query jobs |
| `drop` | Drop an Iceberg table |
| `usage` | Show workspace usage for the current billing period |
| `config` | Show current configuration |
| `open` | Open the dashboard in your browser |
| `api-keys` | List and revoke API keys |
| `login` | Authenticate with rawquery |
| `update` | Update rq to the latest version |

### Global flags

```
-f json|table|csv    Output format
--limit N            Max rows to display
--no-truncate        Show all rows
-w <slug>            Override workspace
```

## Workflow Patterns

### Simple: connect a source, query it
```
connections create → connections test → connections sync → describe → query
```
Data lands in Iceberg tables. Schema name = connection name. Query with standard SQL.

Built-in connectors: Postgres, MySQL, Stripe, HubSpot, Salesforce, Shopify, Google Sheets. For **any other API**, use the HTTP connector (`rq connect <name> --spec spec.json`) — it turns any REST/GraphQL API into a synced data source via a JSON spec (pagination, auth, rate limits, field mapping). HubSpot requires OAuth setup via the web UI.

### API access: sync + expose via saved query
```
connections create → connections sync → queries create --sql "..." → queries run
```
Saved queries are callable via the REST API: `GET /api/v1/workspaces/{slug}/saved-queries/{name}/run` — use this to serve data to external apps via curl/fetch.

### Dashboard: multiple sources → charts → public page
```
connections create (x N) → connections sync (x N) → queries create (per chart) → charts create (per query) → pages create --charts a,b,c → pages publish
```
For joins across sources, just query them together — all synced tables share the same DuckDB engine:
`SELECT s.email, h.deal_amount FROM stripe.customers s JOIN hubspot.deals h ON s.email = h.contact_email`

### Live query: direct access to a database (Postgres/MySQL only)
```
connections create → connections update --query-mode live → query "SELECT ... FROM schema.table"
```
No sync, no Iceberg — queries hit the source database directly via DuckDB's scanner. Always-fresh, read-only. Can join live tables with synced Iceberg tables in the same query.

### Analytics pipeline: sources → transform → chart
```
connections create (x N) → connections sync (x N) → transforms create --sql "SELECT ... FROM a JOIN b ..." → transforms run → queries create (from transform output) → charts create → pages publish
```
Transforms materialize results as new tables. Use `{{ ref('other_transform') }}` to chain them into a DAG. Schedule with `--schedule "0 * * * *"`.

### Teardown: delete in dependency order
```
pages delete → charts delete → queries delete → drop table / connections delete
```
FK constraints enforce this order. A saved query cannot be deleted while a chart references it. A chart cannot be deleted while a page includes it. Always tear down from the top (pages) to the bottom (connections).

## SQL Dialect

DuckDB with Postgres-to-DuckDB translation (sqlglot). Write standard Postgres SQL.

- Tables: `schema.table` (e.g. `stripe.customers`)
- CTEs, window functions, UNION/INTERSECT/EXCEPT all work
- Date: `DATE_TRUNC('month', col)`, `CURRENT_DATE`, `INTERVAL '30 days'`
- JSON: `->>`, `json_extract_string(col, '$.key')`
- No DDL, no INSERT/UPDATE/DELETE — use `rq push` or connectors
