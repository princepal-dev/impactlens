import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { DEFAULT_PAIRS, FIELD_LOG_ENGINE } from "./samples";
import type { ActivityItem, MediaAsset, Project, ReportContent, WorkspaceSummary } from "./types";

/** Data layer backed by Postgres via Prisma. Every record here comes from a real upload, analysis or report. */

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  region: string;
  description: string;
  status: string;
  startDate: string;
};

const toProject = (r: ProjectRow): Project => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  location: r.location,
  region: r.region,
  description: r.description,
  status: r.status as Project["status"],
  startDate: r.startDate,
});

const json = (v: unknown) => v as Prisma.InputJsonValue;

// ---------- Projects ----------
export async function listProjects(): Promise<Project[]> {
  const rows = await (await db()).project.findMany({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  return rows.map(toProject);
}

export async function getProject(idOrSlugOrName: string | null | undefined): Promise<Project | null> {
  if (!idOrSlugOrName) return null;
  const row = await (await db()).project.findFirst({
    where: {
      OR: [{ id: idOrSlugOrName }, { slug: idOrSlugOrName }, { name: { equals: idOrSlugOrName, mode: "insensitive" } }],
    },
  });
  return row ? toProject(row) : null;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function freeSlug(base: string) {
  let slug = base;
  for (let i = 2; await getProject(slug); i++) slug = `${base}-${i}`;
  return slug;
}

const projectData = (p: Project) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  category: p.category,
  location: p.location,
  region: p.region,
  description: p.description,
  status: p.status,
  startDate: p.startDate,
});

export async function createProject(input: Pick<Project, "name" | "category" | "location" | "region" | "description">): Promise<Project> {
  const project: Project = {
    ...input,
    id: `p-${crypto.randomUUID().slice(0, 8)}`,
    slug: await freeSlug(slugify(input.name) || "project"),
    status: "Active",
    startDate: new Date().toISOString().slice(0, 10),
  };
  await (await db()).project.create({ data: projectData(project) });
  return project;
}

/** Returns the project with this id, recreating it from its definition if it was deleted. */
export async function ensureProject(def: Project): Promise<Project> {
  const existing = await getProject(def.id);
  if (existing) return existing;
  const project = { ...def, slug: await freeSlug(def.slug) };
  await (await db()).project.upsert({ where: { id: def.id }, create: projectData(project), update: {} });
  return project;
}

export async function updateProject(
  id: string,
  input: Partial<Pick<Project, "name" | "category" | "location" | "region" | "description" | "status">>,
) {
  const current = await getProject(id);
  if (!current) return null;
  const next = { ...current, ...input };
  const prisma = await db();
  await prisma.project.update({
    where: { id: current.id },
    data: { name: next.name, category: next.category, location: next.location, region: next.region, description: next.description, status: next.status },
  });
  if (next.name !== current.name || next.category !== current.category) {
    const rows = await prisma.mediaAsset.findMany({ where: { projectId: current.id }, select: { data: true } });
    await prisma.$transaction(
      rows.map((r) => {
        const a = parseAsset(r);
        return prisma.mediaAsset.update({ where: { id: a.id }, data: { data: json({ ...a, project: next.name }) } });
      }),
    );
  }
  return next;
}

/** Deletes a project. Its evidence is kept and becomes unassigned. */
export async function deleteProject(id: string) {
  const p = await getProject(id);
  if (!p) return false;
  const prisma = await db();
  const rows = await prisma.mediaAsset.findMany({ where: { projectId: p.id }, select: { data: true } });
  await prisma.$transaction([
    ...rows.map((r) => {
      const a = parseAsset(r);
      return prisma.mediaAsset.update({ where: { id: a.id }, data: { projectId: null, data: json({ ...a, projectId: null, project: "Unassigned" }) } });
    }),
    prisma.report.updateMany({ where: { projectId: p.id }, data: { projectId: null } }),
    prisma.project.delete({ where: { id: p.id } }),
  ]);
  return true;
}

// ---------- Media assets ----------
const ARRAY_FIELDS = ["tags", "impactAreas", "objects"] as const;

function parseAsset(r: { data: Prisma.JsonValue }): MediaAsset {
  const a = (typeof r.data === "string" ? JSON.parse(r.data) : r.data) as MediaAsset;
  if (!a || typeof a !== "object" || !a.id) throw new Error("asset record is missing its id");
  for (const k of ARRAY_FIELDS) if (!Array.isArray(a[k])) a[k] = [];
  return a;
}

const parseReport = (r: { data: Prisma.JsonValue }) => (typeof r.data === "string" ? JSON.parse(r.data) : r.data) as ReportContent;

/** Parse rows, skipping (and logging) any that are corrupt instead of failing the whole page. */
function parseRows<R, T>(rows: R[], parse: (r: R) => T): T[] {
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

const NEWEST_FIRST = [{ captureDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] satisfies Prisma.MediaAssetOrderByWithRelationInput[];

export async function listAssets(): Promise<MediaAsset[]> {
  const rows = await (await db()).mediaAsset.findMany({ select: { data: true }, orderBy: NEWEST_FIRST });
  return parseRows(rows, parseAsset);
}

export async function getAsset(id: string): Promise<MediaAsset | null> {
  const row = await (await db()).mediaAsset.findUnique({ where: { id }, select: { data: true } });
  return row ? (parseRows([row], parseAsset)[0] ?? null) : null;
}

export async function saveAsset(asset: MediaAsset) {
  const prisma = await db();
  const projectId = asset.projectId && (await prisma.project.count({ where: { id: asset.projectId } })) ? asset.projectId : null;
  const columns = {
    projectId,
    cloudinaryPublicId: asset.cloudinaryPublicId,
    secureUrl: asset.secureUrl,
    status: asset.status,
    captureDate: asset.date || null,
    data: json(asset),
  };
  await prisma.mediaAsset.upsert({
    where: { id: asset.id },
    create: { id: asset.id, createdAt: asset.createdAt, ...columns },
    update: columns,
  });
  return asset;
}

export async function deleteAsset(id: string) {
  const { count } = await (await db()).mediaAsset.deleteMany({ where: { id } });
  return count > 0;
}

export async function projectAssets(projectId: string) {
  const p = await getProject(projectId);
  if (!p) return [];
  const rows = await (await db()).mediaAsset.findMany({ where: { projectId: p.id }, select: { data: true }, orderBy: NEWEST_FIRST });
  return parseRows(rows, parseAsset);
}

/** Analyses left "analyzing" this long were cut off (e.g. a serverless timeout); surface them for retry. */
const STALE_ANALYSIS_MS = 10 * 60_000;

export async function recoverStaleAnalyses() {
  const prisma = await db();
  const rows = await prisma.mediaAsset.findMany({
    where: { status: "analyzing", updatedAt: { lt: new Date(Date.now() - STALE_ANALYSIS_MS) } },
    select: { data: true },
  });
  for (const a of parseRows(rows, parseAsset)) {
    const status = a.analyzedAt ? "indexed" : "analysis_failed";
    await prisma.mediaAsset.update({ where: { id: a.id }, data: { status, data: json({ ...a, status }) } });
  }
  if (rows.length) console.warn(`[store] recovered ${rows.length} interrupted analyses`);
  return rows.length;
}

// ---------- Activity ----------
export async function addActivity(item: Omit<ActivityItem, "id" | "at">) {
  await (await db()).activity.create({
    data: { id: crypto.randomUUID(), type: item.type, message: item.message, href: item.href ?? null },
  });
}

export async function listActivity(limit = 7): Promise<ActivityItem[]> {
  const rows = await (await db()).activity.findMany({ orderBy: { at: "desc" }, take: limit });
  return rows.map((r) => ({ id: r.id, type: r.type as ActivityItem["type"], message: r.message, at: r.at.toISOString(), href: r.href ?? undefined }));
}

// ---------- Reports ----------
export async function saveReport(r: ReportContent) {
  const prisma = await db();
  const projectId = (await prisma.project.count({ where: { id: r.projectId } })) ? r.projectId : null;
  await prisma.report.upsert({
    where: { id: r.id },
    create: { id: r.id, projectId, createdAt: r.generatedAt, data: json(r) },
    update: { projectId, createdAt: r.generatedAt, data: json(r) },
  });
  return r;
}

export async function listReports(): Promise<ReportContent[]> {
  const rows = await (await db()).report.findMany({ select: { data: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return parseRows(rows, parseReport);
}

export async function getReport(id: string) {
  const row = await (await db()).report.findUnique({ where: { id }, select: { data: true } });
  return row ? (parseRows([row], parseReport)[0] ?? null) : null;
}

export async function deleteReport(id: string) {
  const { count } = await (await db()).report.deleteMany({ where: { id } });
  return count > 0;
}

// ---------- Aggregates ----------
export async function orgStats() {
  const [assets, reports] = await Promise.all([listAssets(), (await db()).report.count()]);
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
  const [assets, projects] = await Promise.all([listAssets(), listProjects()]);
  return projects.map((p) => {
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
