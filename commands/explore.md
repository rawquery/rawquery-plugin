---
description: Explore your rawquery workspace. List schemas, tables, and preview data
---

Explore the user's rawquery workspace:

1. List all tables with row counts
2. Ask the user which table they want to explore
3. Describe the chosen table (columns, types)
4. Preview data (SELECT * LIMIT 10)
5. Summarize what the table contains and suggest useful queries

If the user provides $ARGUMENTS (a table name or topic), skip the listing and go directly to exploring that table.

Use whichever rawquery tools are available (MCP tools or `rq` CLI).
