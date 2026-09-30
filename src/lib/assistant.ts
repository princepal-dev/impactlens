import "server-only";
import { generateJSON } from "./ai";
import { listAssets, listReports, orgStats, projectSummaries } from "./store";
import type { MediaAsset } from "./types";

export interface AssistantTurn {
  role: "user" | "assistant";
  text: string;
}

export interface AssistantAction {
  href: string;
  label: string;
  navigate: boolean;
}

export interface AssistantReply {
  answer: string;
  assets: MediaAsset[];
  action: AssistantAction | null;
  engine: string;
}

const CATALOG_LIMIT = 40;
const ALLOWED_HREF = /^\/(media(\/[\w-]+|\?(project=[\w-]+|upload=1))?|search(\?q=[^#\s]*)?|compare(\?project=[\w-]*)?|reports(\?project=[\w-]*(&auto=1)?)?|settings)?$/;

const PAGES: [RegExp, AssistantAction][] = [
  [/\b(upload|add (photos|media|images))\b/i, { href: "/media?upload=1", label: "Upload media", navigate: true }],
  [/\b(media|library|gallery)\b/i, { href: "/media", label: "Media library", navigate: true }],
  [/\b(compare|comparison|before.?and.?after|before.?after)\b/i, { href: "/compare", label: "Compare", navigate: true }],
  [/\breports?\b/i, { href: "/reports", label: "Impact reports", navigate: true }],
  [/\b(settings|projects? list|manage projects)\b/i, { href: "/settings", label: "Settings", navigate: true }],
  [/\b(home|overview|dashboard)\b/i, { href: "/", label: "Overview", navigate: true }],
];

const STOP = new Set("a an the of in on at to for from and or with show me find any all our my we is are was were what which who how many much do does did have has there please can you tell about give list open go".split(" "));

function words(text: string) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
}

function rank(assets: MediaAsset[], question: string) {
  const terms = words(question);
  if (!terms.length) return assets;
  const scored = assets.map((a) => {
    const hay = `${a.title} ${a.project} ${a.location} ${a.category} ${a.activity} ${a.stage} ${a.tags.join(" ")} ${a.impactAreas.join(" ")} ${a.objects.join(" ")}`.toLowerCase();
    return { a, score: terms.reduce((s, t) => s + (hay.includes(t) ? 1 : hay.includes(t.slice(0, -1)) ? 0.5 : 0), 0) };
  });
  return scored.sort((x, y) => y.score - x.score || y.a.date.localeCompare(x.a.date)).filter((s, i) => s.score > 0 || i < 8).map((s) => s.a);
}

function sanitizeAction(action: unknown): AssistantAction | null {
  if (!action || typeof action !== "object") return null;
  const { href, label, navigate } = action as Record<string, unknown>;
  if (typeof href !== "string" || !ALLOWED_HREF.test(href)) return null;
  return { href, label: typeof label === "string" && label.trim() ? label.trim().slice(0, 40) : "Open", navigate: navigate === true };
}

async function context() {
  const [stats, projects, assets, reports] = await Promise.all([orgStats(), projectSummaries(), listAssets(), listReports()]);
  return { stats, projects, assets: assets.filter((a) => a.status === "indexed"), reports };
}

function fallbackAnswer(question: string, ctx: Awaited<ReturnType<typeof context>>): Omit<AssistantReply, "engine"> {
  const q = question.toLowerCase();
  const nav = /\b(open|go to|take me|navigate|show me the|switch to)\b/.test(q) ? PAGES.find(([re]) => re.test(q))?.[1] : undefined;
  if (nav) return { answer: `Opening ${nav.label.toLowerCase()}.`, assets: [], action: nav };

  if (/\bhow many\b|\bcount\b|\btotal\b/.test(q) && /\b(assets?|photos?|images?|media|evidence|videos?)\b/.test(q)) {
    return {
      answer: `You have ${ctx.stats.totalAssets} media assets across ${ctx.projects.length} project${ctx.projects.length === 1 ? "" : "s"}, with ${Math.round(ctx.stats.aiCoverage * 100)}% tagged by AI.`,
      assets: [],
      action: { href: "/media", label: "Media library", navigate: false },
    };
  }
  if (/\bprojects?\b/.test(q) && ctx.projects.length) {
    const top = [...ctx.projects].sort((a, b) => b.totalAssets - a.totalAssets)[0];
    return {
      answer: `There are ${ctx.projects.length} projects. ${top.name} has the most evidence, with ${top.totalAssets} assets.`,
      assets: top.cover ? [top.cover] : [],
      action: { href: `/media?project=${top.slug}`, label: top.name, navigate: false },
    };
  }

  const hits = rank(ctx.assets, question).slice(0, 3);
  if (!hits.length || !words(question).length) {
    return {
      answer: ctx.assets.length
        ? `I couldn't find evidence matching that. Try asking about a project, place or activity, like solar installations or water access.`
        : `Your evidence library is empty. Upload field photos or videos and I can answer questions about them.`,
      assets: [],
      action: ctx.assets.length ? null : { href: "/media?upload=1", label: "Upload media", navigate: false },
    };
  }
  const [first] = hits;
  return {
    answer: `I found ${hits.length === 1 ? "one match" : `${hits.length} strong matches`}. The top result is ${first.title}, ${first.location !== "Unknown" ? `in ${first.location}, ` : ""}captured ${first.date}.`,
    assets: hits,
    action: { href: `/search?q=${encodeURIComponent(question.slice(0, 120))}`, label: "See all results", navigate: false },
  };
}

function navigationCommand(question: string): AssistantAction | null {
  const q = question.toLowerCase().trim();
  if (!/^(please\s+|can you\s+|could you\s+)?(open|go to|go back to|take me to|navigate to|switch to|bring up)\b/.test(q)) return null;
  return PAGES.find(([re]) => re.test(q))?.[1] ?? null;
}

export async function askAssistant(question: string, history: AssistantTurn[]): Promise<AssistantReply> {
  const nav = navigationCommand(question);
  if (nav) return { answer: `Opening ${nav.label.toLowerCase()}.`, assets: [], action: nav, engine: "ImpactLens" };
  const ctx = await context();
  const catalog = rank(ctx.assets, question).slice(0, CATALOG_LIMIT);
  const byId = new Map(ctx.assets.map((a) => [a.id, a]));

  const data = {
    today: new Date().toISOString().slice(0, 10),
    stats: ctx.stats,
    projects: ctx.projects.map((p) => ({ name: p.name, slug: p.slug, region: p.region, category: p.category, assets: p.totalAssets, status: p.status })),
    reports: ctx.reports.slice(0, 10).map((r) => ({ id: r.id, project: r.project, period: r.period.label, generated: r.generatedAt.slice(0, 10) })),
    evidence: catalog.map((a) => ({
      id: a.id,
      title: a.title,
      project: a.project,
      location: a.location,
      category: a.category,
      activity: a.activity,
      stage: a.stage,
      date: a.date,
      tags: a.tags.slice(0, 6),
      impact: a.impactAreas,
      people: a.peopleCount,
    })),
  };

  try {
    const { data: out, engine } = await generateJSON<{ answer?: string; assetIds?: string[]; action?: unknown }>({
      system: [
        "You are ImpactLens Voice, a spoken assistant for a sustainability organisation's field-evidence library.",
        "Answer ONLY from the JSON data provided. Never invent assets, numbers, places or outcomes. If the data does not answer the question, say so briefly and suggest what to ask.",
        "Your answer is read aloud: 1 to 3 short, natural sentences, no markdown, no lists, no IDs, no URLs.",
        "Cite up to 4 relevant evidence ids in assetIds (only ids from the data).",
        "Optionally return action {href,label,navigate}. Allowed hrefs: /, /media, /media?upload=1, /media?project=<slug>, /media/<evidenceId>, /search?q=<url-encoded query>, /compare?project=<slug>, /reports?project=<slug>, /reports?project=<slug>&auto=1 (generates a report), /settings.",
        "Set navigate=true only when the user explicitly asks to open, go to, show a page, upload, or generate something. Otherwise navigate=false.",
        'Respond as JSON: {"answer": string, "assetIds": string[], "action": {"href": string, "label": string, "navigate": boolean} | null}',
      ].join("\n"),
      prompt: [
        history.length ? `Conversation so far:\n${history.slice(-6).map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.text}`).join("\n")}\n` : "",
        `Data:\n${JSON.stringify(data)}`,
        `\nUser question: ${question}`,
      ].join("\n"),
      timeoutMs: 25000,
      budgetMs: 40000,
    });
    const answer = typeof out.answer === "string" ? out.answer.replace(/[*_#`]/g, "").trim() : "";
    if (!answer) throw new Error("empty answer");
    const assets = (Array.isArray(out.assetIds) ? out.assetIds : [])
      .map((id) => byId.get(String(id)))
      .filter((a): a is MediaAsset => !!a)
      .slice(0, 4);
    return { answer: answer.slice(0, 600), assets, action: sanitizeAction(out.action), engine };
  } catch (e) {
    console.warn("[assistant] AI unavailable, using evidence index:", e instanceof Error ? e.message : e);
    return { ...fallbackAnswer(question, ctx), engine: "Evidence index" };
  }
}
