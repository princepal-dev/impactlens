import "server-only";
import { mkdirSync } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config";
import { STARTER_PROJECTS } from "./samples";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  start_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  cloudinary_public_id TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  status TEXT NOT NULL,
  capture_date TEXT,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS media_assets_project ON media_assets(project_id);
CREATE INDEX IF NOT EXISTS media_assets_created ON media_assets(created_at);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  href TEXT,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS activity_at ON activity(at);
`;

const g = globalThis as unknown as { __impactlensSqlite?: DatabaseSync };

export function db(): DatabaseSync {
  if (g.__impactlensSqlite) return g.__impactlensSqlite;
  mkdirSync(path.dirname(config.databasePath), { recursive: true });
  const conn = new DatabaseSync(config.databasePath);
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  conn.exec(SCHEMA);

  const { n } = conn.prepare("SELECT COUNT(*) AS n FROM projects").get() as { n: number };
  if (n === 0) {
    const insert = conn.prepare(
      "INSERT INTO projects (id, slug, name, category, location, region, description, status, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const p of STARTER_PROJECTS) {
      insert.run(p.id, p.slug, p.name, p.category, p.location, p.region, p.description, p.status, p.startDate);
    }
  }
  g.__impactlensSqlite = conn;
  return conn;
}
