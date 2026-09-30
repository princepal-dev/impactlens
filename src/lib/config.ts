import "server-only";
import path from "path";

const env = (k: string) => (process.env[k] ?? "").trim();

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
    model: env("GEMINI_MODEL") || "gemini-2.5-flash",
  },
  openai: {
    apiKey: env("OPENAI_API_KEY"),
    model: env("OPENAI_MODEL") || "gpt-4o-mini",
  },
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

export const aiProvider = (): "gemini" | "openai" | null => {
  if (config.gemini.apiKey) return "gemini";
  if (config.openai.apiKey) return "openai";
  return null;
};

export const aiEngineLabel = () => {
  const p = aiProvider();
  if (p === "gemini") return `Gemini · ${config.gemini.model}`;
  if (p === "openai") return `OpenAI · ${config.openai.model}`;
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
    ai: { connected: !!ai, provider: ai, label: aiEngineLabel() },
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
    throw new NotConfiguredError("AI credentials missing (GEMINI_API_KEY)", "AI analysis is unavailable right now. Please try again shortly.");
  }
  return provider;
}
