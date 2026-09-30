-- ImpactLens optional persistence (Supabase / Postgres).
-- The app runs without a database; when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
-- are set, uploaded evidence is written to media_assets via PostgREST.

create table if not exists projects (
  id text primary key,
  slug text unique not null,
  name text not null,
  category text,
  location text,
  region text,
  description text,
  status text default 'Active',
  start_date date,
  created_at timestamptz default now()
);

insert into projects (id, slug, name, category, location, region, start_date) values
  ('p-rajasthan-water', 'rajasthan-water-access', 'Rajasthan Water Access', 'Water & Sanitation', 'Jodhpur, Rajasthan', 'Rajasthan, India', '2026-01-10'),
  ('p-delhi-greening', 'delhi-urban-greening', 'Delhi Urban Greening', 'Environment', 'New Delhi, Delhi', 'Delhi, India', '2026-01-12'),
  ('p-maharashtra-solar', 'maharashtra-solar-initiative', 'Maharashtra Solar Initiative', 'Renewable Energy', 'Pune, Maharashtra', 'Maharashtra, India', '2026-01-15')
on conflict (id) do nothing;

create table if not exists media_assets (
  id text primary key,
  project_id text references projects(id),
  cloudinary_public_id text not null,
  secure_url text not null,
  resource_type text,
  format text,
  width integer,
  height integer,
  bytes bigint,
  storage text default 'cloudinary',
  original_filename text,
  title text,
  description text,
  project text,
  location text,
  category text,
  activity text,
  tags text[] default '{}',
  impact_areas text[] default '{}',
  objects text[] default '{}',
  people_count integer,
  stage text,
  confidence numeric,
  capture_date date,
  before_after_candidate boolean default false,
  status text default 'indexed',
  analysis_engine text,
  analyzed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists media_assets_project_idx on media_assets (project_id);
create index if not exists media_assets_tags_idx on media_assets using gin (tags);

create table if not exists reports (
  id text primary key,
  project_id text references projects(id),
  title text,
  date_from date,
  date_to date,
  content jsonb not null,
  created_at timestamptz default now()
);
