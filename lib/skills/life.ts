import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { assertWithinRateLimit } from "@/lib/auth/rate-limit";
import { captureLife, getDaySummary, listLife } from "@/lib/life/store";
import { createCategory, listCategories, updateCategory } from "@/lib/life/categories";
import { captureInputSchema, categoryIdSchema } from "@/lib/life/schema";
import type { Skill } from "./types";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const lifeSkill: Skill = {
  name: "life",
  description: "Capture life notes and query the private GSD database.",
  register(server: McpServer) {
    server.registerTool("capture_life_update", {
      title: "Capture a life update",
      description: "Use this when the user asks GSD to remember, journal, track, or log what they said. Send the user's original words in one call; GSD uses its saved category definitions to organize facts itself. This writes private records. Never call for ordinary conversation without the user's intent to save it.",
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
      description: "Use this to answer questions about saved records in any GSD category. Call list_life_categories to discover category IDs. Optional date narrows the results. Never infer records beyond what is returned.",
      inputSchema: z.object({ area: categoryIdSchema.optional(), date: dateSchema.optional(), limit: z.number().int().min(1).max(100).default(30) }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async (args) => {
      assertWithinRateLimit("list_life_records");
      if (args.area && !(await listCategories()).some((category) => category._id === args.area)) {
        return { isError: true, content: [{ type: "text" as const, text: `Unknown category ID ${args.area}. Call list_life_categories for the current IDs.` }] };
      }
      const data = await listLife(args);
      return { structuredContent: data, content: [{ type: "text" as const,
        text: `Found ${data.facts.length} fact(s) and ${data.entries.length} journal note(s).` }] };
    });

    server.registerTool("list_life_categories", {
      title: "List life categories",
      description: "List the current GSD categories and their descriptions before creating a category or querying a category by ID.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async () => {
      assertWithinRateLimit("list_life_categories");
      const categories = (await listCategories()).map(({ _id, name, description, isDefault }) => ({ id: _id, name, description, isDefault }));
      return { structuredContent: { categories }, content: [{ type: "text" as const, text: `${categories.length} categories are available: ${categories.map((category) => category.name).join(", ")}.` }] };
    });

    server.registerTool("create_life_category", {
      title: "Create a life category",
      description: "Use only when the user explicitly asks to add a new GSD category. Give it a concise name and, when the user explains what belongs there, a description. GSD saves the category and immediately uses it for future note extraction and the dashboard. Existing records are not changed.",
      inputSchema: z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().min(10).max(400).optional() }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    }, async ({ name, description }) => {
      assertWithinRateLimit("create_life_category");
      const { category, created } = await createCategory(name, description);
      const payload = { id: category._id, name: category.name, description: category.description, created };
      return { structuredContent: payload, content: [{ type: "text" as const,
        text: `${created ? "Created" : "Already have"} the ${category.name} category. Its ID is ${category._id}. GSD can use it for future life updates.` }] };
    });

    server.registerTool("update_life_category", {
      title: "Refine a life category",
      description: "Use when the user explicitly asks to rename a category or change what it captures. Its ID remains stable, so existing facts keep their category.",
      inputSchema: z.object({ id: categoryIdSchema, name: z.string().trim().min(2).max(60).optional(), description: z.string().trim().min(10).max(400).optional() }).refine((value) => value.name || value.description, { message: "Provide a name or description" }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    }, async ({ id, name, description }) => {
      assertWithinRateLimit("update_life_category");
      const category = await updateCategory(id, { name, description });
      if (!category) return { isError: true, content: [{ type: "text" as const, text: `No category has ID ${id}. Call list_life_categories for the current IDs.` }] };
      return { structuredContent: { id: category._id, name: category.name, description: category.description }, content: [{ type: "text" as const,
        text: `Updated ${category.name}. Future life updates use the new description; existing facts remain in this category.` }] };
    });
  },
};
