---
description: Build a dashboard from your data — guided workflow from SQL to published page
---

Guide the user through building a rawquery dashboard. Follow these steps:

1. **Understand the goal.** Ask what the user wants to track or visualize. If $ARGUMENTS is provided, use that as the starting point.

2. **Explore data.** Run `rq tables` and `rq describe` to find relevant tables and columns.

3. **Write queries.** For each metric or chart the user wants, write a SQL query and test it with `rq query`. Use CTEs, GROUP BY, date functions as needed.

4. **Save queries.** Save each working query with `rq queries create <name> --sql '...'`. Use descriptive hyphenated names (e.g. `monthly-revenue`, `top-customers`).

5. **Create charts.** For each saved query, create a chart:
   ```
   rq charts create <name> --query <query-name> --type <type> --x <col> --y <col>
   ```
   Chart types: bar, horizontal_bar, line, area, scatter, pie, number, table.

6. **Build page.** Combine charts into a page:
   ```
   rq pages create <name> --charts chart1,chart2,chart3
   ```

7. **Publish.** Ask if the user wants to make it public, then:
   ```
   rq pages publish <name>
   ```

Present the public URL at the end. Remind the user they can password-protect it with `rq pages update <name> --password <pwd>`.
