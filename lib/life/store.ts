import { createHash, randomUUID } from "node:crypto";
import { ensureLifeIndexes, lifeDb } from "./db";
import { extractFacts } from "./extract";
import { logMcp } from "@/lib/mcp/logger";
import type { Area, CaptureInput, LifeEntry, LifeFact } from "./schema";

function todayBrussels() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

export async function captureLife(input: CaptureInput) {
  const db = await lifeDb();
  await ensureLifeIndexes(db);
  const entries = db.collection<LifeEntry>("life_entries");
  const occurredAt = input.occurredAt ?? todayBrussels();
  const sourceKey = createHash("sha256").update(input.idempotencyKey ?? `${occurredAt}\n${input.text}`).digest("hex");
  let entry: LifeEntry = {
    _id: randomUUID(), text: input.text, occurredAt,
    createdAt: new Date().toISOString(), sourceKey, extractionStatus: "pending",
  };
  let duplicate = false;
  try {
    await entries.insertOne(entry);
  } catch (error) {
    const existing = await entries.findOne({ sourceKey });
    if (!existing) throw error;
    entry = existing;
    duplicate = true;
  }
  const factsCollection = db.collection<LifeFact>("life_facts");
  if (entry.extractionStatus === "complete" || (duplicate && entry.extractionStatus === "pending")) {
    const facts = await factsCollection.find({ entryId: entry._id }).toArray();
    return { entry, facts, duplicate };
  }

  if (duplicate && entry.extractionStatus === "failed") {
    const claim = await entries.updateOne({ _id: entry._id, extractionStatus: "failed" }, { $set: { extractionStatus: "pending" } });
    if (!claim.modifiedCount) return { entry: { ...entry, extractionStatus: "pending" as const }, facts: [], duplicate };
  }

  try {
    const extracted = await extractFacts(entry.text, entry.occurredAt);
    const facts: LifeFact[] = extracted.map((fact) => ({
      ...fact, _id: randomUUID(), entryId: entry._id, createdAt: entry.createdAt,
    }));
    await factsCollection.deleteMany({ entryId: entry._id });
    if (facts.length) await factsCollection.insertMany(facts);
    await entries.updateOne({ _id: entry._id }, { $set: { extractionStatus: "complete" } });
    return { entry: { ...entry, extractionStatus: "complete" as const }, facts, duplicate };
  } catch (error) {
    const details = error && typeof error === "object" ? error as { statusCode?: number; status?: number; code?: string } : {};
    logMcp("error", "life.extraction_failed", { entryId: entry._id, errorType: error instanceof Error ? error.name : "unknown", errorCode: details.code, statusCode: details.statusCode ?? details.status, provider: "anthropic" });
    await entries.updateOne({ _id: entry._id }, { $set: { extractionStatus: "failed" } });
    return { entry: { ...entry, extractionStatus: "failed" as const }, facts: [], duplicate };
  }
}

export async function listLife(options: { area?: Area; date?: string; limit?: number } = {}) {
  const db = await lifeDb();
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const facts = await db.collection<LifeFact>("life_facts")
    .find({ ...(options.area ? { area: options.area } : {}), ...(options.date ? { occurredAt: options.date } : {}) })
    .sort({ occurredAt: -1, createdAt: -1 }).limit(limit).toArray();
  const entries = options.area && options.area !== "journal" ? [] : await db.collection<LifeEntry>("life_entries")
    .find(options.date ? { occurredAt: options.date } : {})
    .sort({ occurredAt: -1, createdAt: -1 }).limit(limit).toArray();
  return { entries, facts };
}

export async function getDaySummary(date: string) {
  const db = await lifeDb();
  const [entries, facts] = await Promise.all([
    db.collection<LifeEntry>("life_entries").find({ occurredAt: date }).sort({ createdAt: -1 }).toArray(),
    db.collection<LifeFact>("life_facts").find({ occurredAt: date }).sort({ createdAt: -1 }).toArray(),
  ]);
  const expenses = facts.filter((fact) => fact.area === "finance" && fact.kind === "expense" && fact.amount !== null);
  const totals: Record<string, number> = {};
  for (const expense of expenses) {
    const currency = expense.currency ?? "UNSPECIFIED";
    totals[currency] = Math.round(((totals[currency] ?? 0) + (expense.amount ?? 0)) * 100) / 100;
  }
  return { date, totals, expenses, facts, entries, expenseCount: expenses.length };
}

export async function getLifeStats() {
  const db = await lifeDb();
  const facts = db.collection<LifeFact>("life_facts");
  const counts = await Promise.all([
    db.collection<LifeEntry>("life_entries").countDocuments(),
    ...(["finance", "work", "health", "groceries", "kids"] as const).map((area) => facts.countDocuments({ area })),
    facts.countDocuments(),
    facts.countDocuments({ area: "finance", kind: "expense", currency: "EUR" }),
  ]);
  const total = await facts.aggregate<{ _id: null; amount: number }>([
    { $match: { area: "finance", kind: "expense", currency: "EUR" } },
    { $group: { _id: null, amount: { $sum: "$amount" } } },
  ]).next();
  return {
    counts: { journal: counts[0], finance: counts[1], work: counts[2], health: counts[3], groceries: counts[4], kids: counts[5] },
    factCount: counts[6], eurExpenseCount: counts[7], eurTotal: total?.amount ?? 0,
  };
}
