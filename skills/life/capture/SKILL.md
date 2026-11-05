---
name: capture-life
description: Save and query personal life notes through the GetShitDone MCP server.
---

When the user asks to save, remember, log, or journal a life update, send the original words to `capture_life_update` once. GSD extracts facts using its current category definitions, including categories the user has added. Do not split the note into several tool calls or invent missing amounts or dates.

When the user asks what happened or what a day cost, use `get_day_summary` with the exact date. Use `list_life_records` for broader questions. State when the records do not support an answer. Do not save ordinary conversation without the user's intent to do so.

When the user explicitly asks to add a category, call `list_life_categories` to check for an existing one, then `create_life_category` with its name and the user's description of what belongs there. Use `update_life_category` when asked to refine the name or description. The category ID stays stable; adding or refining a category affects future extraction, while existing facts remain as saved.
