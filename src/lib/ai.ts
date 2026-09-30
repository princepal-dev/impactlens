import "server-only";
import { config, requireAI } from "./config";

export interface InlineImage {
  mimeType: string;
  base64: string;
}

/** Fetch a (Cloudinary-derived) image and return it as base64 for vision models. */
export async function loadImage(url: string): Promise<InlineImage> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Could not fetch media from Cloudinary (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { mimeType: res.headers.get("content-type")?.split(";")[0] || "image/jpeg", base64: buf.toString("base64") };
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.search(/[[{]/);
  return JSON.parse(start > 0 ? cleaned.slice(start) : cleaned) as T;
}

class RetryableError extends Error {
  constructor(
    message: string,
    public retryAfterMs = 0,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGemini(opts: { system: string; prompt: string; images: InlineImage[]; signal: AbortSignal }) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent`, {
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
        ...(/flash/.test(config.gemini.model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 429 || res.status >= 500) {
    const delay = json?.error?.details?.find((d: { retryDelay?: string }) => d.retryDelay)?.retryDelay;
    throw new RetryableError(json?.error?.message ?? `Gemini error ${res.status}`, delay ? parseFloat(delay) * 1000 : 0);
  }
  if (!res.ok) throw new Error(json?.error?.message ?? `Gemini error ${res.status}`);
  const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) throw new RetryableError(`Gemini returned no content (${json?.candidates?.[0]?.finishReason ?? "unknown"})`);
  return text;
}

async function callOpenAI(opts: { system: string; prompt: string; images: InlineImage[]; signal: AbortSignal }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: opts.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openai.apiKey}` },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        {
          role: "user",
          content: [
            { type: "text", text: opts.prompt },
            ...opts.images.map((i) => ({ type: "image_url", image_url: { url: `data:${i.mimeType};base64,${i.base64}` } })),
          ],
        },
      ],
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 429 || res.status >= 500) throw new RetryableError(json?.error?.message ?? `OpenAI error ${res.status}`);
  if (!res.ok) throw new Error(json?.error?.message ?? `OpenAI error ${res.status}`);
  return json.choices?.[0]?.message?.content ?? "";
}

/** Ask the configured model for a JSON object, retrying rate limits and transient failures. */
export async function generateJSON<T>(opts: { system: string; prompt: string; images?: InlineImage[]; timeoutMs?: number }): Promise<T> {
  const provider = requireAI();
  const call = provider === "gemini" ? callGemini : callOpenAI;
  const attempts = 4;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const text = await call({
        system: opts.system,
        prompt: opts.prompt,
        images: opts.images ?? [],
        signal: AbortSignal.timeout(opts.timeoutMs ?? 45000),
      });
      return parseJSON<T>(text);
    } catch (e) {
      lastError = e;
      const retryable = e instanceof RetryableError || e instanceof SyntaxError;
      if (!retryable || i === attempts - 1) break;
      const wait = e instanceof RetryableError && e.retryAfterMs ? e.retryAfterMs : 1500 * 2 ** i;
      await sleep(Math.min(wait, 30000));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
