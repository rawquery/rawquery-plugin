# rawquery plugin for Claude Code

Claude Code plugin for the [rawquery](https://rawquery.dev) data platform. Query your data with SQL, explore schemas, manage connections, build charts and dashboards — all through natural language in Claude Code.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed
- [rq CLI](https://rawquery.dev/docs/cli) installed and logged in (`rq login`)

## Install

From Claude Code:

```
/plugin install github:rawquery/rawquery-plugin
```

Or load locally for testing:

```bash
claude --plugin-dir ./rawquery-plugin
```

## What's included

### Skill: `rq`

Auto-invoked by Claude when you discuss your data, ask SQL questions, or need to interact with rawquery. Gives Claude full context of your workspace — schemas, tables, connections, saved queries, transforms, charts, and pages.

The skill loads your workspace state dynamically each time it activates, so Claude always sees your current data.

### Agent: `data-analyst`

A specialized agent for data exploration and analysis. Use it when you need to:
- Investigate a metric or business question
- Explore unfamiliar data across multiple tables
- Build complex queries iteratively

The agent explores your schema first, never assumes column names, and presents results with clear summaries.

### Commands

| Command | What it does |
|---------|-------------|
| `/rawquery:explore` | Guided exploration of your workspace — schemas, tables, data preview |
| `/rawquery:explore customers` | Jump straight to exploring a specific table or topic |
| `/rawquery:dashboard` | Guided dashboard creation — from SQL to published page |
| `/rawquery:dashboard revenue` | Start building a dashboard around a specific topic |

## How it works

The plugin wraps the `rq` CLI. Claude runs `rq` commands on your behalf — same auth, same workspace, same data. No additional API keys or configuration needed beyond `rq login`.

Everything `rq` can do, Claude can do through this plugin: query, connect sources, sync data, create charts, build dashboards, manage transforms.

## Standalone alternative

If you don't want the full plugin, you can use the built-in skill generator instead:

```bash
rq claude-init
```

This creates a standalone `.claude/skills/rq/SKILL.md` in your current directory. The plugin provides the same skill plus the agent and commands.

## Docs

Full documentation: [rawquery.dev/docs/claude-code](https://rawquery.dev/docs/claude-code)
