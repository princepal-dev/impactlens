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

const SCHEMA_VERSION = 1;

const g = globalThis as unknown as { __impactlensSqlite?: DatabaseSync };

/** Anything left "analyzing" when the process started was interrupted; surface it for retry. */
function recoverInterrupted(conn: DatabaseSync) {
  const rows = conn.prepare("SELECT id, data FROM media_assets WHERE status = 'analyzing'").all() as { id: string; data: string }[];
  if (!rows.length) return;
  const update = conn.prepare("UPDATE media_assets SET status = 'analysis_failed', data = ? WHERE id = ?");
  for (const r of rows) {
    try {
      const a = JSON.parse(r.data);
      const status = a.analyzedAt ? "indexed" : "analysis_failed";
      conn.prepare("UPDATE media_assets SET status = ?, data = ? WHERE id = ?").run(status, JSON.stringify({ ...a, status }), r.id);
    } catch {
      update.run(r.data, r.id);
    }
  }
  console.warn(`[db] recovered ${rows.length} interrupted analyses`);
}

export function db(): DatabaseSync {
  if (g.__impactlensSqlite) return g.__impactlensSqlite;
  mkdirSync(path.dirname(config.databasePath), { recursive: true });
  const conn = new DatabaseSync(config.databasePath);
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;");
  conn.exec(SCHEMA);
  const { user_version } = conn.prepare("PRAGMA user_version").get() as { user_version: number };
  if (user_version < SCHEMA_VERSION) conn.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  recoverInterrupted(conn);

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
