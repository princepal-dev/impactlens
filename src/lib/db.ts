import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { config, NotConfiguredError } from "./config";
import { STARTER_PROJECTS } from "./samples";

const g = globalThis as unknown as { __impactlensPrisma?: PrismaClient; __impactlensSeeded?: Promise<void> };

function client(): PrismaClient {
  if (g.__impactlensPrisma) return g.__impactlensPrisma;
  if (!config.databaseUrl) {
    throw new NotConfiguredError("DATABASE_URL is not set", "The workspace database is temporarily unavailable. Please try again shortly.");
  }
  // Serverless instances each hold their own pool, so keep it small.
  const adapter = new PrismaPg({ connectionString: config.databaseUrl, max: 5 });
  g.__impactlensPrisma = new PrismaClient({ adapter });
  return g.__impactlensPrisma;
}

/** Creates the starter projects the first time a workspace is used. */
async function seed(prisma: PrismaClient) {
  if ((await prisma.project.count()) > 0) return;
  const base = Date.now();
  await prisma.project.createMany({
    data: STARTER_PROJECTS.map((p, i) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      location: p.location,
      region: p.region,
      description: p.description,
      status: p.status,
      startDate: p.startDate,
      createdAt: new Date(base + i),
    })),
    skipDuplicates: true,
  });
}

/** Prisma client for the workspace database, seeded on first use. */
export async function db(): Promise<PrismaClient> {
  const prisma = client();
  g.__impactlensSeeded ??= seed(prisma).catch((e) => {
    g.__impactlensSeeded = undefined;
    throw e;
  });
  await g.__impactlensSeeded;
  return prisma;
}
