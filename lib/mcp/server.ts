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
      "GSD stores private life notes, configurable categories, and an explicit Actions board. When the user asks to remember, journal, log, or track a note, call capture_life_update once with the original words. GSD extracts and files facts internally using the current categories. When the user explicitly asks for a new category, call create_life_category; use list_life_categories to check what already exists, and update_life_category when asked to refine one. For questions about saved life data, use get_day_summary or list_life_records. For what needs doing today or this week, use list_actions with a dueTo date that includes overdue tasks; distinguish undated and done tasks. When asked to add or change a to-do, use create_action or update_action, preserving the user's stated deadline and lane. Do not turn historical journal notes into tasks without a reviewed backfill. Never claim an unreported expense or silently save ordinary chat. Write calls may require ChatGPT confirmation.",
    verboseLogs: process.env.NODE_ENV === "development",
    onEvent: handleMcpEvent,
  },
);
