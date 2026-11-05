import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/my-life", request.url), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
