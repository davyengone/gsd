import { randomUUID } from "node:crypto";
import type {
  ExpenseInput,
  ExpenseRecord,
  ListExpensesInput,
} from "./schema";

export type FinanceMode = "stub" | "http";

function getMode(): FinanceMode {
  const mode = process.env.FINANCE_MODE?.toLowerCase();
  return mode === "http" ? "http" : "stub";
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toRecord(input: ExpenseInput, id?: string): ExpenseRecord {
  return {
    id: id ?? randomUUID(),
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    category: input.category,
    merchant: input.merchant,
    occurredAt: input.occurredAt ?? todayIsoDate(),
    source: "getshitdone",
  };
}

/** In-memory store for stub mode so list_expenses can verify writes in-session. */
const stubStore: ExpenseRecord[] = [];

async function httpRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = process.env.FINANCE_API_URL;
  const apiKey = process.env.FINANCE_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "FINANCE_MODE=http requires FINANCE_API_URL and FINANCE_API_KEY",
    );
  }

  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Finance API ${response.status}: ${body.slice(0, 200) || response.statusText}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function logExpense(input: ExpenseInput): Promise<ExpenseRecord> {
  if (getMode() === "stub") {
    const record: ExpenseRecord = { ...toRecord(input), stubbed: true };
    stubStore.unshift(record);
    return record;
  }

  const created = await httpRequest<Partial<ExpenseRecord> & { id?: string }>(
    "expenses",
    {
      method: "POST",
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        category: input.category,
        merchant: input.merchant,
        occurredAt: input.occurredAt ?? todayIsoDate(),
        source: "getshitdone",
      }),
    },
  );

  return toRecord(input, created.id);
}

export async function listExpenses(
  input: ListExpensesInput,
): Promise<ExpenseRecord[]> {
  const limit = input.limit ?? 10;

  if (getMode() === "stub") {
    return stubStore.slice(0, limit);
  }

  const result = await httpRequest<ExpenseRecord[] | { expenses: ExpenseRecord[] }>(
    `expenses?limit=${limit}`,
    { method: "GET" },
  );

  return Array.isArray(result) ? result.slice(0, limit) : result.expenses.slice(0, limit);
}

export function getFinanceMode(): FinanceMode {
  return getMode();
}
