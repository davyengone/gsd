import { NextResponse } from "next/server";
import { getSessionValue, SESSION_COOKIE, validLoginToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = form.get("token");
  const next = form.get("next") === "/actions" ? "/actions" : "/my-life";
  if (typeof token !== "string" || !validLoginToken(token)) {
    return NextResponse.redirect(new URL(`${next}?error=1`, request.url), 303);
  }
  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(SESSION_COOKIE, getSessionValue()!, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
