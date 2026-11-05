import { z } from "zod";

export const categoryIdSchema = z.string().regex(/^[a-z][a-z0-9-]{1,63}$/);

export type LifeCategory = {
  _id: string;
  name: string;
  nameKey: string;
  description: string;
  order: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export const captureInputSchema = z.object({
  text: z.string().trim().min(3).max(10000),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const factSchema = z.object({
  area: categoryIdSchema,
  kind: z.string().trim().min(1).max(50),
  title: z.string().trim().min(1).max(180),
  detail: z.string().trim().max(1000),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceQuote: z.string().trim().min(1).max(500),
  amount: z.number().positive().max(1000000).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  count: z.number().int().positive().max(1000).nullable(),
});

export type Fact = z.infer<typeof factSchema>;
export type CaptureInput = z.infer<typeof captureInputSchema>;

export type LifeEntry = {
  _id: string;
  text: string;
  occurredAt: string;
  createdAt: string;
  sourceKey: string;
  extractionStatus: "pending" | "complete" | "failed";
};
export type LifeFact = Fact & {
  _id: string;
  entryId: string;
  createdAt: string;
};
