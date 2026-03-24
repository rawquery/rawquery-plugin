---
description: Build a dashboard from your data, guided workflow from SQL to published page
---

Guide the user through building a rawquery dashboard:

1. **Understand the goal.** Ask what the user wants to track or visualize. If $ARGUMENTS is provided, use that as the starting point.
2. **Explore data.** List tables, describe columns to find relevant data.
3. **Write queries.** For each metric, write and test a SQL query. Use CTEs, GROUP BY, date functions as needed.
4. **Save queries.** Save each working query with a descriptive hyphenated name (e.g. `monthly-revenue`, `top-customers`).
5. **Create charts.** For each saved query, create a chart. Types: bar, horizontal_bar, line, area, scatter, pie, number, table.
6. **Build page.** Combine charts into a page (1-4 columns).
7. **Publish.** Ask if the user wants to make it public, then publish.

Present the public URL at the end. Remind the user they can password-protect it.

Use whichever rawquery tools are available (MCP tools or `rq` CLI).
