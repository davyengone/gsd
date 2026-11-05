import type { NextRequest } from "next/server";
import { isValidMcpToken } from "@/lib/auth/token";
import { logMcp } from "@/lib/mcp/logger";
import { mcpHandler } from "@/lib/mcp/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ token: string }>;
};

const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "content-type, accept, mcp-session-id, mcp-protocol-version, authorization",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function unauthorized(): Response {
  return withCors(new Response("Not Found", { status: 404 }));
}

function requestMeta(request: NextRequest) {
  return {
    httpMethod: request.method,
    path: "/api/mcp/[token]",
    userAgent: request.headers.get("user-agent") ?? undefined,
    protocolVersion: request.headers.get("mcp-protocol-version") ?? undefined,
    sessionId: request.headers.get("mcp-session-id") ? "[present]" : undefined,
  };
}

async function handle(request: NextRequest, context: RouteContext) {
  const started = Date.now();
  const { token } = await context.params;
  const meta = requestMeta(request);

  if (!isValidMcpToken(token)) {
    logMcp("warn", "mcp.auth_rejected", meta);
    return unauthorized();
  }

  logMcp("info", "mcp.http_in", meta);

  try {
    const response = withCors(await mcpHandler(request));
    logMcp("info", "mcp.http_out", {
      ...meta,
      status: response.status,
      durationMs: Date.now() - started,
    });
    return response;
  } catch (error) {
    logMcp("error", "mcp.http_error", {
      ...meta,
      durationMs: Date.now() - started,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : String(error),
    });
    throw error;
  }
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}
