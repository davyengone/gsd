import { sendInterestEmails } from "@/lib/interest-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return Response.json({ error: "Expected JSON" }, { status: 415 });
  }

  if (Number(request.headers.get("content-length")) > 4096) {
    return Response.json({ error: "Request too large" }, { status: 413 });
  }

  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 4096) return Response.json({ error: "Request too large" }, { status: 413 });
    input = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, website } = input as { email?: unknown; website?: unknown };
  if (typeof website === "string" && website.trim()) return Response.json({ ok: true });
  if (typeof email !== "string") return Response.json({ error: "Enter a valid email" }, { status: 400 });

  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return Response.json({ error: "Enter a valid email" }, { status: 400 });
  }

  try {
    await sendInterestEmails(normalized);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("GSD interest email failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Unable to send confirmation" }, { status: 503 });
  }
}
