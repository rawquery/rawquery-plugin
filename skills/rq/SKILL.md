---
name: rq
description: Use when working with rawquery. Querying data with SQL, exploring tables and schemas, managing data sources and syncs, running transforms, managing async jobs, creating charts and dashboards. Auto-invoke when the user discusses their data, wants SQL help, needs to visualize results, or needs to interact with their rawquery workspace.
---

# rawquery

rawquery is a data platform: connect your SaaS, query with SQL, zero infra.

## How to interact

Use whichever tools are available:

- **MCP tools** (rawquery server): `list_tables`, `describe_table`, `execute_query`, `list_connections`, `trigger_sync`, `create_saved_query`, `run_saved_query`, `create_chart`, `publish_chart`, `create_page`, `publish_page`, `list_transforms`, `run_transform`, `get_usage`
- **CLI** (if `rq` is installed): `rq query`, `rq tables`, `rq describe`, etc.

If both are available, prefer MCP tools.

## Key concepts

- **Schema = connection name.** Connection "my-pg" becomes SQL schema `my_pg`. Tables live at `schema.table`.
- **Charts, pages are private by default.** `create` does NOT publish. Use `publish` to get a public URL.
- **Saved query names** use hyphens (`my-query`). **Transform names** use underscores (`my_transform`).
- **DuckDB SQL dialect**, Postgres-compatible (translated via sqlglot).

## SQL

- Tables: `schema.table` (e.g. `stripe.customers`)
- CTEs, window functions, UNION/INTERSECT/EXCEPT all work
- Date: `DATE_TRUNC('month', col)`, `CURRENT_DATE`, `INTERVAL '30 days'`
- JSON: `->>`, `json_extract_string(col, '$.key')`
- No DDL, no INSERT/UPDATE/DELETE

## Workflow patterns

### Explore → query
```
list tables → describe table → execute query
```

### Dashboard: sources → charts → public page
```
list tables → execute query (test) → create saved query → create chart → create page → publish page
```
Chart types: bar, horizontal_bar, line, area, scatter, pie, number, table.

### Teardown: delete in dependency order
```
pages → charts → saved queries → tables/connections
```
FK constraints enforce this order.

## Best practices

- Always check column names before querying (describe first, never guess)
- Use LIMIT when exploring
- Start simple, refine iteratively
- Use CTEs for readability
