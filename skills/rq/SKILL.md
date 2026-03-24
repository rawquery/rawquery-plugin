---
name: rq
description: Use when working with rawquery. Querying data with SQL, exploring tables and schemas, managing data sources and syncs, running transforms, managing async jobs, creating charts and dashboards. Auto-invoke when the user discusses their data, wants SQL help, needs to visualize results, or needs to interact with their rawquery workspace.
---

# rawquery

rawquery is a data platform: connect your SaaS, query with SQL, zero infra.

## How to interact

Use the rawquery MCP tools: `list_tables`, `describe_table`, `execute_query`, `list_connections`, `get_connection`, `trigger_sync`, `get_sync_status`, `list_saved_queries`, `create_saved_query`, `run_saved_query`, `list_charts`, `create_chart`, `publish_chart`, `list_pages`, `create_page`, `publish_page`, `list_transforms`, `run_transform`, `get_usage`.

## Key concepts

- **Schema = connection name.** Connection "my-pg" becomes SQL schema `my_pg`. Tables are `schema.table`.
- **Charts, pages are private by default.** `create` does NOT publish. Use `publish` to get a public URL.
- **Saved query names** use hyphens (`my-query`). **Transform names** use underscores (`my_transform`).

## SQL

DuckDB dialect, Postgres-compatible (translated via sqlglot).

- Tables: `schema.table` (e.g. `stripe.customers`)
- CTEs, window functions, UNION/INTERSECT/EXCEPT all work
- Date: `DATE_TRUNC('month', col)`, `CURRENT_DATE`, `INTERVAL '30 days'`
- JSON: `->>`, `json_extract_string(col, '$.key')`
- No DDL, no INSERT/UPDATE/DELETE

## Workflow patterns

### Explore
```
list_tables > describe_table > execute_query
```

### Dashboard
```
execute_query (test) > create_saved_query > create_chart > create_page > publish_page
```

Chart types: bar, horizontal_bar, line, area, scatter, pie, number, table.

### Teardown (dependency order)
```
pages > charts > saved queries > tables/connections
```

## Best practices

- Always describe a table before querying. Never guess column names.
- Use LIMIT when exploring.
- Start simple, refine iteratively.
- Use CTEs for readability.
