import "server-only";

const env = (k: string) => (process.env[k] ?? "").trim();

export const config = {
  demoMode: env("DEMO_MODE").toLowerCase() === "true",
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
  supabase: {
    url: env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL"),
    key: env("SUPABASE_SERVICE_ROLE_KEY"),
  },
};

export const cloudinaryUploadMode = (): "signed" | "unsigned" | "local" => {
  const c = config.cloudinary;
  if (config.demoMode || !c.cloudName) return "local";
  if (c.apiKey && c.apiSecret) return "signed";
  if (c.uploadPreset) return "unsigned";
  return "local";
};

export const aiProvider = (): "gemini" | "openai" | "demo" => {
  if (config.demoMode) return "demo";
  if (config.gemini.apiKey) return "gemini";
  if (config.openai.apiKey) return "openai";
  return "demo";
};

export const aiEngineLabel = () => {
  const p = aiProvider();
  if (p === "gemini") return `Gemini · ${config.gemini.model}`;
  if (p === "openai") return `OpenAI · ${config.openai.model}`;
  return "Demo engine (deterministic)";
};

export const dataBackend = (): "supabase" | "local" =>
  config.supabase.url && config.supabase.key ? "supabase" : "local";

export function integrationStatus() {
  return {
    demoMode: config.demoMode,
    cloudinary: {
      mode: cloudinaryUploadMode(),
      cloudName: config.cloudinary.cloudName || null,
      folder: config.cloudinary.folder,
    },
    ai: { provider: aiProvider(), label: aiEngineLabel() },
    data: { backend: dataBackend() },
  };
}
