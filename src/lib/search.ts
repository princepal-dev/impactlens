import "server-only";
import { generateJSON } from "./ai";
import { aiEngineLabel, aiProvider } from "./config";
import { PROJECTS } from "./seed";
import { listAssets } from "./store";
import type { MediaAsset, SearchInterpretation, SearchResponse, SearchResult, Stage } from "./types";

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

const LOCATIONS: Record<string, string> = {
  rajasthan: "Rajasthan", jodhpur: "Jodhpur", barmer: "Barmer", phalodi: "Phalodi", osian: "Osian", jaisalmer: "Jaisalmer",
  delhi: "Delhi", "new delhi": "New Delhi", dwarka: "Dwarka", saket: "Saket", bhalswa: "Bhalswa", yamuna: "Yamuna",
  maharashtra: "Maharashtra", pune: "Pune", satara: "Satara", baramati: "Baramati", nashik: "Nashik",
};

const CATEGORY_RULES: [RegExp, string][] = [
  [/\b(water|sanitation|wash|borewell|hand ?pump|tank|pipeline|drinking|rainwater|check ?dam)\b/i, "Water & Sanitation"],
  [/\b(solar|renewable|clean energy|energy|photovoltaic|pv)\b/i, "Renewable Energy"],
  [/\b(tree|trees|plantation|greening|green|garden|park|waste|forest|sapling|saplings|environment|environmental)\b/i, "Environment"],
];

/** Lightweight concept graph so natural phrasing maps onto indexed tags. */
const CONCEPTS: Record<string, string[]> = {
  water: ["water", "water-tank", "hand-pump", "borewell", "pipeline", "rainwater-harvesting", "check-dam", "drinking-water", "water-access", "water-storage", "wash"],
  infrastructure: ["infrastructure", "construction", "water-tank", "pipeline", "check-dam", "foundation", "installation", "structure"],
  construction: ["construction", "scaffolding", "excavation", "foundation", "installation", "infrastructure"],
  borewell: ["borewell", "hand-pump", "groundwater-recharge", "drinking-water"],
  pump: ["hand-pump", "borewell", "community-water-point"],
  tank: ["water-tank", "water-storage", "rainwater-harvesting"],
  pipeline: ["pipeline", "water-distribution", "trench"],
  rain: ["rainwater-harvesting", "monsoon", "check-dam"],
  drought: ["drought", "dry-land", "water-scarcity", "arid", "cracked-soil"],
  solar: ["solar", "solar-installation", "rooftop-solar", "solar-array", "solar-farm", "renewable-energy", "clean-energy"],
  renewable: ["renewable-energy", "solar", "clean-energy", "solar-array"],
  energy: ["clean-energy", "renewable-energy", "solar"],
  installation: ["installation", "solar-installation", "construction"],
  tree: ["tree-plantation", "saplings", "tree-cover", "canopy", "greening", "tree-guards"],
  plantation: ["tree-plantation", "saplings", "greening", "volunteers"],
  green: ["green-space", "greening", "restored-green-area", "tree-cover", "urban-garden"],
  garden: ["urban-garden", "green-space", "landscaping", "public-park"],
  park: ["public-park", "green-space", "urban-garden"],
  restoration: ["restored-green-area", "degraded-land", "greening"],
  waste: ["waste", "waste-collection", "segregation", "dumping", "recycling", "bins"],
  school: ["school", "rural-school", "students", "children", "education", "solar-school", "wash"],
  children: ["children", "students", "school"],
  community: ["community", "women", "volunteers", "families", "community-water-point"],
  women: ["women", "water-collection", "community"],
  road: ["road", "highway", "construction", "infrastructure"],
  development: ["construction", "infrastructure", "completed"],
  village: ["village", "rural", "rural-settlement", "rural-water-supply"],
  rural: ["rural", "village", "rural-school", "rural-water-supply"],
};

const STOP = new Set(
  "show me all the a an of in on at for with from to and or find any evidence photos photo images image media videos video projects project that which is are was were after before since until during between completed complete finished ongoing where what our my please give list display 2024 2025 2026 2027 involving related about by".split(" "),
);

function parseDates(q: string) {
  const out: { dateAfter?: string; dateBefore?: string } = {};
  const m = (re: RegExp) => q.match(re);
  const monthIdx = (s: string) => MONTHS.findIndex((x) => x.startsWith(s.toLowerCase().slice(0, 3)));
  const after = m(/\b(?:after|since|from)\s+([a-z]+)\s*(\d{4})?/i);
  if (after && monthIdx(after[1]) >= 0) {
    out.dateAfter = `${after[2] ?? "2026"}-${String(monthIdx(after[1]) + 1).padStart(2, "0")}-01`;
  }
  const before = m(/\b(?:before|until|till|prior to)\s+([a-z]+)\s*(\d{4})?/i);
  if (before && monthIdx(before[1]) >= 0) {
    out.dateBefore = `${before[2] ?? "2026"}-${String(monthIdx(before[1]) + 1).padStart(2, "0")}-01`;
  }
  const year = m(/\bin\s+(20\d{2})\b/i);
  if (year && !out.dateAfter && !out.dateBefore) {
    out.dateAfter = `${year[1]}-01-01`;
    out.dateBefore = `${year[1]}-12-31`;
  }
  return out;
}

export function ruleInterpret(query: string): SearchInterpretation {
  const q = query.toLowerCase();
  const it: SearchInterpretation = { keywords: [] };

  const locKey = Object.keys(LOCATIONS)
    .sort((a, b) => b.length - a.length)
    .find((k) => new RegExp(`\\b${k}\\b`).test(q));
  if (locKey) it.location = LOCATIONS[locKey];

  for (const p of PROJECTS) if (q.includes(p.name.toLowerCase())) it.project = p.name;
  for (const [re, cat] of CATEGORY_RULES) if (re.test(q)) { it.category = cat; break; }

  if (/\b(completed|finished|complete|operational|done)\b/.test(q)) it.stage = "completed";
  else if (/\b(ongoing|under construction|in progress|construction|installation)\b/.test(q)) it.stage = "implementation";
  else if (/\b(baseline)\b/.test(q)) it.stage = "baseline";

  if (/before\s*(\/|and|&|-)\s*after|before-after|progress over time|transformation/.test(q)) it.beforeAfter = true;

  Object.assign(it, parseDates(q));

  if (/infrastructure|construction|build/.test(q)) it.activity = "Construction / implementation";
  else if (/plantation|planting|tree/.test(q)) it.activity = "Tree plantation";
  else if (/solar|install/.test(q)) it.activity = "Solar installation";
  else if (/waste|clean/.test(q)) it.activity = "Waste management";
  else if (/school/.test(q)) it.activity = "School programmes";

  const locWords = new Set(Object.keys(LOCATIONS).flatMap((k) => k.split(" ")));
  it.keywords = [
    ...new Set(
      q
        .replace(/before\s*\/\s*after/g, " ")
        .split(/[^a-z0-9-]+/)
        .map((w) => w.replace(/(ies)$/, "y").replace(/(?<![s])s$/, ""))
        .filter((w) => w.length > 2 && !STOP.has(w) && !locWords.has(w) && !MONTHS.includes(w)),
    ),
  ];
  return it;
}

async function aiInterpret(query: string): Promise<SearchInterpretation | null> {
  if (aiProvider() === "demo") return null;
  try {
    const raw = await generateJSON<Partial<SearchInterpretation>>({
      system:
        "You convert natural-language questions about an impact/sustainability media library into structured search filters. Return JSON only.",
      prompt: `Convert this natural-language query into searchable filters.

Query: "${query}"

Known projects: ${PROJECTS.map((p) => `${p.name} (${p.category}, ${p.region})`).join("; ")}
Categories: "Water & Sanitation" | "Environment" | "Renewable Energy"
Stages: "baseline" | "implementation" | "completed" | "monitoring"
Today is 2026-09-30.

Return:
{ "category"?: string, "location"?: string (state or city only), "project"?: string, "activity"?: string (short human label), "stage"?: string, "dateAfter"?: "YYYY-MM-DD", "dateBefore"?: "YYYY-MM-DD", "beforeAfter"?: boolean, "keywords": string[] (2-6 concrete visual concepts, singular, e.g. "water tank", "sapling") }
Omit fields that the query does not specify.`,
      timeoutMs: 9000,
    });
    return { ...raw, keywords: Array.isArray(raw.keywords) ? raw.keywords.map(String) : [] };
  } catch (e) {
    console.warn("[search] AI interpretation failed, using rules", e);
    return null;
  }
}

// ---------- Ranking ----------
const FIELD_WEIGHTS = { tags: 3, title: 2.5, activity: 2, objects: 2, impact: 1.5, description: 1, project: 1 } as const;

function fields(a: MediaAsset) {
  return {
    tags: a.tags.join(" ").toLowerCase(),
    title: a.title.toLowerCase(),
    activity: a.activity.toLowerCase(),
    objects: a.objects.join(" ").toLowerCase(),
    impact: a.impactAreas.join(" ").toLowerCase(),
    description: a.description.toLowerCase(),
    project: `${a.project} ${a.category}`.toLowerCase(),
  };
}

function termScore(f: ReturnType<typeof fields>, term: string) {
  const t = term.toLowerCase().replace(/-/g, " ");
  const variants = [t, t.replace(/ /g, "-")];
  let best = 0;
  for (const [k, w] of Object.entries(FIELD_WEIGHTS)) {
    const text = f[k as keyof typeof f];
    if (variants.some((v) => new RegExp(`(^|[^a-z])${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text))) best = Math.max(best, w);
  }
  return best;
}

function scoreAsset(a: MediaAsset, groups: string[][]) {
  if (!groups.length) return { score: 0, matched: [] as string[] };
  const f = fields(a);
  let total = 0;
  const matched: string[] = [];
  for (const [head, ...exp] of groups) {
    let s = termScore(f, head);
    let hit = s ? head : "";
    for (const e of exp) {
      const es = termScore(f, e) * 0.85;
      if (es > s) { s = es; hit = e; }
    }
    if (s) matched.push(hit);
    total += s;
  }
  return { score: total / (groups.length * 3), matched: [...new Set(matched)] };
}

const stageOk = (asset: Stage, wanted?: Stage) =>
  !wanted || asset === wanted || (wanted === "completed" && asset === "monitoring");

export async function searchEvidence(query: string): Promise<SearchResponse> {
  const t0 = Date.now();
  const rules = ruleInterpret(query);
  const ai = await aiInterpret(query);
  const it: SearchInterpretation = ai
    ? { ...rules, ...Object.fromEntries(Object.entries(ai).filter(([, v]) => v !== undefined && v !== null && v !== "")), keywords: [...new Set([...(ai.keywords ?? []), ...rules.keywords])] }
    : rules;

  const assets = (await listAssets()).filter((a) => a.status !== "analyzing");
  const groups = it.keywords.map((k) => {
    const base = k.toLowerCase();
    const key = Object.keys(CONCEPTS).find((c) => base === c || base.startsWith(c) || base.split(" ").includes(c));
    return [base, ...(key ? CONCEPTS[key] : [])];
  });

  const hard = (a: MediaAsset, relax: number) => {
    const reasons: string[] = [];
    if (it.project && a.project !== it.project && relax < 3) return null;
    if (it.location && relax < 2) {
      const loc = `${a.location} ${PROJECTS.find((p) => p.id === a.projectId)?.region ?? ""}`.toLowerCase();
      if (!loc.includes(it.location.toLowerCase())) return null;
      reasons.push("location");
    }
    if (it.category && relax < 1) {
      if (a.category !== it.category) return null;
      reasons.push("category");
    }
    if (it.dateAfter && a.date < it.dateAfter) return null;
    if (it.dateBefore && a.date > it.dateBefore) return null;
    return reasons;
  };

  let relaxLevel = 0;
  let results: SearchResult[] = [];
  for (; relaxLevel < 3; relaxLevel++) {
    results = [];
    for (const a of assets) {
      const reasons = hard(a, relaxLevel);
      if (!reasons) continue;
      const { score, matched } = scoreAsset(a, groups);
      if (groups.length && score === 0 && reasons.length === 0) continue;
      let rel = groups.length ? 0.38 + 0.48 * score : 0.7;
      rel += 0.03 * reasons.length;
      if (stageOk(a.stage, it.stage)) rel += it.stage ? 0.04 : 0;
      else rel -= 0.2;
      if (it.beforeAfter) rel += a.beforeAfterCandidate ? 0.08 : -0.12;
      rel += (a.confidence - 0.85) * 0.25;
      results.push({ asset: a, relevance: Math.max(0.05, Math.min(0.97, rel)), matched: [...matched, ...reasons.map((r) => (r === "location" ? a.location : a.category))] });
    }
    results = results.filter((r) => r.relevance >= 0.5).sort((x, y) => y.relevance - x.relevance);
    if (results.length) break;
    if (!it.category && !it.location && !it.project) break;
  }

  const filtersApplied = [
    it.project && `project = ${it.project}`,
    it.category && relaxLevel < 1 && `category = ${it.category}`,
    it.location && relaxLevel < 2 && `location ⊃ ${it.location}`,
    it.stage && `stage ≈ ${it.stage}`,
    it.dateAfter && `date ≥ ${it.dateAfter}`,
    it.dateBefore && `date ≤ ${it.dateBefore}`,
    it.beforeAfter && "before/after candidates boosted",
  ].filter(Boolean) as string[];

  return {
    query,
    interpretation: it,
    results: results.slice(0, 24),
    diagnostics: {
      interpreter: ai ? aiEngineLabel() : "Rule-based query parser",
      ranking: "Concept-expanded weighted metadata match + filters",
      scanned: assets.length,
      filtersApplied,
      relaxed: relaxLevel > 0,
      ms: Date.now() - t0,
    },
  };
}
