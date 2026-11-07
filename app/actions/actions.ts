"use server";

import { revalidatePath } from "next/cache";
import { hasDashboardSession } from "@/lib/auth/session";
import { assertWithinRateLimit } from "@/lib/auth/rate-limit";
import { assignActionTags, createAction, createSharedTag, deleteAction, removeSharedTag, statuses, updateAction, updateSharedTag } from "@/lib/actions/store";
import { z } from "zod";

function fields(form: FormData) {
  return {
    title: String(form.get("title") ?? ""),
    detail: String(form.get("detail") ?? ""),
    status: String(form.get("status") ?? "ideas"),
    dueDate: String(form.get("dueDate") ?? "") || null,
    tags: form.getAll("tags").map(String).map((tag) => tag.trim()).filter(Boolean),
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
  const { tags: _tags, ...value } = fields(form);
  void _tags;
  await updateAction(id, value as Parameters<typeof updateAction>[1]);
  revalidatePath("/actions");
}

export async function setActionTags(id: string, tags: string[]) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_update_action_tags");
  const action = await assignActionTags(id, tags);
  if (!action) throw new Error("Action not found");
  revalidatePath("/actions");
}

export async function createTag(name: string, color: string) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_create_action_tag");
  await createSharedTag(name, color);
  revalidatePath("/actions");
}

export async function updateTag(previousName: string, name: string, color: string) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_update_action_tag");
  await updateSharedTag(previousName, name, color);
  revalidatePath("/actions");
}

export async function deleteTag(name: string) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_delete_action_tag");
  await removeSharedTag(name);
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
