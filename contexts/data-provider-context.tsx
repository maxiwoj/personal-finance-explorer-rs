"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  clearCache,
  clearFullTransactionsCache,
  clearRecentTransactionsCache,
  getCachedFullTransactions,
  getCachedRecentTransactions,
  setCachedFullTransactions,
  setCachedRecentTransactions,
} from "@/lib/cache";
import { getOrCreateDemoTransactions } from "@/lib/demo-data";
import { fetchFullTransactions, fetchRecentTransactions } from "@/lib/sheets";
import type { FinanceDataScope } from "@/hooks/use-transactions";
import type { Transaction } from "@/lib/types";

export type DataMode = "google" | "demo";

export interface FinanceDataProvider {
  mode: DataMode;
  getRecentTransactions: () => Promise<Transaction[]>;
  getFullTransactions: () => Promise<Transaction[]>;
  reloadData: (scope?: FinanceDataScope) => Promise<void>;
}

const DataProviderContext = createContext<FinanceDataProvider | null>(null);

function buildGoogleProvider(accessToken: string | null): FinanceDataProvider {
  return {
    mode: "google",
    async getRecentTransactions() {
      const cached = await getCachedRecentTransactions();

      if (!accessToken) {
        if (cached) return cached;
        throw new Error("Not authenticated");
      }

      const fresh = await fetchRecentTransactions(accessToken);
      await setCachedRecentTransactions(fresh);
      return fresh;
    },
    async getFullTransactions() {
      const cached = await getCachedFullTransactions();

      if (!accessToken) {
        if (cached) return cached;
        throw new Error("Not authenticated");
      }

      const fresh = await fetchFullTransactions(accessToken);
      await setCachedFullTransactions(fresh);
      return fresh;
    },
    async reloadData(scope = "all") {
      if (scope === "recent") {
        await clearRecentTransactionsCache();
        return;
      }

      if (scope === "full") {
        await clearFullTransactionsCache();
        return;
      }

      await clearCache();
    },
  };
}

function buildDemoProvider(): FinanceDataProvider {
  const loadTransactions = async () => getOrCreateDemoTransactions();

  return {
    mode: "demo",
    async getRecentTransactions() {
      const allTransactions = await loadTransactions();
      return allTransactions.slice(0, 90);
    },
    async getFullTransactions() {
      return loadTransactions();
    },
    async reloadData() {
      await getOrCreateDemoTransactions(true);
    },
  };
}

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const { mode, accessToken } = useAuth();

  const provider = useMemo(() => {
    if (mode === "demo") {
      return buildDemoProvider();
    }

    return buildGoogleProvider(accessToken);
  }, [accessToken, mode]);

  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  );
}

export function useFinanceDataProvider() {
  const context = useContext(DataProviderContext);

  if (!context) {
    throw new Error(
      "useFinanceDataProvider must be used within a FinanceDataProvider",
    );
  }

  return context;
}
