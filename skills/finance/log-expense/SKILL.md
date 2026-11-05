---
name: log-expense
description: Log a personal expense from natural language into the finance app. Use when the user mentions spending money, buying something, paying a bill, or recording a cost (e.g. "I spent $13.80 on breakfast").
---

# Log expense

Use this skill when the user reports a purchase or cost and wants it recorded.

## Workflow

1. Extract `amount`, `currency`, `description`, optional `category` / `merchant`, and `occurredAt`.
2. Sanity-check the amount against the context:
   - Breakfast / coffee / lunch / snacks are rarely above 100 in major currencies.
   - If `$1380` is claimed for breakfast, ask whether they meant `$13.80` before calling the tool.
   - Never silently "fix" an amount — confirm with the user.
3. Defaults (only when the user did not specify):
   - `currency`: `EUR`
   - `occurredAt`: today's date as `YYYY-MM-DD`
4. Call `log_expense` with the confirmed fields.
5. Echo back the structured result (id, amount, currency, description, date). If `stubbed: true`, tell the user the write was simulated.
6. Optionally call `list_expenses` if the user asks to verify recent entries.

## Do not

- Invent merchants, categories, amounts, or dates.
- Call `log_expense` before resolving an ambiguous or implausible amount.
- Expose or discuss the MCP URL token.
