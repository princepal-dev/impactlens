#!/usr/bin/env node
/**
 * Uploads the bundled demo evidence in public/demo to Cloudinary and records
 * the resulting delivery URLs in src/data/cloudinary-seed.json. Once written,
 * seeded assets are served (and transformed) by Cloudinary instead of /public.
 *
 * Usage: npm run seed:cloudinary
 * Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 */
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { v2 as cloudinary } from "cloudinary";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path.join(root, file));
  } catch {}
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Missing Cloudinary credentials. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.",
  );
  process.exit(1);
}
cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

const PROJECT_BY_PREFIX = {
  rj: "rajasthan-water-access",
  dl: "delhi-urban-greening",
  mh: "maharashtra-solar-initiative",
};

const demoDir = path.join(root, "public", "demo");
const outFile = path.join(root, "src", "data", "cloudinary-seed.json");
const files = (await readdir(demoDir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();

const seed = {};
let failed = 0;
for (const file of files) {
  const name = file.replace(/\.[^.]+$/, "");
  const slug = PROJECT_BY_PREFIX[name.split("-")[0]];
  if (!slug) continue;
  const publicId = `impactlens/demo/${slug}/${name}`;
  try {
    const res = await cloudinary.uploader.upload(path.join(demoDir, file), {
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
      tags: ["impactlens", "impactlens-demo", slug],
      context: { project: slug, source: "impactlens-seed" },
    });
    seed[publicId] = {
      secureUrl: res.secure_url,
      width: res.width,
      height: res.height,
      format: res.format,
      createdAt: res.created_at,
    };
    console.log(`✓ ${publicId}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${publicId}: ${err?.message ?? err}`);
  }
}

await writeFile(outFile, JSON.stringify(seed, null, 2) + "\n");
console.log(`\nWrote ${Object.keys(seed).length} Cloudinary assets to src/data/cloudinary-seed.json${failed ? ` (${failed} failed)` : ""}.`);
console.log("Restart the dev server so seeded evidence is delivered from Cloudinary.");
