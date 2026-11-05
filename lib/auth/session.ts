import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isValidMcpToken } from "./token";

export const SESSION_COOKIE = "gsd_session";

function sessionValue() {
  const token = process.env.GSD_MCP_TOKEN;
  if (!token || token.length < 32) return null;
  return createHmac("sha256", token).update("gsd-dashboard-session-v1").digest("hex");
}

export function validLoginToken(token: string) {
  return isValidMcpToken(token);
}

export async function hasDashboardSession() {
  const expected = sessionValue();
  const actual = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!expected || !actual || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export function getSessionValue() {
  return sessionValue();
}
