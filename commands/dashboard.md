---
description: Build a dashboard from your data, guided workflow from SQL to published page
---

Guide the user through building a rawquery dashboard:

1. **Understand the goal.** Ask what the user wants to track or visualize. If $ARGUMENTS is provided, use that as the starting point.
2. **Explore data.** Use `list_tables` and `describe_table` to find relevant data.
3. **Write queries.** For each metric, use `execute_query` to test SQL. Use CTEs, GROUP BY, date functions as needed.
4. **Save queries.** Use `create_saved_query` for each working query. Use descriptive hyphenated names (e.g. `monthly-revenue`, `top-customers`).
5. **Create charts.** Use `create_chart` for each saved query. Types: bar, horizontal_bar, line, area, scatter, pie, number, table.
6. **Build page.** Use `create_page` to combine charts (1-4 columns).
7. **Publish.** Ask if the user wants to make it public, then use `publish_page`.

Present the public URL at the end.
