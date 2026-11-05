import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { assertWithinRateLimit } from "@/lib/auth/rate-limit";
import { captureLife, getDaySummary, listLife } from "@/lib/life/store";
import { areas, captureInputSchema } from "@/lib/life/schema";
import type { Skill } from "./types";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const lifeSkill: Skill = {
  name: "life",
  description: "Capture life notes and query the private GSD database.",
  register(server: McpServer) {
    server.registerTool("capture_life_update", {
      title: "Capture a life update",
      description: "Use this when the user asks GSD to remember, journal, track, or log what they said. Send the user's original words in one call; GSD extracts finance, work, health, grocery, kids, and journal facts itself. This writes private records. Never call for ordinary conversation without the user's intent to save it.",
      inputSchema: captureInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    }, async (args) => {
      assertWithinRateLimit("capture_life_update");
      const result = await captureLife(args);
      const payload = { entryId: result.entry._id, occurredAt: result.entry.occurredAt, duplicate: result.duplicate, extractionStatus: result.entry.extractionStatus,
        facts: result.facts.map(({ _id, area, kind, title, amount, currency }) => ({ id: _id, area, kind, title, amount, currency })) };
      return { structuredContent: payload, content: [{ type: "text" as const,
        text: result.entry.extractionStatus === "failed" ? `Saved the original note for ${result.entry.occurredAt}, but extraction failed. Retry this same note to complete it.` : result.entry.extractionStatus === "pending" ? `This note is being processed. Check again shortly.` : `${result.duplicate ? "Already captured" : "Captured"} the note for ${result.entry.occurredAt}; saved ${result.facts.length} extracted fact(s).` }] };
    });

    server.registerTool("get_day_summary", {
      title: "Get a day summary",
      description: "Use this when the user asks what happened or how much a particular day cost. Returns only saved GSD records and explicit expenses; totals are separated by currency.",
      inputSchema: z.object({ date: dateSchema }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async ({ date }) => {
      assertWithinRateLimit("get_day_summary");
      const summary = await getDaySummary(date);
      return { structuredContent: summary, content: [{ type: "text" as const,
        text: `${date}: ${summary.entries.length} note(s), ${summary.facts.length} fact(s), ${summary.expenseCount} expense(s). Totals: ${JSON.stringify(summary.totals)}.` }] };
    });

    server.registerTool("list_life_records", {
      title: "List life records",
      description: "Use this to answer questions about saved finance, journal, work, health, groceries, or kids records. Optional date narrows the results. Never infer records beyond what is returned.",
      inputSchema: z.object({ area: z.enum(areas).optional(), date: dateSchema.optional(), limit: z.number().int().min(1).max(100).default(30) }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async (args) => {
      assertWithinRateLimit("list_life_records");
      const data = await listLife(args);
      return { structuredContent: data, content: [{ type: "text" as const,
        text: `Found ${data.facts.length} fact(s) and ${data.entries.length} journal note(s).` }] };
    });
  },
};
