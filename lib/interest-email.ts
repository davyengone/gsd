import { createHash } from "node:crypto";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const BOOTCAMP_URL = "https://hackages.com/6-days-6-projects";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function sendEmail(apiKey: string, key: string, message: Record<string, unknown>, request: typeof fetch) {
  const response = await request(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(message),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend rejected an interest email (${response.status}).`);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error("Resend did not confirm an interest email.");
  return result.id;
}

export async function sendInterestEmails(email: string, request: typeof fetch = fetch, env = process.env, now = new Date()) {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.RESEND_FROM_EMAIL?.trim();
  const notify = env.INTEREST_NOTIFY_EMAIL?.trim();
  if (!apiKey || !from || !notify) throw new Error("Interest email is not configured.");

  const key = createHash("sha256").update(email).digest("hex").slice(0, 32);
  const day = now.toISOString().slice(0, 10);
  const confirmation = await sendEmail(apiKey, `gsd-interest-confirm/v2/${day}/${key}`, {
    from,
    to: [email],
    subject: "Thanks for your interest in GSD",
    html: `<p>Thanks for your interest in GSD.</p><p>We’ll reach out within the next 24 hours.</p><p>While you wait, learn how to build with AI in Hackages’ six-day intensive bootcamp, <a href="${BOOTCAMP_URL}">Six Days, Six Projects</a>.</p><p>— GSD</p>`,
    text: `Thanks for your interest in GSD.\n\nWe’ll reach out within the next 24 hours.\n\nWhile you wait, learn how to build with AI in Hackages’ six-day intensive bootcamp, Six Days, Six Projects: ${BOOTCAMP_URL}\n\n— GSD`,
  }, request);

  const owner = await sendEmail(apiKey, `gsd-interest-owner/${day}/${key}`, {
    from,
    to: [notify],
    subject: "Someone is interested in GSD",
    html: `<p>Someone is interested in GSD.</p><p>Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`,
    text: `Someone is interested in GSD.\n\nEmail: ${email}`,
  }, request);

  return { confirmation, owner };
}
