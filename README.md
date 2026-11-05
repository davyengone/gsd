# GSD

A private life log connected to ChatGPT through one MCP server. ChatGPT sends a user's original note to `capture_life_update`; GSD uses the AI SDK to extract supported facts and saves both the note and facts in MongoDB. The same MCP server answers queries from saved records. `/my-life` shows the records in a private dashboard.

## Data flow

`ChatGPT → /api/mcp/<GSD_MCP_TOKEN> → capture_life_update → AI SDK → MongoDB (life_entries, life_facts) → /my-life`

The original note is always retained. Each extracted fact has `sourceQuote` so a user can trace it back to their words. Expenses are counted only when an amount and spending context are explicit. Amounts without a currency remain unspecified and are not mixed into EUR totals.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

| Name | Purpose |
| --- | --- |
| `GSD_MCP_TOKEN` | Private token of at least 32 characters, used in the MCP URL and to unlock `/my-life`. |
| `MONGODB_URI` | MongoDB connection URI with read and write access to the GSD database. |
| `ANTHROPIC_API_KEY` | Anthropic API key for extraction through the Vercel AI SDK's Anthropic provider. |

Optional: `MONGODB_DB` (default `gsd`), `GSD_EXTRACTION_MODEL` (default `claude-sonnet-4-6` for the direct Anthropic provider).

Create a private token with `openssl rand -base64 32 | tr '+/' '-_' | tr -d '='`. Keep it out of Git. Use a separate MongoDB database and credentials for GSD.

## Connect in ChatGPT

After deploying to `gsd.davy.build`, add a custom MCP server in ChatGPT Plugins with this **Streamable HTTP** URL:

`https://gsd.davy.build/api/mcp/<GSD_MCP_TOKEN>`

Choose **No authentication** for this private, single-user connection; the URL token is the credential. Install the plugin in a conversation. Say “Use GSD to capture this day: …”, then ask “Use GSD: how much did 2026-11-05 cost?” ChatGPT may ask to confirm the write action. A plugin tool is selected by the model when relevant; GSD does not receive every ChatGPT message in the background.

Available tools:

- `capture_life_update` — one call for the original note; GSD extracts and saves it.
- `get_day_summary` — a date's notes, facts, expenses, and per-currency totals.
- `list_life_records` — browse one area or date.

The dashboard at `/my-life` asks for `GSD_MCP_TOKEN` once and sets an HTTP-only session cookie. This is single-user authentication. Replace it and the path-token MCP authentication with OAuth before offering the app to other users.

## Local verification

Run `npx @modelcontextprotocol/inspector`, select Streamable HTTP, and connect to `http://localhost:3000/api/mcp/<GSD_MCP_TOKEN>`. Verify initialization, the three tools, an invalid-token `404`, a capture, and a date summary. A successful write requires both MongoDB and Anthropic configuration.
