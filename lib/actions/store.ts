import { randomUUID } from "node:crypto";
import { z } from "zod";
import { lifeDb } from "@/lib/life/db";
import type { LifeEntry } from "@/lib/life/schema";
import { tagColors } from "./tag-colors";

export const statuses = ["ideas", "planned", "in_progress", "done"] as const;
export type ActionStatus = typeof statuses[number];
const date = z.iso.date();
export const actionInput = z.object({
  title: z.string().trim().min(2).max(180),
  detail: z.string().trim().max(2000).default(""),
  status: z.enum(statuses).default("ideas"),
  dueDate: date.nullable().default(null),
  tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
  tagColors: z.record(z.string().max(32), z.enum(tagColors)).default({}),
  sourceEntryId: z.string().uuid().nullable().default(null),
});
export const actionPatch = actionInput.pick({ title: true, detail: true, status: true, dueDate: true, tags: true, tagColors: true }).partial().refine((value) => Object.keys(value).length > 0);
export type ActionItem = z.infer<typeof actionInput> & { _id: string; createdAt: string; updatedAt: string; completedAt: string | null };

async function collection() {
  const db = await lifeDb();
  const items = db.collection<ActionItem>("action_items");
  await items.createIndex({ status: 1, dueDate: 1, createdAt: -1 });
  await items.createIndex({ sourceEntryId: 1 });
  return items;
}

export async function listActions(options: { status?: ActionStatus; dueFrom?: string; dueTo?: string; includeDone?: boolean; limit?: number } = {}) {
  const query: Record<string, unknown> = {};
  if (options.status) query.status = options.status;
  else if (options.includeDone === false) query.status = { $ne: "done" };
  if (options.dueFrom || options.dueTo) query.dueDate = { ...(options.dueFrom ? { $gte: date.parse(options.dueFrom) } : {}), ...(options.dueTo ? { $lte: date.parse(options.dueTo) } : {}) };
  return (await collection()).find(query).sort({ dueDate: 1, createdAt: -1 }).limit(Math.min(Math.max(options.limit ?? 200, 1), 500)).toArray();
}

export async function createAction(input: z.input<typeof actionInput>) {
  const value = actionInput.parse(input);
  if (value.sourceEntryId) {
    const entry = await (await lifeDb()).collection<LifeEntry>("life_entries").findOne({ _id: value.sourceEntryId });
    if (!entry) throw new Error("Source journal entry not found");
  }
  const now = new Date().toISOString();
  const item: ActionItem = { ...value, _id: randomUUID(), createdAt: now, updatedAt: now, completedAt: value.status === "done" ? now : null };
  await (await collection()).insertOne(item);
  return item;
}

export async function updateAction(id: string, patch: z.input<typeof actionPatch>) {
  z.string().uuid().parse(id);
  const value = actionPatch.parse(patch);
  const items = await collection();
  const existing = await items.findOne({ _id: id });
  if (!existing) return null;
  const now = new Date().toISOString();
  const completedAt = value.status === undefined ? existing.completedAt : value.status === "done" ? existing.completedAt ?? now : null;
  return items.findOneAndUpdate({ _id: id }, { $set: { ...value, completedAt, updatedAt: now } }, { returnDocument: "after" });
}

export async function deleteAction(id: string) {
  z.string().uuid().parse(id);
  return (await collection()).deleteOne({ _id: id });
}
