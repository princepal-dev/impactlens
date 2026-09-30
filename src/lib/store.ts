import "server-only";
import { db } from "./db";
import { DEFAULT_PAIRS, FIELD_LOG_ENGINE } from "./samples";
import type { ActivityItem, MediaAsset, Project, ReportContent, WorkspaceSummary } from "./types";

/** Data layer backed by SQLite. Every record here comes from a real upload, analysis or report. */

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  region: string;
  description: string;
  status: Project["status"];
  start_date: string;
};

const toProject = (r: ProjectRow): Project => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  location: r.location,
  region: r.region,
  description: r.description,
  status: r.status,
  startDate: r.start_date,
});

// ---------- Projects ----------
export function listProjects(): Project[] {
  return (db().prepare("SELECT * FROM projects ORDER BY created_at, rowid").all() as ProjectRow[]).map(toProject);
}

export function getProject(idOrSlugOrName: string | null | undefined): Project | null {
  if (!idOrSlugOrName) return null;
  const row = db()
    .prepare("SELECT * FROM projects WHERE id = ? OR slug = ? OR lower(name) = lower(?) LIMIT 1")
    .get(idOrSlugOrName, idOrSlugOrName, idOrSlugOrName) as ProjectRow | undefined;
  return row ? toProject(row) : null;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function createProject(input: Pick<Project, "name" | "category" | "location" | "region" | "description">): Project {
  const base = slugify(input.name) || "project";
  let slug = base;
  for (let i = 2; getProject(slug); i++) slug = `${base}-${i}`;
  const project: Project = {
    ...input,
    id: `p-${crypto.randomUUID().slice(0, 8)}`,
    slug,
    status: "Active",
    startDate: new Date().toISOString().slice(0, 10),
  };
  db()
    .prepare(
      "INSERT INTO projects (id, slug, name, category, location, region, description, status, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(project.id, project.slug, project.name, project.category, project.location, project.region, project.description, project.status, project.startDate);
  return project;
}

/** Returns the project with this id, recreating it from its definition if it was deleted. */
export function ensureProject(def: Project): Project {
  const existing = getProject(def.id);
  if (existing) return existing;
  let slug = def.slug;
  for (let i = 2; getProject(slug); i++) slug = `${def.slug}-${i}`;
  db()
    .prepare(
      "INSERT INTO projects (id, slug, name, category, location, region, description, status, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(def.id, slug, def.name, def.category, def.location, def.region, def.description, def.status, def.startDate);
  return { ...def, slug };
}

export function updateProject(id: string, input: Partial<Pick<Project, "name" | "category" | "location" | "region" | "description" | "status">>) {
  const current = getProject(id);
  if (!current) return null;
  const next = { ...current, ...input };
  db()
    .prepare("UPDATE projects SET name = ?, category = ?, location = ?, region = ?, description = ?, status = ? WHERE id = ?")
    .run(next.name, next.category, next.location, next.region, next.description, next.status, current.id);
  if (next.name !== current.name || next.category !== current.category) {
    const rows = db().prepare("SELECT data FROM media_assets WHERE project_id = ?").all(current.id) as { data: string }[];
    const update = db().prepare("UPDATE media_assets SET data = ? WHERE id = ?");
    for (const r of rows) {
      const a = parseAsset(r);
      update.run(JSON.stringify({ ...a, project: next.name }), a.id);
    }
  }
  return next;
}

/** Deletes a project. Its evidence is kept and becomes unassigned. */
export function deleteProject(id: string) {
  const p = getProject(id);
  if (!p) return false;
  const rows = db().prepare("SELECT data FROM media_assets WHERE project_id = ?").all(p.id) as { data: string }[];
  const update = db().prepare("UPDATE media_assets SET project_id = NULL, data = ? WHERE id = ?");
  for (const r of rows) {
    const a = parseAsset(r);
    update.run(JSON.stringify({ ...a, projectId: null, project: "Unassigned" }), a.id);
  }
  db().prepare("UPDATE reports SET project_id = NULL WHERE project_id = ?").run(p.id);
  db().prepare("DELETE FROM projects WHERE id = ?").run(p.id);
  return true;
}

// ---------- Media assets ----------
const ARRAY_FIELDS = ["tags", "impactAreas", "objects"] as const;

function parseAsset(r: { data: string }): MediaAsset {
  const a = JSON.parse(r.data) as MediaAsset;
  for (const k of ARRAY_FIELDS) if (!Array.isArray(a[k])) a[k] = [];
  return a;
}

/** Parse rows, skipping (and logging) any that are corrupt instead of failing the whole page. */
function parseRows<T>(rows: { data: string }[], parse: (r: { data: string }) => T): T[] {
  const out: T[] = [];
  for (const r of rows) {
    try {
      out.push(parse(r));
    } catch (e) {
      console.error("[store] skipping unreadable row:", e instanceof Error ? e.message : e);
    }
  }
  return out;
}

export async function listAssets(): Promise<MediaAsset[]> {
  return parseRows(db().prepare("SELECT data FROM media_assets ORDER BY capture_date DESC, created_at DESC").all() as { data: string }[], parseAsset);
}

export async function getAsset(id: string): Promise<MediaAsset | null> {
  const row = db().prepare("SELECT data FROM media_assets WHERE id = ?").get(id) as { data: string } | undefined;
  return row ? (parseRows([row], parseAsset)[0] ?? null) : null;
}

export async function saveAsset(asset: MediaAsset) {
  db()
    .prepare(
      `INSERT INTO media_assets (id, project_id, cloudinary_public_id, secure_url, status, capture_date, created_at, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET project_id = excluded.project_id, cloudinary_public_id = excluded.cloudinary_public_id,
         secure_url = excluded.secure_url, status = excluded.status, capture_date = excluded.capture_date, data = excluded.data`,
    )
    .run(
      asset.id,
      asset.projectId && getProject(asset.projectId) ? asset.projectId : null,
      asset.cloudinaryPublicId,
      asset.secureUrl,
      asset.status,
      asset.date || null,
      asset.createdAt,
      JSON.stringify(asset),
    );
  return asset;
}

export async function deleteAsset(id: string) {
  return db().prepare("DELETE FROM media_assets WHERE id = ?").run(id).changes > 0;
}

export async function projectAssets(projectId: string) {
  const p = getProject(projectId);
  if (!p) return [];
  return parseRows(db().prepare("SELECT data FROM media_assets WHERE project_id = ? ORDER BY capture_date DESC").all(p.id) as { data: string }[], parseAsset);
}

// ---------- Activity ----------
export async function addActivity(item: Omit<ActivityItem, "id" | "at">) {
  db()
    .prepare("INSERT INTO activity (id, type, message, href, at) VALUES (?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), item.type, item.message, item.href ?? null, new Date().toISOString());
}

export async function listActivity(limit = 7): Promise<ActivityItem[]> {
  const rows = db().prepare("SELECT * FROM activity ORDER BY at DESC LIMIT ?").all(limit) as {
    id: string;
    type: ActivityItem["type"];
    message: string;
    href: string | null;
    at: string;
  }[];
  return rows.map((r) => ({ id: r.id, type: r.type, message: r.message, at: r.at, href: r.href ?? undefined }));
}

// ---------- Reports ----------
export async function saveReport(r: ReportContent) {
  db()
    .prepare("INSERT OR REPLACE INTO reports (id, project_id, created_at, data) VALUES (?, ?, ?, ?)")
    .run(r.id, getProject(r.projectId) ? r.projectId : null, r.generatedAt, JSON.stringify(r));
  return r;
}

export async function listReports(): Promise<ReportContent[]> {
  return parseRows(db().prepare("SELECT data FROM reports ORDER BY created_at DESC LIMIT 50").all() as { data: string }[], (r) => JSON.parse(r.data) as ReportContent);
}

export async function getReport(id: string) {
  const row = db().prepare("SELECT data FROM reports WHERE id = ?").get(id) as { data: string } | undefined;
  return row ? (parseRows([row], (r) => JSON.parse(r.data) as ReportContent)[0] ?? null) : null;
}

export async function deleteReport(id: string) {
  return db().prepare("DELETE FROM reports WHERE id = ?").run(id).changes > 0;
}

// ---------- Aggregates ----------
export async function orgStats() {
  const assets = await listAssets();
  const { n: reports } = db().prepare("SELECT COUNT(*) AS n FROM reports").get() as { n: number };
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const aiIndexed = assets.filter((a) => a.status === "indexed" && a.analysisEngine !== "Manual tagging" && a.analysisEngine !== FIELD_LOG_ENGINE).length;
  const sites = new Set(assets.filter((a) => a.location && a.location !== "Unknown").map((a) => a.location.toLowerCase()));
  return {
    totalAssets: assets.length,
    addedThisWeek: assets.filter((a) => a.createdAt >= weekAgo).length,
    fieldSites: sites.size,
    reports,
    aiCoverage: assets.length ? aiIndexed / assets.length : 0,
  };
}

export async function workspaceSummary(): Promise<WorkspaceSummary> {
  const [s, projects] = await Promise.all([orgStats(), projectSummaries()]);
  return {
    assets: s.totalAssets,
    reports: s.reports,
    projects: projects.length,
    projectList: projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      count: p.totalAssets,
      cover: p.cover ? { secureUrl: p.cover.secureUrl, resourceType: p.cover.resourceType } : null,
    })),
  };
}

export async function projectSummaries() {
  const assets = await listAssets();
  return listProjects().map((p) => {
    const list = assets.filter((a) => a.projectId === p.id);
    return {
      ...p,
      totalAssets: list.length,
      cover:
        list.find((a) => a.id === DEFAULT_PAIRS[p.id]?.[1]) ??
        list.find((a) => a.stage === "completed" && a.resourceType === "image") ??
        list[0] ??
        null,
      lastUpdated: list.reduce((m, a) => (a.createdAt > m ? a.createdAt : m), ""),
    };
  });
}
