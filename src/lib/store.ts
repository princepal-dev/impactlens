import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { config, dataBackend } from "./config";
import { DEFAULT_PAIRS, ORG_BASELINE, PROJECTS, SEED_ACTIVITY, SEED_ASSETS } from "./seed";
import type { ActivityItem, MediaAsset, Project, ReportContent } from "./types";

/**
 * Data layer. Seeded demo evidence is always present; user uploads, reports and
 * activity are persisted to Supabase when configured, otherwise to a local JSON file.
 */

interface LocalDB {
  assets: MediaAsset[];
  reports: ReportContent[];
  activity: ActivityItem[];
}

const DB_FILE = path.join(process.cwd(), ".data", "db.json");
const g = globalThis as unknown as { __impactlensDB?: LocalDB };

async function load(): Promise<LocalDB> {
  if (g.__impactlensDB) return g.__impactlensDB;
  try {
    g.__impactlensDB = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as LocalDB;
  } catch {
    g.__impactlensDB = { assets: [], reports: [], activity: [] };
  }
  return g.__impactlensDB;
}

async function persist() {
  if (!g.__impactlensDB) return;
  try {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(g.__impactlensDB, null, 2));
  } catch (e) {
    console.warn("[store] could not persist local db", e);
  }
}

// ---------- Supabase (PostgREST) ----------
const sb = async (pathname: string, init?: RequestInit) => {
  const res = await fetch(`${config.supabase.url}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: config.supabase.key,
      Authorization: `Bearer ${config.supabase.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
};

const toRow = (a: MediaAsset) => ({
  id: a.id,
  project_id: a.projectId,
  cloudinary_public_id: a.cloudinaryPublicId,
  secure_url: a.secureUrl,
  resource_type: a.resourceType,
  format: a.format,
  width: a.width,
  height: a.height,
  bytes: a.bytes ?? null,
  storage: a.storage,
  original_filename: a.originalFilename ?? null,
  title: a.title,
  description: a.description,
  project: a.project,
  location: a.location,
  category: a.category,
  activity: a.activity,
  tags: a.tags,
  impact_areas: a.impactAreas,
  objects: a.objects,
  people_count: a.peopleCount,
  stage: a.stage,
  confidence: a.confidence,
  capture_date: a.date || null,
  before_after_candidate: a.beforeAfterCandidate,
  status: a.status,
  analysis_engine: a.analysisEngine,
  analyzed_at: a.analyzedAt ?? null,
  created_at: a.createdAt,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromRow = (r: any): MediaAsset => ({
  id: r.id,
  projectId: r.project_id,
  cloudinaryPublicId: r.cloudinary_public_id,
  secureUrl: r.secure_url,
  resourceType: r.resource_type,
  format: r.format ?? "",
  width: r.width ?? 0,
  height: r.height ?? 0,
  bytes: r.bytes ?? undefined,
  storage: r.storage ?? "cloudinary",
  originalFilename: r.original_filename ?? undefined,
  createdAt: r.created_at,
  title: r.title ?? "",
  description: r.description ?? "",
  project: r.project ?? "",
  location: r.location ?? "",
  category: r.category ?? "",
  activity: r.activity ?? "",
  tags: r.tags ?? [],
  impactAreas: r.impact_areas ?? [],
  objects: r.objects ?? [],
  peopleCount: r.people_count,
  stage: r.stage ?? "implementation",
  confidence: Number(r.confidence ?? 0),
  date: r.capture_date ?? "",
  beforeAfterCandidate: !!r.before_after_candidate,
  status: r.status ?? "indexed",
  analysisEngine: r.analysis_engine ?? "",
  analyzedAt: r.analyzed_at ?? undefined,
});

async function userAssets(): Promise<MediaAsset[]> {
  if (dataBackend() === "supabase") {
    try {
      return ((await sb("media_assets?select=*&order=created_at.desc")) as unknown[]).map(fromRow);
    } catch (e) {
      console.warn("[store] supabase read failed, using local store", e);
    }
  }
  return (await load()).assets;
}

// ---------- Public API ----------
export async function listAssets(): Promise<MediaAsset[]> {
  const mine = await userAssets();
  const seeded = [...SEED_ASSETS].sort((a, b) => b.date.localeCompare(a.date));
  return [...mine, ...seeded];
}

export async function getAsset(id: string) {
  return (await listAssets()).find((a) => a.id === id) ?? null;
}

export async function saveAsset(asset: MediaAsset) {
  if (dataBackend() === "supabase") {
    try {
      await sb("media_assets?on_conflict=id", { method: "POST", body: JSON.stringify(toRow(asset)) });
      return asset;
    } catch (e) {
      console.warn("[store] supabase write failed, using local store", e);
    }
  }
  const db = await load();
  const i = db.assets.findIndex((a) => a.id === asset.id);
  if (i >= 0) db.assets[i] = asset;
  else db.assets.unshift(asset);
  await persist();
  return asset;
}

export function listProjects() {
  return PROJECTS;
}

export function getProject(idOrSlugOrName: string): (Project & { archivedAssets: number }) | null {
  const k = idOrSlugOrName.toLowerCase();
  return PROJECTS.find((p) => p.id === k || p.slug === k || p.name.toLowerCase() === k) ?? null;
}

export async function projectAssets(projectId: string) {
  const p = getProject(projectId);
  if (!p) return [];
  return (await listAssets()).filter((a) => a.projectId === p.id || a.project === p.name);
}

export async function addActivity(item: Omit<ActivityItem, "id" | "at">) {
  const db = await load();
  db.activity.unshift({ ...item, id: crypto.randomUUID(), at: new Date().toISOString() });
  db.activity = db.activity.slice(0, 30);
  await persist();
}

export async function listActivity() {
  const db = await load();
  return [...db.activity, ...SEED_ACTIVITY].slice(0, 7);
}

export async function saveReport(r: ReportContent) {
  const db = await load();
  db.reports.unshift(r);
  db.reports = db.reports.slice(0, 25);
  await persist();
  return r;
}

export async function listReports() {
  return (await load()).reports;
}

export async function getReport(id: string) {
  return (await load()).reports.find((r) => r.id === id) ?? null;
}

export async function orgStats() {
  const assets = await listAssets();
  const reports = await listReports();
  const mine = assets.filter((a) => !SEED_ASSETS.includes(a));
  return {
    totalAssets: ORG_BASELINE.otherAssets + PROJECTS.reduce((s, p) => s + p.archivedAssets, 0) + assets.length,
    fieldSites: ORG_BASELINE.fieldSites,
    reports: ORG_BASELINE.reports + reports.length,
    aiCoverage: ORG_BASELINE.aiCoverage,
    uploadedThisSession: mine.length,
  };
}

export async function projectSummaries() {
  const assets = await listAssets();
  return PROJECTS.map((p) => {
    const list = assets.filter((a) => a.projectId === p.id || a.project === p.name);
    return {
      ...p,
      liveAssets: list.length,
      totalAssets: p.archivedAssets + list.length,
      cover: list.find((a) => a.id === DEFAULT_PAIRS[p.id]?.[1]) ?? list.find((a) => a.stage === "completed") ?? list[0] ?? null,
      lastUpdated: list.reduce((m, a) => (a.date > m ? a.date : m), ""),
    };
  });
}
