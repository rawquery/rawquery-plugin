---
description: Explore your rawquery workspace — list schemas, tables, and preview data
---

Explore the user's rawquery workspace. Do the following steps:

1. Run `rq schemas` to show all available schemas
2. Run `rq tables` to list all tables with row counts
3. Ask the user which table they want to explore
4. Run `rq describe <schema.table>` on their choice to show columns and types
5. Run `rq query 'SELECT * FROM <schema.table> LIMIT 10'` to preview data
6. Summarize what the table contains and suggest useful queries

If the user provides $ARGUMENTS (a table name or topic), skip the listing and go directly to exploring that table or searching for relevant tables.
