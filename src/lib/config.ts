import "server-only";
import path from "path";

const env = (k: string) => (process.env[k] ?? "").trim();

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export const config = {
  cloudinary: {
    cloudName: env("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
    apiKey: env("CLOUDINARY_API_KEY"),
    apiSecret: env("CLOUDINARY_API_SECRET"),
    uploadPreset: env("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"),
    folder: env("CLOUDINARY_FOLDER") || "impactlens",
  },
  gemini: {
    apiKey: env("GEMINI_API_KEY") || env("GOOGLE_API_KEY"),
    model: env("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL,
  },
  openai: {
    apiKey: env("OPENAI_API_KEY"),
    model: env("OPENAI_MODEL") || "gpt-4o-mini",
  },
  groq: {
    apiKey: env("GROQ_API_KEY"),
    /** Optional model override; otherwise the first available Groq vision model is used. */
    model: env("GROQ_MODEL"),
  },
  openrouter: {
    apiKey: env("OPENROUTER_API_KEY"),
    /** Optional comma-separated preference list of free models; otherwise free vision models are discovered automatically. */
    models: env("OPENROUTER_MODEL")
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.endsWith(":free") || m === "openrouter/free"),
  },
  /** Optional comma-separated provider order, e.g. "groq,openrouter,gemini". Defaults to Groq, then OpenRouter free models. */
  providers: env("AI_PROVIDERS")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean),
  databasePath: path.resolve(/*turbopackIgnore: true*/ process.cwd(), env("DATABASE_PATH") || ".data/impactlens.db"),
};

/** Raised when a backing service is unavailable; `message` is logged, `publicMessage` is shown to users. */
export class NotConfiguredError extends Error {
  status = 503;
  constructor(
    message: string,
    public publicMessage: string,
  ) {
    super(message);
  }
}

export const cloudinaryUploadMode = (): "signed" | "unsigned" | null => {
  const c = config.cloudinary;
  if (!c.cloudName) return null;
  if (c.apiKey && c.apiSecret) return "signed";
  if (c.uploadPreset) return "unsigned";
  return null;
};

export type AIProvider = "gemini" | "openai" | "groq" | "openrouter";

export const PROVIDER_NAMES: Record<AIProvider, string> = { gemini: "Google Gemini", openai: "OpenAI", groq: "Groq", openrouter: "OpenRouter" };

const hasKey: Record<AIProvider, () => boolean> = {
  gemini: () => !!config.gemini.apiKey,
  openai: () => !!config.openai.apiKey,
  groq: () => !!config.groq.apiKey,
  openrouter: () => !!config.openrouter.apiKey,
};

/** Configured AI providers in priority order; later ones take over when earlier ones fail. */
export const aiProviders = (): AIProvider[] => {
  const requested = config.providers.filter((p): p is AIProvider => p in hasKey);
  const free: AIProvider[] = ["groq", "openrouter"];
  const order = requested.length ? requested : free.some((p) => hasKey[p]()) ? free : (["gemini", "openai"] as AIProvider[]);
  return [...new Set(order)].filter((p) => hasKey[p]());
};

export const aiProvider = (): AIProvider | null => aiProviders()[0] ?? null;

export const aiEngineLabel = (provider: AIProvider | null = aiProvider()) => {
  if (provider === "gemini") return `Gemini · ${config.gemini.model}`;
  if (provider === "openai") return `OpenAI · ${config.openai.model}`;
  if (provider === "groq") return `Groq · ${config.groq.model || "vision models"}`;
  if (provider === "openrouter") return "OpenRouter · free models";
  return "Not configured";
};

/** Connected services, for display. Missing configuration is only reported in server logs. */
export function serviceStatus() {
  const cloudinary = cloudinaryUploadMode();
  const ai = aiProvider();
  const g = globalThis as unknown as { __impactlensWarned?: boolean };
  if ((!cloudinary || !ai) && !g.__impactlensWarned) {
    g.__impactlensWarned = true;
    console.warn(
      `[impactlens] ${[!cloudinary && "Cloudinary", !ai && "AI provider"].filter(Boolean).join(" and ")} not configured — see .env.example`,
    );
  }
  return {
    storage: { connected: !!cloudinary, cloudName: config.cloudinary.cloudName || null, folder: config.cloudinary.folder },
    ai: { connected: !!ai, provider: ai, providers: aiProviders(), label: aiEngineLabel() },
  };
}

export function requireCloudinary() {
  const mode = cloudinaryUploadMode();
  if (!mode) {
    throw new NotConfiguredError(
      "Cloudinary credentials missing (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)",
      "Media storage is unavailable right now. Please try again shortly.",
    );
  }
  return mode;
}

export function requireAI() {
  const provider = aiProvider();
  if (!provider) {
    throw new NotConfiguredError(
      "AI credentials missing (GROQ_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY)",
      "AI analysis is unavailable right now. Please try again shortly.",
    );
  }
  return provider;
}
