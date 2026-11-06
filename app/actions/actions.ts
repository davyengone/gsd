"use server";

import { revalidatePath } from "next/cache";
import { hasDashboardSession } from "@/lib/auth/session";
import { assertWithinRateLimit } from "@/lib/auth/rate-limit";
import { createAction, updateAction } from "@/lib/actions/store";

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
  await updateAction(id, fields(form) as Parameters<typeof updateAction>[1]);
  revalidatePath("/actions");
}

export async function moveActionFromForm(form: FormData) {
  if (!(await hasDashboardSession())) throw new Error("Unauthorized");
  assertWithinRateLimit("dashboard_move_action");
  await updateAction(String(form.get("id") ?? ""), { status: String(form.get("status") ?? "") as "ideas" });
  revalidatePath("/actions");
}
