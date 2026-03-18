import { openDB, type IDBPDatabase } from "idb";
import type { Transaction } from "./types";

const DB_NAME = "finance-explorer";
const DB_VERSION = 1;

interface CacheDB {
  cache: {
    key: string;
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<CacheDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache");
        }
      },
    });
  }
  return dbPromise;
}

export async function getCachedRecentTransactions(): Promise<
  Transaction[] | null
> {
  try {
    const db = await getDB();
    const data = await db.get("cache", "recent_transactions");
    if (data) {
      return (data as Transaction[]).map((t) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      }));
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCachedRecentTransactions(
  transactions: Transaction[],
): Promise<void> {
  try {
    const db = await getDB();
    await db.put("cache", transactions, "recent_transactions");
    await db.put("cache", Date.now(), "last_sync_timestamp");
  } catch (error) {
    console.error("Failed to cache recent transactions:", error);
  }
}

export async function getCachedFullTransactions(): Promise<
  Transaction[] | null
> {
  try {
    const db = await getDB();
    const data = await db.get("cache", "full_transactions");
    if (data) {
      return (data as Transaction[]).map((t) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      }));
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCachedFullTransactions(
  transactions: Transaction[],
): Promise<void> {
  try {
    const db = await getDB();
    await db.put("cache", transactions, "full_transactions");
    await db.put("cache", Date.now(), "last_sync_timestamp");
  } catch (error) {
    console.error("Failed to cache full transactions:", error);
  }
}

export async function clearRecentTransactionsCache(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("cache", "recent_transactions");
  } catch (error) {
    console.error("Failed to clear recent transactions cache:", error);
  }
}

export async function clearFullTransactionsCache(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("cache", "full_transactions");
  } catch (error) {
    console.error("Failed to clear full transactions cache:", error);
  }
}

export async function getLastSyncTimestamp(): Promise<number | null> {
  try {
    const db = await getDB();
    const timestamp = await db.get("cache", "last_sync_timestamp");
    return timestamp as number | null;
  } catch {
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear("cache");
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
}
