import "server-only";
import { generateJSON, loadImage } from "./ai";
import { aiEngineLabel, aiProvider } from "./config";
import { PROJECTS } from "./seed";
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
  "project": string (one of the known projects if it plausibly fits, else a short descriptive name),
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
  captureDate: string;
}

const STAGES: Stage[] = ["baseline", "implementation", "completed", "monitoring"];
const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function normalizeMetadata(raw: Partial<AIMetadata>, ctx: AnalyzeContext): AIMetadata {
  const known = PROJECTS.find(
    (p) =>
      (raw.project && p.name.toLowerCase() === String(raw.project).toLowerCase()) ||
      (ctx.projectHint && (p.id === ctx.projectHint || p.slug === ctx.projectHint)),
  );
  const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);
  const confidence = Math.max(0, Math.min(1, Number(raw.confidence ?? 0.75)));
  return {
    title: String(raw.title || "Untitled field media").slice(0, 90),
    description: String(raw.description || "No description available."),
    project: String(raw.project || known?.name || "Unassigned"),
    location: String(raw.location && raw.location !== "Unknown" ? raw.location : known?.location ?? "Unknown"),
    category: String(raw.category || known?.category || "Other"),
    activity: String(raw.activity || "Field documentation"),
    tags: [...new Set(arr(raw.tags).map(slug))].slice(0, 10),
    impactAreas: arr(raw.impactAreas).slice(0, 5),
    peopleCount: raw.peopleCount == null || Number.isNaN(Number(raw.peopleCount)) ? null : Number(raw.peopleCount),
    objects: arr(raw.objects).slice(0, 10),
    stage: STAGES.includes(raw.stage as Stage) ? (raw.stage as Stage) : "implementation",
    confidence: Math.round(confidence * 100) / 100,
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date)) ? String(raw.date) : ctx.captureDate,
    beforeAfterCandidate: Boolean(raw.beforeAfterCandidate),
  };
}

// ---------- Deterministic demo engine ----------
type Profile = Omit<AIMetadata, "date" | "confidence" | "project" | "location" | "category" | "stage"> & {
  stage?: Stage;
};

const PROFILES: Record<string, { keys: RegExp; projectId: string; variants: [RegExp | null, Profile][] }> = {
  water: {
    keys: /water|tank|pump|bore|well|pipe|dam|rain|tap|jal|river|pond|irrigat|sanit|toilet|wash/i,
    projectId: "p-rajasthan-water",
    variants: [
      [/pump|bore|well|tap/i, {
        title: "Community hand pump water point",
        description: "A hand pump installed at a community water point with a paved platform. Water access infrastructure is clearly visible.",
        activity: "Community water point",
        tags: ["hand-pump", "borewell", "drinking-water", "community-water-point", "water-access"],
        impactAreas: ["Water Access", "Health", "Community Development"],
        peopleCount: 1,
        objects: ["hand pump", "platform", "drain"],
        beforeAfterCandidate: false,
        stage: "completed",
      }],
      [/pipe|trench/i, {
        title: "Water pipeline being laid in trench",
        description: "Pipeline sections placed along an excavated trench, indicating water distribution works in progress.",
        activity: "Pipeline installation",
        tags: ["pipeline", "water-distribution", "construction", "infrastructure", "trench"],
        impactAreas: ["Water Access", "Infrastructure"],
        peopleCount: 2,
        objects: ["pipes", "trench", "soil"],
        beforeAfterCandidate: true,
        stage: "implementation",
      }],
      [null, {
        title: "Community water storage tank",
        description: "An elevated water storage tank serving a rural settlement. The structure appears complete and connected to supply pipes.",
        activity: "Water storage infrastructure",
        tags: ["water-tank", "water-storage", "infrastructure", "rural-water-supply", "water-access"],
        impactAreas: ["Water Access", "Infrastructure", "Community Development"],
        peopleCount: 0,
        objects: ["water tank", "support structure", "pipes"],
        beforeAfterCandidate: true,
        stage: "completed",
      }],
    ],
  },
  environment: {
    keys: /tree|plant|sapling|garden|green|park|forest|waste|garbage|clean|litter|recycl|compost|leaf|grass/i,
    projectId: "p-delhi-greening",
    variants: [
      [/waste|garbage|litter|clean|recycl/i, {
        title: "Waste collection and clean-up activity",
        description: "Collected waste and segregation bins at a public site, documenting clean-up and waste management activity.",
        activity: "Waste collection",
        tags: ["waste-collection", "segregation", "clean-up", "recycling", "urban-environment"],
        impactAreas: ["Waste Management", "Urban Environment", "Public Health"],
        peopleCount: 2,
        objects: ["waste bins", "collected waste"],
        beforeAfterCandidate: true,
        stage: "implementation",
      }],
      [null, {
        title: "Tree plantation at restoration site",
        description: "Young saplings planted in prepared pits across an open area, indicating active urban greening work.",
        activity: "Tree plantation",
        tags: ["tree-plantation", "saplings", "greening", "urban-forest", "biodiversity"],
        impactAreas: ["Biodiversity", "Climate Action", "Urban Environment"],
        peopleCount: 3,
        objects: ["saplings", "planting pits", "tree guards"],
        beforeAfterCandidate: true,
        stage: "implementation",
      }],
    ],
  },
  solar: {
    keys: /solar|panel|pv|energy|power|electri|roof|school|battery|grid|light/i,
    projectId: "p-maharashtra-solar",
    variants: [
      [/school|class|student/i, {
        title: "Solar panels installed at rural school",
        description: "Solar panels installed on the rooftop of a rural school building.",
        activity: "Solar panel installation",
        tags: ["solar", "renewable-energy", "school", "infrastructure", "clean-energy"],
        impactAreas: ["Clean Energy", "Education", "Climate Action"],
        peopleCount: 4,
        objects: ["solar panels", "building", "workers"],
        beforeAfterCandidate: true,
        stage: "implementation",
      }],
      [null, {
        title: "Rooftop solar array installed",
        description: "Rows of photovoltaic panels mounted on a rooftop frame. The installation appears complete.",
        activity: "Rooftop solar deployment",
        tags: ["solar", "rooftop-solar", "renewable-energy", "clean-energy", "installation"],
        impactAreas: ["Clean Energy", "Climate Action"],
        peopleCount: 0,
        objects: ["solar panels", "mounting frame", "roof"],
        beforeAfterCandidate: true,
        stage: "completed",
      }],
    ],
  },
};

export function demoAnalyze(ctx: AnalyzeContext): AIMetadata {
  const name = (ctx.filename ?? "").replace(/\.[a-z0-9]+$/i, "").replace(/[_\-.]+/g, " ");
  const hinted = ctx.projectHint ? PROJECTS.find((p) => p.id === ctx.projectHint || p.slug === ctx.projectHint) : null;

  let key = Object.keys(PROFILES).find((k) => PROFILES[k].keys.test(name));
  if (!key && hinted) key = Object.keys(PROFILES).find((k) => PROFILES[k].projectId === hinted.id);
  if (!key) key = Object.keys(PROFILES)[hash(name || ctx.captureDate) % 3];

  const profile = PROFILES[key];
  const project = hinted ?? PROJECTS.find((p) => p.id === profile.projectId)!;
  const [, variant] = profile.variants.find(([re]) => !re || re.test(name))!;

  let stage: Stage = variant.stage ?? "implementation";
  if (/before|baseline|old|survey/i.test(name)) stage = "baseline";
  else if (/after|complete|final|done/i.test(name)) stage = "completed";
  else if (/construct|install|progress|work/i.test(name)) stage = "implementation";

  return normalizeMetadata(
    {
      ...variant,
      project: project.name,
      location: project.location,
      category: project.category,
      stage,
      confidence: 0.84 + (hash(name) % 10) / 100,
      date: ctx.captureDate,
    },
    ctx,
  );
}

export async function analyzeMedia(frameUrl: string | null, ctx: AnalyzeContext, origin: string) {
  if (aiProvider() === "demo" || !frameUrl) {
    await new Promise((r) => setTimeout(r, 900));
    return { metadata: demoAnalyze(ctx), engine: frameUrl ? aiEngineLabel() : "Demo engine (no frame available)" };
  }
  const image = await loadImage(frameUrl, origin);
  const hint = ctx.projectHint ? PROJECTS.find((p) => p.id === ctx.projectHint || p.slug === ctx.projectHint) : null;
  const prompt = `Schema:\n${SCHEMA}\n\nSupplied metadata:\n- Original filename: ${ctx.filename ?? "unknown"}\n- Capture date: ${ctx.captureDate}\n- Project assigned by uploader: ${hint ? `${hint.name} (${hint.location}, ${hint.category})` : "not specified"}\n- Known projects: ${PROJECTS.map((p) => `${p.name} — ${p.category}, ${p.location}`).join("; ")}\n\nReturn the JSON object only.`;
  const raw = await generateJSON<Partial<AIMetadata>>({ system: ANALYSIS_SYSTEM_PROMPT, prompt, images: [image] });
  return { metadata: normalizeMetadata(raw, ctx), engine: aiEngineLabel() };
}
