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

export class NotConfiguredError extends Error {
  status = 503;
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

export function setupStatus() {
  const cloudinary = cloudinaryUploadMode();
  const ai = aiProvider();
  const missing: string[] = [];
  if (!cloudinary) {
    if (!config.cloudinary.cloudName) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
    missing.push("CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET");
  }
  if (!ai) missing.push("GEMINI_API_KEY");
  return {
    ready: Boolean(cloudinary && ai),
    missing,
    cloudinary: { mode: cloudinary, cloudName: config.cloudinary.cloudName || null, folder: config.cloudinary.folder },
    ai: { provider: ai, label: aiEngineLabel() },
    database: { path: path.relative(/*turbopackIgnore: true*/ process.cwd(), config.databasePath) },
  };
}

export type SetupStatus = ReturnType<typeof setupStatus>;

export function requireCloudinary() {
  const mode = cloudinaryUploadMode();
  if (!mode) {
    throw new NotConfiguredError(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.",
    );
  }
  return mode;
}

export function requireAI() {
  const provider = aiProvider();
  if (!provider) throw new NotConfiguredError("AI is not configured. Set GEMINI_API_KEY in .env.local.");
  return provider;
}
