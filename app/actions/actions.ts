"use server";

import { revalidatePath } from "next/cache";
import { hasDashboardSession } from "@/lib/auth/session";
import { assertWithinRateLimit } from "@/lib/auth/rate-limit";
import { createAction, deleteAction, statuses, updateAction } from "@/lib/actions/store";
import { tagColors } from "@/lib/actions/tag-colors";
import { z } from "zod";

function fields(form: FormData) {
  return {
    title: String(form.get("title") ?? ""),
    detail: String(form.get("detail") ?? ""),
    status: String(form.get("status") ?? "ideas"),
    dueDate: String(form.get("dueDate") ?? "") || null,
    tags: String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
  };
}

export async function createActionFromForm(form: FormData) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_create_action");
  await createAction(fields(form) as Parameters<typeof createAction>[0]);
  revalidatePath("/actions");
}

export async function updateActionFromForm(form: FormData) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_update_action");
  const id = String(form.get("id") ?? "");
  const { tags, ...value } = fields(form);
  await updateAction(id, { ...value, ...(form.has("tags") ? { tags } : {}) } as Parameters<typeof updateAction>[1]);
  revalidatePath("/actions");
}

export async function updateActionTags(id: string, tags: string[], colors: Record<string, string>) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_update_action_tags");
  const validatedTags = z.array(z.string().trim().min(1).max(32)).max(8).parse(tags);
  if (new Set(validatedTags.map((tag) => tag.toLowerCase())).size !== validatedTags.length) throw new Error("Duplicate tags");
  const validatedColors = z.record(z.string(), z.enum(tagColors)).parse(colors);
  const action = await updateAction(id, { tags: validatedTags, tagColors: Object.fromEntries(validatedTags.map((tag) => [tag, validatedColors[tag] ?? "teal"])) });
  if (!action) throw new Error("Action not found");
  revalidatePath("/actions");
}

export async function deleteActionFromBoard(id: string) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_delete_action");
  const result = await deleteAction(id);
  if (!result.deletedCount) throw new Error("Action not found");
  revalidatePath("/actions");
}

export async function moveActionToLane(id: string, destination: string) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_move_action");
  const status = z.enum(statuses).parse(destination);
  const action = await updateAction(id, { status });
  if (!action) throw new Error("Action not found");
  revalidatePath("/actions");
}
