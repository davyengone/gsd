import { z } from "zod";

function maxExpenseAmount(): number {
  const raw = process.env.GSD_MAX_EXPENSE_AMOUNT;
  const parsed = raw ? Number(raw) : 10_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
}

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO-4217 code")
  .default("EUR");

export const expenseInputSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .refine((value) => value <= maxExpenseAmount(), {
      message: `Amount exceeds the configured maximum of ${maxExpenseAmount()}`,
    }),
  currency: currencySchema,
  description: z.string().trim().min(1).max(500),
  category: z.string().trim().min(1).max(100).optional(),
  merchant: z.string().trim().min(1).max(200).optional(),
  occurredAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "occurredAt must be YYYY-MM-DD")
    .optional(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const expenseRecordSchema = expenseInputSchema.extend({
  id: z.string(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.literal("getshitdone"),
  stubbed: z.boolean().optional(),
});

export type ExpenseRecord = z.infer<typeof expenseRecordSchema>;

export const listExpensesInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
});

export type ListExpensesInput = z.infer<typeof listExpensesInputSchema>;
