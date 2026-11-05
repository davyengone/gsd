type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

const SECRET_KEYS = new Set([
  "authorization",
  "token",
  "apiKey",
  "api_key",
  "bearer",
  "password",
  "secret",
  "GSD_MCP_TOKEN",
  "FINANCE_API_KEY",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep-clone-ish redaction so secrets never hit Vercel logs. */
export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";

  if (typeof value === "string") {
    const expected = process.env.GSD_MCP_TOKEN;
    if (expected && value.includes(expected)) {
      return value.split(expected).join("[redacted-token]");
    }
    if (value.length > 2000) return `${value.slice(0, 2000)}…[truncated]`;
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item, depth + 1));
  }

  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SECRET_KEYS.has(key) || SECRET_KEYS.has(key.toLowerCase())) {
        out[key] = "[redacted]";
      } else {
        out[key] = sanitizeForLog(nested, depth + 1);
      }
    }
    return out;
  }

  return value;
}

function summarizeResult(result: unknown): unknown {
  if (!isPlainObject(result)) return sanitizeForLog(result);

  // Prefer structuredContent when present (tool results).
  if ("structuredContent" in result) {
    return {
      structuredContent: sanitizeForLog(result.structuredContent),
      isError: result.isError === true,
      contentPreview: Array.isArray(result.content)
        ? sanitizeForLog(
            result.content
              .map((part) =>
                isPlainObject(part) && typeof part.text === "string"
                  ? part.text
                  : part,
              )
              .slice(0, 3),
          )
        : undefined,
    };
  }

  return sanitizeForLog(result);
}

export function logMcp(
  level: LogLevel,
  message: string,
  payload: LogPayload = {},
): void {
  const entry = {
    ts: new Date().toISOString(),
    service: "getshitdone-mcp",
    level,
    message,
    ...(sanitizeForLog(payload) as LogPayload),
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

type McpRequestEvent = {
  type: "REQUEST_RECEIVED" | "REQUEST_COMPLETED";
  timestamp: number;
  method: string;
  parameters?: unknown;
  result?: unknown;
  duration?: number;
  status: "success" | "error";
};

type McpErrorEvent = {
  type: "ERROR";
  timestamp: number;
  error: Error | string;
  context?: string;
  source: "request" | "system";
  severity: "warning" | "error" | "fatal";
};

export type McpLogEvent = McpRequestEvent | McpErrorEvent;

export function handleMcpEvent(event: McpLogEvent): void {
  if (event.type === "ERROR") {
    logMcp(event.severity === "warning" ? "warn" : "error", "mcp.error", {
      eventType: event.type,
      source: event.source,
      severity: event.severity,
      context: event.context,
      error:
        event.error instanceof Error
          ? { name: event.error.name, message: event.error.message }
          : String(event.error),
    });
    return;
  }

  const toolName =
    event.method === "tools/call" && isPlainObject(event.parameters)
      ? event.parameters.name
      : undefined;

  if (event.type === "REQUEST_RECEIVED") {
    logMcp("info", "mcp.request", {
      eventType: event.type,
      method: event.method,
      tool: toolName,
      parameters: sanitizeForLog(event.parameters),
    });
    return;
  }

  logMcp(event.status === "error" ? "error" : "info", "mcp.response", {
    eventType: event.type,
    method: event.method,
    tool: toolName,
    status: event.status,
    durationMs: event.duration,
    result: summarizeResult(event.result),
  });
}
