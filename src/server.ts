import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  response: Response,
  request: Request,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  // Vite/HMR and browser refresh often abort mid-SSR. h3 still returns a generic
  // HTTPError JSON body with no useful stack — do not treat that as an app crash.
  if (request.signal.aborted) {
    return new Response(null, { status: 499 });
  }

  const captured = consumeLastCapturedError();
  if (captured && isClientAbortError(captured)) {
    return new Response(null, { status: 499 });
  }

  // Generic HTTPError with nothing captured = almost always a cancelled request.
  if (!captured) {
    return new Response(null, { status: 499 });
  }

  console.error(captured);
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function isClientAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLocaleLowerCase();
  return (
    error.name === "AbortError" ||
    message === "aborted" ||
    message === "request aborted" ||
    message.includes("aborted")
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response, request);
    } catch (error) {
      // Client closed the tab / refreshed during SSR — not a real app crash.
      if (isClientAbortError(error) || request.signal.aborted) {
        return new Response(null, { status: 499 });
      }
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
