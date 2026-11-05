import { timingSafeEqual } from "node:crypto";

const MIN_TOKEN_LENGTH = 32;

/**
 * Timing-safe compare of the path token against GSD_MCP_TOKEN.
 * Fails closed when the env var is unset or shorter than 32 chars.
 * Never log or echo the token.
 *
 * Upgrade path: replace this with `withMcpAuth` from mcp-handler (OAuth 2.1).
 */
export function isValidMcpToken(candidate: string | undefined): boolean {
  const expected = process.env.GSD_MCP_TOKEN;

  if (!expected || expected.length < MIN_TOKEN_LENGTH) {
    return false;
  }

  if (!candidate || candidate.length !== expected.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(candidate, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}

export function assertMcpTokenConfigured(): void {
  const expected = process.env.GSD_MCP_TOKEN;
  if (!expected || expected.length < MIN_TOKEN_LENGTH) {
    throw new Error(
      `GSD_MCP_TOKEN must be set and at least ${MIN_TOKEN_LENGTH} characters`,
    );
  }
}
