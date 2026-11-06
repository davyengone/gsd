import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { assertWithinRateLimit } from "@/lib/auth/rate-limit";
import { actionInput, actionPatch, createAction, listActions, statuses, updateAction } from "@/lib/actions/store";
import type { Skill } from "./types";

export const actionsSkill: Skill = {
  name: "actions",
  description: "Manage explicit tasks on the private Actions board.",
  register(server: McpServer) {
    server.registerTool("list_actions", {
      title: "List actions",
      description: "Read saved Actions board tasks. For what is due today or this week, pass dueTo as the end date; this includes overdue tasks. Omit dueTo to see undated tasks too. Completed tasks are omitted by default; set includeDone to true to see all. Never infer unsaved tasks from journal notes.",
      inputSchema: z.object({ status: z.enum(statuses).optional(), dueFrom: z.iso.date().optional(), dueTo: z.iso.date().optional(), includeDone: z.boolean().default(false), limit: z.number().int().min(1).max(100).default(50) }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async (args) => {
      assertWithinRateLimit("list_actions");
      const actions = await listActions(args);
      return { structuredContent: { actions }, content: [{ type: "text" as const, text: `Found ${actions.length} saved action(s).` }] };
    });
    server.registerTool("create_action", {
      title: "Create an action",
      description: "Create a task only when the user asks to save, add, or track a to-do. Keep speculative ideas in Ideas. Use a due date only when stated or agreed; do not invent deadlines. Tags are optional. sourceEntryId may link a verified existing journal note.",
      inputSchema: actionInput,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    }, async (args) => {
      assertWithinRateLimit("create_action");
      const action = await createAction(args);
      return { structuredContent: { action }, content: [{ type: "text" as const, text: `Created ${action.title} in ${action.status}.` }] };
    });
    server.registerTool("update_action", {
      title: "Update an action",
      description: "Change the title, details, lane, due date, or tags of a saved task. Use the exact ID returned by list_actions. Set status to done only when the user confirms completion.",
      inputSchema: z.object({ id: z.string().uuid(), changes: actionPatch }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    }, async ({ id, changes }) => {
      assertWithinRateLimit("update_action");
      const action = await updateAction(id, changes);
      if (!action) return { isError: true, content: [{ type: "text" as const, text: `No action has ID ${id}.` }] };
      return { structuredContent: { action }, content: [{ type: "text" as const, text: `Updated ${action.title}; status is ${action.status}.` }] };
    });
  },
};
