import "server-only";
import { aiProviders, config, DEFAULT_GEMINI_MODEL, NotConfiguredError, PROVIDER_NAMES, type AIProvider } from "./config";

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

type CallOptions = { system: string; prompt: string; images: InlineImage[]; signal: AbortSignal };
type CallResult = { text: string; engine: string };


/** Gemini 3+ controls reasoning with `thinkingLevel`; 2.x Flash accepts a zero thinking budget. */
function thinkingConfig(model: string) {
  const major = Number(model.match(/gemini-(\d+)/)?.[1] ?? 0);
  if (major >= 3) return { thinkingLevel: "low" };
  if (/flash/.test(model)) return { thinkingBudget: 0 };
  return undefined;
}

let geminiModel = config.gemini.model;

async function callGemini(opts: CallOptions): Promise<CallResult> {
  const model = geminiModel;
  const thinking = thinkingConfig(model);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    signal: opts.signal,
    headers: { "Content-Type": "application/json", "x-goog-api-key": config.gemini.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [
        {
          role: "user",
          parts: [...opts.images.map((i) => ({ inline_data: { mime_type: i.mimeType, data: i.base64 } })), { text: opts.prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        ...(thinking ? { thinkingConfig: thinking } : {}),
      },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 429 || res.status >= 500) {
    const delay = json?.error?.details?.find((d: { retryDelay?: string }) => d.retryDelay)?.retryDelay;
    throw new RetryableError(json?.error?.message ?? `Gemini error ${res.status}`, delay ? parseFloat(delay) * 1000 : 0);
  }
  if (!res.ok) {
    const message: string = json?.error?.message ?? `Gemini error ${res.status}`;
    // Retired or unknown model: switch to the current default instead of failing every request.
    if (model !== DEFAULT_GEMINI_MODEL && (res.status === 404 || /no longer available|not found|not supported/i.test(message))) {
      console.warn(`[ai] Gemini model "${model}" unavailable (${message}); falling back to ${DEFAULT_GEMINI_MODEL}`);
      geminiModel = DEFAULT_GEMINI_MODEL;
      return callGemini(opts);
    }
    if (res.status === 401 || res.status === 403 || /denied access|api key not valid|permission/i.test(message)) throw new ProviderAuthError(message);
    throw new Error(message);
  }
  const blocked = json?.promptFeedback?.blockReason;
  if (blocked) throw new Error(`Content blocked by the AI provider (${blocked})`);
  const candidate = json?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) {
    const reason = candidate?.finishReason ?? "unknown";
    if (["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION"].includes(reason)) {
      throw new Error(`Content blocked by the AI provider (${reason})`);
    }
    throw new RetryableError(`Gemini returned no content (${reason})`);
  }
  return { text, engine: `Gemini · ${model}` };
}

async function callOpenAI(opts: CallOptions): Promise<CallResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: opts.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openai.apiKey}` },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: chatMessages(opts),
    }),
  });
  const json = await res.json().catch(() => ({}));
  const message = json?.error?.message ?? `OpenAI error ${res.status}`;
  if (res.status === 429 || res.status >= 500) throw new RetryableError(message);
  if (res.status === 401 || res.status === 403) throw new ProviderAuthError(message);
  if (!res.ok) throw new Error(message);
  return { text: json.choices?.[0]?.message?.content ?? "", engine: `OpenAI · ${config.openai.model}` };
}

function chatMessages(opts: CallOptions) {
  return [
    { role: "system", content: opts.system },
    {
      role: "user",
      content: [
        { type: "text", text: opts.prompt },
        ...opts.images.map((i) => ({ type: "image_url", image_url: { url: `data:${i.mimeType};base64,${i.base64}` } })),
      ],
    },
  ];
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
let freeModels: { vision: string[]; text: string[]; at: number } | null = null;

const rank = (m: OpenRouterModel) => {
  const i = PREFERRED.findIndex((re) => re.test(m.id));
  return (m.supported_parameters?.includes("response_format") ? 0 : 100) + (i < 0 ? PREFERRED.length : i);
};

/** Free chat models from OpenRouter's live catalogue, JSON-capable and best-known families first. */
async function openRouterFreeModels(): Promise<{ vision: string[]; text: string[] }> {
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
    freeModels = { vision, text: free.map((m) => m.id), at: Date.now() };
  } catch (e) {
    console.warn("[ai] OpenRouter model catalogue unavailable, using built-in list:", e instanceof Error ? e.message : e);
    freeModels = { vision: FALLBACK_FREE_MODELS, text: FALLBACK_FREE_MODELS, at: Date.now() - MODELS_TTL_MS + 5 * 60_000 };
  }
  return freeModels;
}

async function callOpenRouter(opts: CallOptions): Promise<CallResult> {
  const discovered = await openRouterFreeModels();
  const pool = opts.images.length ? discovered.vision : discovered.text;
  const models = [...new Set([...config.openrouter.models, ...pool.slice(0, 2), FREE_ROUTER])].slice(0, 3);
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
  if (res.status === 429 || res.status >= 500 || res.status === 408) throw new RetryableError(message);
  if (!res.ok || json?.error) throw new RetryableError(message);
  const text: string = json.choices?.[0]?.message?.content ?? "";
  if (!text) throw new RetryableError("OpenRouter returned no content");
  return { text, engine: `OpenRouter · ${json.model ?? models[0]}` };
}

// ---------- Provider chain ----------

const CALLERS: Record<AIProvider, (o: CallOptions) => Promise<CallResult>> = {
  gemini: callGemini,
  openai: callOpenAI,
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

/**
 * Ask the configured models for a JSON object. Providers are tried in priority order
 * (Gemini → OpenAI → OpenRouter free models); each retries transient failures before
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
  const configured = aiProviders();
  if (!configured.length) {
    throw new NotConfiguredError("AI credentials missing", "AI analysis is unavailable right now. Please try again shortly.");
  }
  const now = Date.now();
  const available = configured.filter((p) => (down.get(p) ?? 0) < now);
  const chain = available.length ? available : configured;
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
      if (hasFallback) {
        console.warn(`[ai] ${PROVIDER_NAMES[provider]} failed (${e instanceof Error ? e.message : e}); trying ${PROVIDER_NAMES[chain[i + 1]]}`);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

