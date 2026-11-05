import { MongoClient, type Db } from "mongodb";

const globalMongo = globalThis as typeof globalThis & {
  gsdMongo?: Promise<MongoClient>;
  gsdIndexes?: Promise<void>;
};

export async function lifeDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!globalMongo.gsdMongo) {
    globalMongo.gsdMongo = new MongoClient(uri, { maxPoolSize: 5 })
      .connect()
      .catch((error) => {
        globalMongo.gsdMongo = undefined;
        throw error;
      });
  }
  return (await globalMongo.gsdMongo).db(process.env.MONGODB_DB ?? "gsd");
}

export async function ensureLifeIndexes(db: Db) {
  if (!globalMongo.gsdIndexes) {
    globalMongo.gsdIndexes = Promise.all([
      db.collection("life_entries").createIndex({ sourceKey: 1 }, { unique: true }),
      db.collection("life_entries").createIndex({ occurredAt: -1, createdAt: -1 }),
      db.collection("life_facts").createIndex({ occurredAt: -1, area: 1 }),
      db.collection("life_facts").createIndex({ entryId: 1 }),
    ]).then(() => {}).catch((error) => {
      globalMongo.gsdIndexes = undefined;
      throw error;
    });
  }
  await globalMongo.gsdIndexes;
}
