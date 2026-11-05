import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { logExpense, listExpenses, getFinanceMode } from "@/lib/finance/client";
import {
  expenseInputSchema,
  expenseRecordSchema,
  listExpensesInputSchema,
} from "@/lib/finance/schema";
import { assertWithinRateLimit } from "@/lib/auth/rate-limit";
import { logMcp } from "@/lib/mcp/logger";
import type { Skill } from "../types";

const listExpensesOutputSchema = z.object({
  expenses: z.array(expenseRecordSchema),
  mode: z.enum(["stub", "http"]),
});

export const logExpenseSkill: Skill = {
  name: "log-expense",
  description:
    "Log personal expenses from natural language into the finance app, with amount sanity checks and confirmation.",
  register(server: McpServer) {
    server.registerTool(
      "log_expense",
      {
        title: "Log expense",
        description:
          "Create an expense in the user's finance app. Use after confirming amount, currency, description, and date when the user's request is ambiguous or implausible.",
        inputSchema: expenseInputSchema,
        outputSchema: expenseRecordSchema,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true,
        },
      },
      async (args) => {
        assertWithinRateLimit("log_expense");
        logMcp("info", "tool.log_expense.start", {
          amount: args.amount,
          currency: args.currency,
          description: args.description,
          category: args.category,
          merchant: args.merchant,
          occurredAt: args.occurredAt,
          mode: getFinanceMode(),
        });

        try {
          const record = await logExpense(args);
          logMcp("info", "tool.log_expense.success", {
            id: record.id,
            amount: record.amount,
            currency: record.currency,
            description: record.description,
            occurredAt: record.occurredAt,
            stubbed: record.stubbed === true,
            mode: getFinanceMode(),
          });
          return {
            structuredContent: record,
            content: [
              {
                type: "text" as const,
                text: record.stubbed
                  ? `Stubbed expense ${record.id}: ${record.amount} ${record.currency} for "${record.description}" on ${record.occurredAt} (FINANCE_MODE=stub).`
                  : `Logged expense ${record.id}: ${record.amount} ${record.currency} for "${record.description}" on ${record.occurredAt}.`,
              },
            ],
          };
        } catch (error) {
          logMcp("error", "tool.log_expense.failure", {
            error:
              error instanceof Error
                ? { name: error.name, message: error.message }
                : String(error),
          });
          throw error;
        }
      },
    );

    server.registerTool(
      "list_expenses",
      {
        title: "List expenses",
        description:
          "List recently logged expenses so the user can verify what was written.",
        inputSchema: listExpensesInputSchema,
        outputSchema: listExpensesOutputSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: true,
        },
      },
      async (args) => {
        logMcp("info", "tool.list_expenses.start", {
          limit: args.limit,
          mode: getFinanceMode(),
        });

        try {
          const expenses = await listExpenses(args);
          const payload = { expenses, mode: getFinanceMode() };
          logMcp("info", "tool.list_expenses.success", {
            count: expenses.length,
            mode: payload.mode,
            ids: expenses.map((expense) => expense.id),
          });
          return {
            structuredContent: payload,
            content: [
              {
                type: "text" as const,
                text:
                  expenses.length === 0
                    ? "No expenses found."
                    : `Found ${expenses.length} expense(s).`,
              },
            ],
          };
        } catch (error) {
          logMcp("error", "tool.list_expenses.failure", {
            error:
              error instanceof Error
                ? { name: error.name, message: error.message }
                : String(error),
          });
          throw error;
        }
      },
    );
  },
};
