export type Result<T> = { ok: true; data: T; status: number } | { ok: false; error: string; status: number; data?: Record<string, unknown> };

const STATUS_MESSAGES: Record<number, string> = {
  408: "The request timed out. Please try again.",
  413: "The file is too large.",
  429: "Too many requests. Please wait a moment and try again.",
  502: "The service returned an invalid response. Please try again.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The request timed out. Please try again.",
};

/** fetch + JSON with a timeout; never throws, always resolves to a typed result. */
export async function requestJSON<T>(url: string, init: RequestInit & { timeoutMs?: number; json?: unknown } = {}): Promise<Result<T>> {
  const { timeoutMs = 60_000, json, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (rest.signal) rest.signal.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      ...(json !== undefined
        ? { body: JSON.stringify(json), headers: { "Content-Type": "application/json", ...(rest.headers ?? {}) } }
        : {}),
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON body (proxy error page, empty response) */
    }
    if (!res.ok) {
      const data = body && typeof body === "object" ? (body as Record<string, unknown>) : undefined;
      const error = typeof data?.error === "string" ? data.error : STATUS_MESSAGES[res.status] ?? `Request failed (${res.status})`;
      return { ok: false, error, status: res.status, data };
    }
    return { ok: true, data: body as T, status: res.status };
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === "AbortError";
    if (aborted && rest.signal?.aborted) return { ok: false, error: "Cancelled", status: 0 };
    return {
      ok: false,
      error: aborted ? STATUS_MESSAGES[408] : "Network error. Check your connection and try again.",
      status: 0,
    };
  } finally {
    clearTimeout(timer);
  }
}
