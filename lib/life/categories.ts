import { createHash } from "node:crypto";
import { lifeDb } from "./db";
import type { LifeCategory } from "./schema";

const defaults = [
  { _id: "finance", name: "Finance", description: "Payments, expenses, income, and other money facts. Every explicit expense belongs here, even when it also belongs to another category." },
  { _id: "journal", name: "Journal", description: "The original notes and personal reflections about a day. Original notes are saved here automatically." },
  { _id: "work", name: "Work", description: "Meetings, clients, projects, decisions, and work progress." },
  { _id: "health", name: "Health", description: "Exercise, sleep, recovery, symptoms, and wellbeing." },
  { _id: "groceries", name: "Groceries", description: "Groceries bought, needed, or planned, including shopping lists." },
  { _id: "kids", name: "Kids", description: "Family moments, activities, and responsibilities related to children." },
] as const;

const globalCategories = globalThis as typeof globalThis & {
  gsdCategorySeeds?: Map<string, Promise<void>>;
};

function nameKey(name: string) {
  return name.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function slugFor(name: string) {
  const normalized = name.normalize("NFKD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48).replace(/-$/g, "");
  return /^[a-z]/.test(normalized) ? normalized : `category-${normalized || createHash("sha256").update(name).digest("hex").slice(0, 10)}`;
}

async function ensureCategories() {
  const db = await lifeDb();
  const seeds = globalCategories.gsdCategorySeeds ??= new Map();
  if (!seeds.has(db.databaseName)) {
    const promise = (async () => {
      const collection = db.collection<LifeCategory>("life_categories");
      await collection.createIndex({ nameKey: 1 }, { unique: true });
      const now = new Date().toISOString();
      await Promise.all(defaults.map(({ _id, ...category }, index) => collection.updateOne(
        { _id },
        { $setOnInsert: { ...category, nameKey: nameKey(category.name), order: (index + 1) * 10, isDefault: true, createdAt: now, updatedAt: now } },
        { upsert: true },
      )));
    })().catch((error) => { seeds.delete(db.databaseName); throw error; });
    seeds.set(db.databaseName, promise);
  }
  await seeds.get(db.databaseName);
  return db.collection<LifeCategory>("life_categories");
}

export async function listCategories() {
  const collection = await ensureCategories();
  return collection.find().sort({ order: 1, createdAt: 1, name: 1 }).toArray();
}

export async function createCategory(name: string, description?: string) {
  const collection = await ensureCategories();
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const key = nameKey(normalizedName);
  const existingByName = await collection.findOne({ nameKey: key });
  if (existingByName) return { category: existingByName, created: false };

  let id = slugFor(normalizedName);
  const existingById = await collection.findOne({ _id: id });
  if (existingById) id = `${id.slice(0, 48)}-${createHash("sha256").update(key).digest("hex").slice(0, 8)}`;
  const now = new Date().toISOString();
  const category: LifeCategory = {
    _id: id, name: normalizedName, nameKey: key,
    description: description?.trim() || `Life notes, activities, and details related to ${normalizedName}.`,
    order: 100, isDefault: false, createdAt: now, updatedAt: now,
  };
  try {
    await collection.insertOne(category);
    return { category, created: true };
  } catch (error) {
    const duplicate = await collection.findOne({ nameKey: key });
    if (duplicate) return { category: duplicate, created: false };
    throw error;
  }
}

export async function updateCategory(id: string, updates: { name?: string; description?: string }) {
  const collection = await ensureCategories();
  const category = await collection.findOne({ _id: id });
  if (!category) return null;
  const name = updates.name?.trim().replace(/\s+/g, " ");
  const description = updates.description?.trim();
  if (name && nameKey(name) !== category.nameKey) {
    const duplicate = await collection.findOne({ nameKey: nameKey(name) });
    if (duplicate) throw new Error(`Category name ${name} is already used by ${duplicate._id}`);
  }
  const changes = {
    ...(name ? { name, nameKey: nameKey(name) } : {}),
    ...(description ? { description } : {}),
    updatedAt: new Date().toISOString(),
  };
  await collection.updateOne({ _id: id }, { $set: changes });
  return collection.findOne({ _id: id });
}
