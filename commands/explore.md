---
description: Explore your rawquery workspace. List schemas, tables, and preview data
---

Explore the user's rawquery workspace:

1. Use `list_tables` to show all tables with row counts
2. Ask the user which table they want to explore
3. Use `describe_table` on their choice to show columns and types
4. Use `execute_query` with SELECT * LIMIT 10 to preview data
5. Summarize what the table contains and suggest useful queries

If the user provides $ARGUMENTS (a table name or topic), skip the listing and go directly to exploring that table.
