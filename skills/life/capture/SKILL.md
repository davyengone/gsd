---
name: capture-life
description: Save and query personal life notes through the GetShitDone MCP server.
---

When the user asks to save, remember, log, or journal a life update, send the original words to `capture_life_update` once. GSD extracts finance, work, health, groceries, kids, and reflection facts. Do not split the note into several tool calls or invent missing amounts or dates.

When the user asks what happened or what a day cost, use `get_day_summary` with the exact date. Use `list_life_records` for broader questions. State when the records do not support an answer. Do not save ordinary conversation without the user's intent to do so.
