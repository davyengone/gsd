import { createMcpHandler } from "mcp-handler";
import { ALL_SKILLS } from "@/lib/skills/registry";
import { handleMcpEvent } from "@/lib/mcp/logger";

/**
 * Builds the GetShitDone MCP handler with all registered skills.
 * Auth is enforced at the route layer (secret path token), not here.
 * Future: wrap with `withMcpAuth` from mcp-handler for OAuth 2.1.
 */
export const mcpHandler = createMcpHandler(
  (server) => {
    for (const skill of ALL_SKILLS) {
      skill.register(server);
    }
  },
  {
    serverInfo: {
      name: "getshitdone",
      version: "0.1.0",
    },
    instructions:
      "GetShitDone finance skills. Before calling log_expense, confirm implausible amounts (e.g. $1380 for breakfast likely means $13.80), default currency to EUR when unspecified, and default occurredAt to today. Never invent amounts, merchants, or dates. Echo back what was written.",
    verboseLogs: process.env.NODE_ENV === "development",
    onEvent: handleMcpEvent,
  },
);
