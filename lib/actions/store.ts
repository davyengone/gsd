import { randomUUID } from "node:crypto";
import { z } from "zod";
import { lifeDb } from "@/lib/life/db";
import type { LifeEntry } from "@/lib/life/schema";
import { tagColors } from "./tag-colors";
import type { TagColor } from "./tag-colors";

export const statuses = ["ideas", "planned", "in_progress", "done"] as const;
export type ActionStatus = typeof statuses[number];
const date = z.iso.date();
const tagName = z.string().trim().min(1).max(32);
export const actionInput = z.object({
  title: z.string().trim().min(2).max(180),
  detail: z.string().trim().max(2000).default(""),
  status: z.enum(statuses).default("ideas"),
  dueDate: date.nullable().default(null),
  tags: z.array(tagName).max(8).default([]),
  sourceEntryId: z.string().uuid().nullable().default(null),
});
export const actionPatch = actionInput.pick({ title: true, detail: true, status: true, dueDate: true, tags: true }).partial().refine((value) => Object.keys(value).length > 0);
export type ActionItem = z.infer<typeof actionInput> & { _id: string; createdAt: string; updatedAt: string; completedAt: string | null };
export type ActionTag = { name: string; color: TagColor; usageCount: number };
type TagDocument = { _id: string; name: string; color: TagColor };
type LegacyActionTags = { tags: string[]; tagColors?: Record<string, TagColor> };
const tagKey = (name: string) => name.toLocaleLowerCase("en");
async function tagVariants(name: string) {
  return (await (await collection()).distinct("tags")).filter((candidate) => tagKey(candidate) === tagKey(name));
}

async function tagCollection() {
  return (await lifeDb()).collection<TagDocument>("action_tags");
}

export async function listActionTags(): Promise<ActionTag[]> {
  const db = await lifeDb();
  const [saved, used] = await Promise.all([
    (await tagCollection()).find().toArray(),
    db.collection<LegacyActionTags>("action_items").find({}, { projection: { tags: 1, tagColors: 1 } }).toArray(),
  ]);
  const byKey = new Map<string, ActionTag>();
  for (const item of used) for (const name of item.tags ?? []) {
    const key = tagKey(name);
    const found = byKey.get(key);
    if (found) found.usageCount++;
    else byKey.set(key, { name, color: item.tagColors?.[name] ?? "teal", usageCount: 1 });
  }
  for (const tag of saved) byKey.set(tag._id, { name: tag.name, color: tag.color, usageCount: byKey.get(tag._id)?.usageCount ?? 0 });
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function createSharedTag(rawName: string, rawColor: string) {
  const name = tagName.parse(rawName);
  const color = z.enum(tagColors).parse(rawColor);
  if ((await listActionTags()).some((tag) => tagKey(tag.name) === tagKey(name))) throw new Error("Tag already exists");
  await (await tagCollection()).insertOne({ _id: tagKey(name), name, color });
}

export async function updateSharedTag(previousName: string, rawName: string, rawColor: string) {
  const name = tagName.parse(rawName);
  const color = z.enum(tagColors).parse(rawColor);
  const existing = (await listActionTags()).find((tag) => tagKey(tag.name) === tagKey(previousName));
  if (!existing) throw new Error("Tag not found");
  if (tagKey(existing.name) !== tagKey(name) && (await listActionTags()).some((tag) => tagKey(tag.name) === tagKey(name))) throw new Error("Tag already exists");
  const oldKey = tagKey(existing.name);
  const newKey = tagKey(name);
  const tags = await tagCollection();
  if (newKey !== oldKey) await tags.insertOne({ _id: newKey, name, color });
  else await tags.updateOne({ _id: oldKey }, { $set: { name, color } }, { upsert: true });
  const variants = await tagVariants(existing.name);
  if (variants.some((variant) => variant !== name)) {
    await (await collection()).updateMany({ tags: { $in: variants } }, [
      { $set: { tags: { $map: { input: "$tags", as: "tag", in: { $cond: [{ $in: ["$$tag", variants] }, name, "$$tag"] } } }, updatedAt: new Date().toISOString() } },
    ]);
  }
  if (newKey !== oldKey) await tags.deleteOne({ _id: oldKey });
}

export async function removeSharedTag(rawName: string) {
  const existing = (await listActionTags()).find((tag) => tagKey(tag.name) === tagKey(rawName));
  if (!existing) throw new Error("Tag not found");
  const variants = await tagVariants(existing.name);
  await (await collection()).updateMany({ tags: { $in: variants } }, { $pull: { tags: { $in: variants } }, $set: { updatedAt: new Date().toISOString() } });
  await (await tagCollection()).deleteOne({ _id: tagKey(existing.name) });
}

export async function assignActionTags(id: string, requested: string[]) {
  const names = z.array(tagName).max(8).parse(requested);
  const available = await listActionTags();
  const resolved = names.map((name) => available.find((tag) => tagKey(tag.name) === tagKey(name))?.name);
  if (resolved.some((name) => !name) || new Set(resolved).size !== resolved.length) throw new Error("Choose unique existing tags");
  return updateAction(id, { tags: resolved as string[] });
}

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
  return (await collection()).find(query, { projection: { tagColors: 0 } }).sort({ dueDate: 1, createdAt: -1 }).limit(Math.min(Math.max(options.limit ?? 200, 1), 500)).toArray();
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
  return items.findOneAndUpdate({ _id: id }, { $set: { ...value, completedAt, updatedAt: now } }, { returnDocument: "after", projection: { tagColors: 0 } });
}

export async function deleteAction(id: string) {
  z.string().uuid().parse(id);
  return (await collection()).deleteOne({ _id: id });
}
