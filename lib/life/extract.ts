import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { extractionSchema, type Fact } from "./schema";

export async function extractFacts(text: string, occurredAt: string): Promise<Fact[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
  const { output } = await generateText({
    model: anthropic(process.env.GSD_EXTRACTION_MODEL ?? "claude-sonnet-4-6"),
    output: Output.object({ schema: extractionSchema }),
    system: `Extract concrete, explicitly stated facts from one person's life note. Return zero or more facts for finance, work, health, groceries, and kids. The original note is stored separately as the journal, so do not create a journal fact merely to restate it. Use journal only for a specific reflection, mood, or insight worth surfacing.

Rules:
- Never invent amounts, merchants, meetings, dates, children, exercise metrics, or purchases.
- An expense requires an explicit amount and spending context. Do not turn revenue or quoted prices into expenses.
- For expenses, use area finance and kind expense, amount as a positive number and currency as ISO 4217. If the user says euro/€ use EUR. If currency is absent, set currency null; do not assume EUR.
- Keep each separate expense as its own fact. Round trip flight ticket is one expense if given as one price.
- One statement can create facts in multiple areas. For example, an explicit grocery purchase can create a finance expense and a groceries record.
- A meeting or client onboarding belongs to work; a workout belongs to health; grocery purchases/lists to groceries; child-related activities to kids.
- sourceQuote must be an exact, short substring of the user's note supporting that fact.
- occurredAt must be YYYY-MM-DD. Use the supplied note date ${occurredAt} unless the text explicitly gives another date. Today in Europe/Brussels is ${new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())}.
- Use count only when a number of meetings, repetitions, or items is explicitly given; otherwise null.
- For missing optional information, use null or an empty detail.`,
    prompt: text,
  });

  return output.facts.filter((fact) => text.includes(fact.sourceQuote));
}
