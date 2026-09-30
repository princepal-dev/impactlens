import "server-only";
import { aiProvider, config } from "./config";

export class AIUnavailableError extends Error {}

export interface InlineImage {
  mimeType: string;
  base64: string;
}

/** Fetch an image (absolute URL or same-origin path) and return it as base64 for vision models. */
export async function loadImage(url: string, origin: string): Promise<InlineImage> {
  const abs = url.startsWith("http") ? url : `${origin}${url}`;
  const res = await fetch(abs, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Could not fetch media (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { mimeType: res.headers.get("content-type")?.split(";")[0] || "image/jpeg", base64: buf.toString("base64") };
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.search(/[[{]/);
  return JSON.parse(start > 0 ? cleaned.slice(start) : cleaned) as T;
}

/** Ask the configured model for a JSON object. Throws AIUnavailableError when no provider is configured. */
export async function generateJSON<T>(opts: {
  system: string;
  prompt: string;
  images?: InlineImage[];
  timeoutMs?: number;
}): Promise<T> {
  const provider = aiProvider();
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 30000);

  if (provider === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent`,
      {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": config.gemini.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: [
            {
              role: "user",
              parts: [
                ...(opts.images ?? []).map((i) => ({ inline_data: { mime_type: i.mimeType, data: i.base64 } })),
                { text: opts.prompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? `Gemini error ${res.status}`);
    const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    return parseJSON<T>(text);
  }

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
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
              ...(opts.images ?? []).map((i) => ({
                type: "image_url",
                image_url: { url: `data:${i.mimeType};base64,${i.base64}` },
              })),
            ],
          },
        ],
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? `OpenAI error ${res.status}`);
    return parseJSON<T>(json.choices?.[0]?.message?.content ?? "");
  }

  throw new AIUnavailableError("No AI provider configured");
}
