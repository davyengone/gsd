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
      "GSD stores private life notes. When the user asks to remember, journal, log, or track a note, call capture_life_update once with the original words. GSD extracts and files facts internally. For questions about saved data, use get_day_summary or list_life_records. Never claim an unreported expense or silently save ordinary chat. Write calls may require ChatGPT confirmation.",
    verboseLogs: process.env.NODE_ENV === "development",
    onEvent: handleMcpEvent,
  },
);
