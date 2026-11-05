# GetShitDone

Personal productivity skills for ChatGPT / Codex. This repo hosts:

1. **Skills** — `SKILL.md` workflow instructions under [`skills/`](./skills/)
2. **MCP server** — tools that actually write to your apps (`/api/mcp/<token>`)

v1 ships the **finance / log-expense** skill: say *"I spent €13.80 on breakfast"* and ChatGPT calls `log_expense`.

## Architecture

| Layer | Role |
| --- | --- |
| `skills/**/SKILL.md` | When to activate, sanity checks, defaults, confirmation |
| `lib/skills/**` | Registers MCP tools for each skill |
| `app/api/mcp/[token]/route.ts` | Streamable HTTP MCP endpoint + secret-path auth |
| `lib/finance/client.ts` | Adapter to `finance.davy.build` (`stub` or `http`) |

## Setup

```bash
npm install
cp .env.example .env.local
# Set GSD_MCP_TOKEN to a 32+ char secret (see .env.example)
npm run dev
```

MCP URL (local):

```
http://localhost:3000/api/mcp/<GSD_MCP_TOKEN>
```

### Env vars

| Variable | Required | Notes |
| --- | --- | --- |
| `GSD_MCP_TOKEN` | yes | Path secret; min 32 chars; fail-closed if missing |
| `GSD_MAX_EXPENSE_AMOUNT` | no | Default `10000` |
| `FINANCE_MODE` | no | `stub` (default) or `http` |
| `FINANCE_API_URL` | if http | e.g. `https://finance.davy.build/api/` |
| `FINANCE_API_KEY` | if http | Bearer token for the finance API |

## Local verification

```bash
npx @modelcontextprotocol/inspector
```

Connect with **Streamable HTTP** to `http://localhost:3000/api/mcp/<token>`. Confirm:

- Initialize succeeds
- Tools: `log_expense`, `list_expenses`
- Valid `log_expense` returns a stubbed record
- Amount over `GSD_MAX_EXPENSE_AMOUNT` is rejected
- Wrong token returns `404`

## Production

Deployed at: [https://getshitdone-beta.vercel.app](https://getshitdone-beta.vercel.app)

MCP endpoint shape:

```
https://getshitdone-beta.vercel.app/api/mcp/<GSD_MCP_TOKEN>
```

(Use the value of `GSD_MCP_TOKEN` from Vercel env / `.env.local` — never commit it.)

## Connect to ChatGPT (developer mode)

Requires Plus / Pro / Business / Enterprise on web.

1. ChatGPT → **Settings** → **Apps** → **Advanced** → enable **Developer mode**.
2. Create a developer-mode app / connector:
   - URL: `https://getshitdone-beta.vercel.app/api/mcp/<GSD_MCP_TOKEN>`
   - Authentication: **No authentication** (the secret is in the path)
3. Enable the app in a chat and try: *I spent 13.80 EUR on breakfast*.

**Security note:** a URL-embedded secret authenticates the connector, not end users. Fine for private single-user use. Move to OAuth 2.1 (`withMcpAuth` from `mcp-handler`) before anyone else installs this.

## Adding a skill

1. Create `skills/<domain>/<name>/SKILL.md` with `name` + `description` frontmatter.
2. Create `lib/skills/<domain>/<name>.ts` that exports a `Skill` and registers tools.
3. Add it to `ALL_SKILLS` in [`lib/skills/registry.ts`](./lib/skills/registry.ts).

## Wiring the real finance API

When `finance.davy.build` exposes a write endpoint:

```bash
FINANCE_MODE=http
FINANCE_API_URL=https://finance.davy.build/api/
FINANCE_API_KEY=...
```

Only [`lib/finance/client.ts`](./lib/finance/client.ts) needs to match the real payload shape.
