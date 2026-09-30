import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { aiProviders, config, NotConfiguredError, PROVIDER_NAMES, type AIProvider } from "./config";

export interface InlineImage {
  mimeType: string;
  base64: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/** Only Cloudinary delivery hosts are fetched server-side, so stored URLs can't be used to probe other hosts. */
function assertCloudinaryUrl(url: string) {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") throw new Error();
    host = u.hostname;
  } catch {
    throw new Error("Invalid media URL");
  }
  if (host !== "res.cloudinary.com" && !host.endsWith(".cloudinary.com")) throw new Error("Media must be delivered by Cloudinary");
}

/** Fetch a Cloudinary-derived frame and return it as base64 for vision models. */
export async function loadImage(url: string): Promise<InlineImage> {
  assertCloudinaryUrl(url);
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    lastStatus = res.status;
    // Derived assets are generated on first request; Cloudinary can briefly answer 420/423/5xx.
    if (res.status === 420 || res.status === 423 || res.status >= 500) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (!res.ok) break;
    const type = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!type.startsWith("image/")) throw new Error(`Unexpected media type for analysis frame (${type})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) throw new Error("Analysis frame is too large");
    return { mimeType: type, base64: buf.toString("base64") };
  }
  throw new Error(`Could not fetch media from Cloudinary (${lastStatus})`);
}

/** Extract the JSON object from a model reply, tolerating code fences and surrounding prose. */
function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start < 0 || end < start) throw new SyntaxError("Model reply contained no JSON");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

class RetryableError extends Error {
  constructor(
    message: string,
    public retryAfterMs = 0,
  ) {
    super(message);
  }
}

/** Credentials rejected or project blocked; the provider is skipped for a while instead of retried. */
class ProviderAuthError extends Error {}

/** No model on this provider can serve the request (e.g. no vision model enabled); other requests still can. */
class ModelUnavailableError extends Error {}

/** Daily quota used up; the provider is skipped until the quota resets. */
class QuotaExhaustedError extends Error {
  constructor(
    message: string,
    public resetAt: number,
  ) {
    super(message);
  }
}

const nextUtcMidnight = () => {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
};

type CallOptions = { system: string; prompt: string; images: InlineImage[]; signal: AbortSignal };
type CallResult = { text: string; engine: string };

function chatMessages(opts: CallOptions) {
  return [
    { role: "system", content: opts.system },
    {
      role: "user",
      content: opts.images.length
        ? [
            { type: "text", text: opts.prompt },
            ...opts.images.map((i) => ({ type: "image_url", image_url: { url: `data:${i.mimeType};base64,${i.base64}` } })),
          ]
        : opts.prompt,
    },
  ];
}

// ---------- Groq (free tier) ----------

/** Vision-capable Groq models, best first. */
const GROQ_VISION_MODELS = ["qwen/qwen3.8-27b", "meta-llama/llama-4-scout-17b-16e-instruct", "qwen/qwen3.6-27b"];
/** Text-only Groq models for prompts without images. */
const GROQ_TEXT_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const MODEL_BLOCK_MS = 10 * 60_000;
/** Models get enabled in the Groq console at any time, so an empty candidate list is re-checked this often. */
const GROQ_RECHECK_MS = 60_000;
let groqActive: { ids: Set<string> | null; at: number } | null = null;
const groqBlocked = new Map<string, number>();

async function groqModelOrder(vision: boolean, recheck = true): Promise<string[]> {
  const base = vision ? GROQ_VISION_MODELS : [...GROQ_TEXT_MODELS, ...GROQ_VISION_MODELS];
  const preferred = [...new Set([config.groq.model, ...base].filter(Boolean))];
  if (!groqActive || Date.now() - groqActive.at > MODELS_TTL_MS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${config.groq.apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`models ${res.status}`);
      groqActive = { ids: new Set((((await res.json())?.data ?? []) as { id: string }[]).map((m) => m.id)), at: Date.now() };
    } catch {
      groqActive = { ids: null, at: Date.now() - MODELS_TTL_MS + 5 * 60_000 };
    }
  }
  const now = Date.now();
  const models = preferred.filter((m) => (!groqActive?.ids || groqActive.ids.has(m)) && (groqBlocked.get(m) ?? 0) < now);
  if (!models.length && recheck && groqActive && now - groqActive.at > GROQ_RECHECK_MS) {
    groqActive = null;
    for (const m of preferred) groqBlocked.delete(m);
    return groqModelOrder(vision, false);
  }
  return models;
}

/** Groq puts the wait in the message ("try again in 1h2m3.5s") rather than a header. */
function groqWaitMs(message: string) {
  const span = message.match(/try again in ((?:[\d.]+(?:ms|h|m|s))+)/)?.[1];
  if (!span) return 0;
  const unit = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 } as const;
  let total = 0;
  for (const [, n, u] of span.matchAll(/([\d.]+)(ms|h|m|s)/g)) total += Number(n) * unit[u as keyof typeof unit];
  return Math.ceil(total);
}

async function callGroq(opts: CallOptions): Promise<CallResult> {
  const vision = opts.images.length > 0;
  const models = await groqModelOrder(vision);
  let lastMessage = vision ? "No Groq vision model is enabled for this key" : "No Groq model is available";
  for (const model of models.slice(0, 2)) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: opts.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.groq.apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
        messages: chatMessages({ ...opts, system: `${opts.system}\nRespond with a single valid JSON object and nothing else.` }),
      }),
    });
    const json = await res.json().catch(() => ({}));
    const message: string = json?.error?.message ?? `Groq error ${res.status}`;
    const code: string = json?.error?.code ?? "";
    if (/model_permission_blocked|model_not_found|model_decommissioned/.test(code) || res.status === 404) {
      groqBlocked.set(model, Date.now() + MODEL_BLOCK_MS);
      console.warn(`[ai] Groq model ${model} unavailable: ${message}`);
      lastMessage = message;
      continue;
    }
    if (res.status === 401 || res.status === 403) throw new ProviderAuthError(message);
    const waitMs = groqWaitMs(message) || Number(res.headers.get("retry-after")) * 1000;
    if (res.status === 429 && /per day|\(RPD\)|\(TPD\)/i.test(message)) {
      throw new QuotaExhaustedError(message, waitMs > 0 ? Date.now() + waitMs + 5000 : nextUtcMidnight());
    }
    if (res.status === 429 || res.status >= 500) throw new RetryableError(message, waitMs > 0 ? waitMs + 500 : 0);
    if (!res.ok) throw new RetryableError(message);
    const text = String(json.choices?.[0]?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "");
    if (!text.trim()) throw new RetryableError("Groq returned no content");
    return { text, engine: `Groq · ${model}` };
  }
  throw new ModelUnavailableError(lastMessage);
}

// ---------- OpenRouter (free models) ----------

type OpenRouterModel = {
  id: string;
  context_length?: number;
  supported_parameters?: string[];
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
};

/** OpenRouter's own router across whatever free models are currently up; always the last resort. */
const FREE_ROUTER = "openrouter/free";
/** Used when the live model catalogue can't be fetched. */
const FALLBACK_FREE_MODELS = ["google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free", "qwen/qwen3.8-27b:free"];
const PREFERRED = [/gemma/i, /qwen/i, /inkling/i, /nemotron-3-super/i, /llama/i, /mistral/i];
const EXCLUDED = /safety|guard|code|coder|lyria/i;
const MODELS_TTL_MS = 60 * 60_000;
let freeModels: { vision: string[]; text: string[]; live: boolean; at: number } | null = null;

const rank = (m: OpenRouterModel) => {
  const i = PREFERRED.findIndex((re) => re.test(m.id));
  return (m.supported_parameters?.includes("response_format") ? 0 : 100) + (i < 0 ? PREFERRED.length : i);
};

/** Free chat models from OpenRouter's live catalogue, JSON-capable and best-known families first. */
async function openRouterFreeModels(): Promise<{ vision: string[]; text: string[]; live: boolean }> {
  if (freeModels && Date.now() - freeModels.at < MODELS_TTL_MS) return freeModels;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`catalogue ${res.status}`);
    const list = ((await res.json())?.data ?? []) as OpenRouterModel[];
    const free = list
      .filter((m) => m.id.endsWith(":free") && !EXCLUDED.test(m.id))
      .filter((m) => (m.architecture?.output_modalities ?? ["text"]).join() === "text")
      .sort((a, b) => rank(a) - rank(b) || (b.context_length ?? 0) - (a.context_length ?? 0));
    const vision = free.filter((m) => m.architecture?.input_modalities?.includes("image")).map((m) => m.id);
    freeModels = { vision, text: free.map((m) => m.id), live: true, at: Date.now() };
  } catch (e) {
    console.warn("[ai] OpenRouter model catalogue unavailable, using built-in list:", e instanceof Error ? e.message : e);
    freeModels = { vision: FALLBACK_FREE_MODELS, text: FALLBACK_FREE_MODELS, live: false, at: Date.now() - MODELS_TTL_MS + 5 * 60_000 };
  }
  return freeModels;
}

async function callOpenRouter(opts: CallOptions): Promise<CallResult> {
  const discovered = await openRouterFreeModels();
  const pool = opts.images.length ? discovered.vision : discovered.text;
  const available = new Set(pool);
  const preferred = config.openrouter.models.filter((m) => m !== FREE_ROUTER && (!discovered.live || available.has(m)));
  const models = [...new Set([...preferred, ...pool.slice(0, 2), FREE_ROUTER])].slice(0, 3);
  if (!models.includes(FREE_ROUTER)) models[models.length - 1] = FREE_ROUTER;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: opts.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openrouter.apiKey}`,
      "HTTP-Referer": "https://github.com/princepal-dev/impactlens",
      "X-Title": "ImpactLens",
    },
    body: JSON.stringify({
      model: models[0],
      models,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: chatMessages({ ...opts, system: `${opts.system}\nRespond with a single valid JSON object and nothing else.` }),
    }),
  });
  const json = await res.json().catch(() => ({}));
  const message: string = json?.error?.message ?? `OpenRouter error ${res.status}`;
  if (res.status === 401 || res.status === 403) throw new ProviderAuthError(message);
  if (res.status === 429 && /per-day|daily/i.test(`${message} ${json?.error?.metadata?.limit_source ?? ""}`)) {
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? json?.error?.metadata?.headers?.["X-RateLimit-Reset"]);
    throw new QuotaExhaustedError(message, reset > Date.now() ? reset : nextUtcMidnight());
  }
  if (res.status === 429 || res.status >= 500 || res.status === 408) throw new RetryableError(message);
  if (!res.ok || json?.error) throw new RetryableError(message);
  const text: string = json.choices?.[0]?.message?.content ?? "";
  if (!text) throw new RetryableError("OpenRouter returned no content");
  return { text, engine: `OpenRouter · ${json.model ?? models[0]}` };
}

// ---------- Provider chain ----------

const CALLERS: Record<AIProvider, (o: CallOptions) => Promise<CallResult>> = {
  groq: callGroq,
  openrouter: callOpenRouter,
};
const AUTH_COOLDOWN_MS = 10 * 60_000;
const g = globalThis as unknown as { __impactlensAiDown?: Map<AIProvider, number> };
const down: Map<AIProvider, number> = (g.__impactlensAiDown ??= new Map());

async function runProvider<T>(
  provider: AIProvider,
  opts: { system: string; prompt: string; images: InlineImage[]; timeoutMs: number; deadline: number },
  attempts: number,
): Promise<{ data: T; engine: string }> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    const remaining = opts.deadline - Date.now();
    if (remaining < 2000) break;
    try {
      const { text, engine } = await CALLERS[provider]({
        system: opts.system,
        prompt: opts.prompt,
        images: opts.images,
        signal: AbortSignal.timeout(Math.min(opts.timeoutMs, remaining)),
      });
      return { data: parseJSON<T>(text), engine };
    } catch (e) {
      lastError = e;
      const retryable = e instanceof RetryableError || e instanceof SyntaxError;
      if (!retryable || i === attempts - 1) break;
      const wait = e instanceof RetryableError && e.retryAfterMs ? e.retryAfterMs : 1500 * 2 ** i;
      if (Date.now() + wait > opts.deadline - 2000) break;
      await sleep(Math.min(wait, 30000));
    }
  }
  throw lastError ?? new Error(`${PROVIDER_NAMES[provider]} timed out`);
}

const background = new AsyncLocalStorage<true>();
const activity = globalThis as unknown as { __impactlensForegroundAt?: number };

/** Run AI work that should give way to user requests, which share the same per-minute token limits. */
export const runInBackground = <T>(fn: () => Promise<T>) => background.run(true, fn);

/** Milliseconds since a user-triggered AI call last started or finished. */
export const foregroundIdleMs = () => Date.now() - (activity.__impactlensForegroundAt ?? 0);

/** True when at least one configured provider is not paused by a quota or auth cooldown. */
export function aiAvailable() {
  const now = Date.now();
  return aiProviders().some((p) => (down.get(p) ?? 0) < now);
}

/**
 * Ask the configured models for a JSON object. Providers are tried in priority order
 * (OpenRouter free models by default, see `aiProviders`); each retries transient failures before
 * the next one takes over. Returns the parsed object and the engine that produced it.
 */
export async function generateJSON<T>(opts: {
  system: string;
  prompt: string;
  images?: InlineImage[];
  timeoutMs?: number;
  /** Total time budget across all providers and retries. */
  budgetMs?: number;
}): Promise<{ data: T; engine: string }> {
  if (background.getStore()) return callChain<T>(opts);
  activity.__impactlensForegroundAt = Date.now();
  try {
    return await callChain<T>(opts);
  } finally {
    activity.__impactlensForegroundAt = Date.now();
  }
}

async function callChain<T>(opts: Parameters<typeof generateJSON>[0]): Promise<{ data: T; engine: string }> {
  const configured = aiProviders();
  if (!configured.length) {
    throw new NotConfiguredError("AI credentials missing", "AI analysis is unavailable right now. Please try again shortly.");
  }
  const now = Date.now();
  const chain = configured.filter((p) => (down.get(p) ?? 0) < now);
  if (!chain.length) {
    throw new NotConfiguredError("All AI providers are cooling down", "AI analysis is temporarily unavailable. Please try again later.");
  }
  const timeoutMs = opts.timeoutMs ?? 45000;
  const deadline = now + (opts.budgetMs ?? timeoutMs * 3);

  let lastError: unknown;
  for (const [i, provider] of chain.entries()) {
    const hasFallback = i < chain.length - 1;
    try {
      const result = await runProvider<T>(
        provider,
        { system: opts.system, prompt: opts.prompt, images: opts.images ?? [], timeoutMs, deadline },
        hasFallback ? 2 : 4,
      );
      if (i > 0) console.info(`[ai] served by fallback provider: ${result.engine}`);
      return result;
    } catch (e) {
      lastError = e;
      if (e instanceof ProviderAuthError) down.set(provider, Date.now() + AUTH_COOLDOWN_MS);
      if (e instanceof QuotaExhaustedError) {
        down.set(provider, e.resetAt);
        console.warn(`[ai] ${PROVIDER_NAMES[provider]} daily quota used up; paused until ${new Date(e.resetAt).toISOString()}`);
      }
      if (hasFallback) {
        console.warn(`[ai] ${PROVIDER_NAMES[provider]} failed (${e instanceof Error ? e.message : e}); trying ${PROVIDER_NAMES[chain[i + 1]]}`);
      }
    }
  }
  if (lastError instanceof QuotaExhaustedError || lastError instanceof ProviderAuthError || lastError instanceof ModelUnavailableError) {
    throw new NotConfiguredError(lastError.message, "AI analysis is temporarily unavailable. Please try again later.");
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

