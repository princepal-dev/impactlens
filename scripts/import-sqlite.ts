/**
 * One-time copy of a local SQLite workspace (the pre-Postgres storage) into the Postgres database.
 * Usage: npm run db:import-sqlite [-- path/to/impactlens.db]
 * Existing Postgres rows with the same id are overwritten; nothing is deleted.
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";

config({ path: [".env.local", ".env"], quiet: true });

const file = process.argv[2] ?? ".data/impactlens.db";
if (!existsSync(file)) throw new Error(`SQLite file not found: ${file}`);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const sqlite = new DatabaseSync(file, { readOnly: true });
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const rows = <T>(sql: string) => sqlite.prepare(sql).all() as T[];

type ProjectRow = { id: string; slug: string; name: string; category: string; location: string; region: string; description: string; status: string; start_date: string; created_at: string };
type AssetRow = { id: string; project_id: string | null; cloudinary_public_id: string; secure_url: string; status: string; capture_date: string | null; created_at: string; data: string };
type ReportRow = { id: string; project_id: string | null; created_at: string; data: string };
type ActivityRow = { id: string; type: string; message: string; href: string | null; at: string };

async function main() {
  const projects = rows<ProjectRow>("SELECT * FROM projects ORDER BY created_at, rowid");
  for (const [i, p] of projects.entries()) {
    const data = {
      slug: p.slug,
      name: p.name,
      category: p.category,
      location: p.location,
      region: p.region,
      description: p.description,
      status: p.status,
      startDate: p.start_date,
      createdAt: new Date(new Date(p.created_at).getTime() + i),
    };
    await prisma.project.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
  }

  const projectIds = new Set(projects.map((p) => p.id));
  const owner = (id: string | null) => (id && projectIds.has(id) ? id : null);

  const assets = rows<AssetRow>("SELECT * FROM media_assets");
  for (const a of assets) {
    const data = {
      projectId: owner(a.project_id),
      cloudinaryPublicId: a.cloudinary_public_id,
      secureUrl: a.secure_url,
      status: a.status,
      captureDate: a.capture_date,
      createdAt: a.created_at,
      data: JSON.parse(a.data) as Prisma.InputJsonValue,
    };
    await prisma.mediaAsset.upsert({ where: { id: a.id }, create: { id: a.id, ...data }, update: data });
  }

  const reports = rows<ReportRow>("SELECT * FROM reports");
  for (const r of reports) {
    const data = { projectId: owner(r.project_id), createdAt: r.created_at, data: JSON.parse(r.data) as Prisma.InputJsonValue };
    await prisma.report.upsert({ where: { id: r.id }, create: { id: r.id, ...data }, update: data });
  }

  const activity = rows<ActivityRow>("SELECT * FROM activity");
  await prisma.activity.createMany({
    data: activity.map((a) => ({ id: a.id, type: a.type, message: a.message, href: a.href, at: new Date(a.at) })),
    skipDuplicates: true,
  });

  console.log(`Imported ${projects.length} projects, ${assets.length} assets, ${reports.length} reports, ${activity.length} activity entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
