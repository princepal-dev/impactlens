import "server-only";
import { generateJSON, loadImage } from "./ai";
import { aiEngineLabel } from "./config";
import { getProject, listProjects } from "./store";
import type { AIMetadata, Stage } from "./types";

export const ANALYSIS_SYSTEM_PROMPT = `You are an impact and sustainability media analyst.

Analyze this field photo/video frame.

Identify:
- What is happening?
- What project/activity is shown?
- Location if visible or inferable from supplied metadata
- Infrastructure/assets visible
- People count if reasonably visible
- Objects
- Environmental/sustainability relevance
- Impact areas
- Implementation stage
- Whether this media could represent before/after evidence
- Useful searchable tags

Do not invent exact facts that cannot be observed.
Return valid JSON only using the provided schema.
Prioritize observable evidence over assumptions.`;

const SCHEMA = `{
  "title": string (max 8 words),
  "description": string (1-2 sentences, observable facts only),
  "project": string (exact name of the assigned project if supplied; otherwise one of the known projects if it plausibly fits, else a short descriptive name),
  "location": string ("City, State" if supplied or visible, else "Unknown"),
  "category": "Water & Sanitation" | "Environment" | "Renewable Energy" | "Infrastructure" | "Community" | "Other",
  "activity": string,
  "tags": string[] (5-8 lowercase-hyphenated tags),
  "impactAreas": string[] (2-4, e.g. "Water Access", "Clean Energy", "Climate Action"),
  "peopleCount": number | null (null if not reasonably countable),
  "objects": string[],
  "stage": "baseline" | "implementation" | "completed" | "monitoring",
  "confidence": number (0-1, your confidence in this analysis),
  "date": string (YYYY-MM-DD, use supplied capture date),
  "beforeAfterCandidate": boolean
}`;

export interface AnalyzeContext {
  filename?: string;
  projectHint?: string | null;
  locationHint?: string | null;
  captureDate: string;
}

const STAGES: Stage[] = ["baseline", "implementation", "completed", "monitoring"];
const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function normalizeMetadata(raw: Partial<AIMetadata>, ctx: AnalyzeContext): AIMetadata {
  const assigned = getProject(ctx.projectHint);
  const matched = assigned ?? getProject(raw.project ? String(raw.project) : null);
  const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);
  const confidence = Math.max(0, Math.min(1, Number(raw.confidence ?? 0.7)));
  const location = raw.location && raw.location !== "Unknown" ? String(raw.location) : ctx.locationHint || matched?.location || "Unknown";
  return {
    title: String(raw.title || "Untitled field media").slice(0, 90),
    description: String(raw.description || "No description available."),
    project: matched?.name ?? String(raw.project || "Unassigned"),
    location,
    category: String(raw.category || matched?.category || "Other"),
    activity: String(raw.activity || "Field documentation"),
    tags: [...new Set(arr(raw.tags).map(slug))].filter(Boolean).slice(0, 10),
    impactAreas: arr(raw.impactAreas).slice(0, 5),
    peopleCount: raw.peopleCount == null || Number.isNaN(Number(raw.peopleCount)) ? null : Number(raw.peopleCount),
    objects: arr(raw.objects).slice(0, 10),
    stage: STAGES.includes(raw.stage as Stage) ? (raw.stage as Stage) : "implementation",
    confidence: Math.round(confidence * 100) / 100,
    date: ctx.captureDate,
    beforeAfterCandidate: Boolean(raw.beforeAfterCandidate),
  };
}

/** Run vision analysis on a Cloudinary-derived frame and return schema-conformant metadata. */
export async function analyzeMedia(frameUrl: string, ctx: AnalyzeContext) {
  const image = await loadImage(frameUrl);
  const assigned = getProject(ctx.projectHint);
  const projects = listProjects();
  const prompt = `Schema:
${SCHEMA}

Supplied metadata:
- Original filename: ${ctx.filename ?? "unknown"}
- Capture date: ${ctx.captureDate}
- Project assigned by uploader: ${assigned ? `${assigned.name} (${assigned.category}, ${assigned.region})` : "not specified"}
- Site location supplied by uploader: ${ctx.locationHint || "not specified"}
- Known projects: ${projects.map((p) => `${p.name} — ${p.category}, ${p.region}`).join("; ")}

Describe what is actually visible in the image. Return the JSON object only.`;
  const raw = await generateJSON<Partial<AIMetadata>>({ system: ANALYSIS_SYSTEM_PROMPT, prompt, images: [image] });
  return { metadata: normalizeMetadata(raw, ctx), engine: aiEngineLabel() };
}
