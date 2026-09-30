# ImpactLens

**AI-powered impact & sustainability media intelligence.** ImpactLens turns raw field photos and videos into structured, searchable, traceable evidence — stored and transformed by Cloudinary, analyzed by AI, and compiled into impact reports that link every claim back to the original media.

Upload → Cloudinary → AI analyze → Auto-tag → Search → Compare → Generate report → Trace back to original evidence.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

No credentials are required. Without keys the app runs in **demo mode**: uploads are stored locally in `.data/`, and analysis uses a deterministic metadata engine (it reads filenames and project context, not pixels). 30 pre-analyzed evidence records across three Indian projects are always available.

## Enabling real integrations

Copy `.env.example` to `.env.local`, then restart the dev server.

| Capability | Variables |
| --- | --- |
| Cloudinary storage + transformations | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` plus either `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (signed, also enables URL import) or `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (unsigned) |
| AI vision analysis | `GEMINI_API_KEY` (default `gemini-2.5-flash`) or `OPENAI_API_KEY` (default `gpt-4o-mini`) |
| Persistence | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — run `supabase/schema.sql` first |
| Force demo mode | `DEMO_MODE=true` |

To serve the seeded demo evidence from your own Cloudinary account (so every card shows real `f_auto,q_auto,g_auto` delivery URLs):

```bash
npm run seed:cloudinary
```

This uploads `public/demo/*.jpg` as `impactlens/demo/<project>/<file>` and writes `src/data/cloudinary-seed.json`. The Settings page shows which integrations are live.

## Cloudinary usage

- Originals are uploaded untouched (signed `upload_stream`, unsigned preset, or remote URL import).
- Thumbnails: `c_fill,g_auto,w_640,h_420,f_auto,q_auto` (smart crop keeps the subject).
- Display: `c_limit,w_1600,f_auto,q_auto`; videos get a generated poster frame (`so_1`) and `q_auto,f_auto:video` delivery.
- AI analysis receives a Cloudinary-derived frame (`c_limit,w_1024,f_jpg`) — never a re-upload.
- Every evidence record lists its public ID, original URL and derived transformations for traceability.

## API

| Route | Purpose |
| --- | --- |
| `POST /api/upload` | multipart file or `{ url, projectId }` import → pending asset |
| `POST /api/analyze` | `{ assetId }` → AI metadata (schema-validated); `{ assetId, metadata }` for manual tagging |
| `GET /api/search?q=` | natural-language evidence search with query interpretation |
| `POST /api/compare` | `{ beforeId, afterId }` → visual-change insights |
| `POST /api/report` / `GET /api/report?id=` | generate / fetch impact reports |

## 2-minute demo script

1. **Overview** (`/`) — portfolio KPIs, recent activity, three active projects.
2. **Media Library** (`/media`) — drop a photo (e.g. `borewell_handpump_osian.jpg`). Watch it upload, get analyzed and indexed with tags, stage, location and impact areas. Click **Open evidence** to see the traceability chain: AI insight → evidence record → Cloudinary asset → original media.
3. **Evidence Search** (`/search`) — try *"Show me water infrastructure projects in Rajasthan"*. Note the query interpretation (location, category, concepts) and relevance scores.
4. **Compare** (`/compare`) — pick Rajasthan Water Access, drag the before/after slider, read the AI comparison insights.
5. **Impact Reports** (`/reports`) — generate a report for Rajasthan Water Access. Every section cites source evidence; **Export Report** prints a clean PDF.

## Responsible AI

The analysis prompt only describes what is visible. ImpactLens never invents beneficiary counts, litres, tonnes or kWh; reports use cautious wording ("visual evidence suggests…") and flag that outcomes beyond the media require additional verification.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Radix/shadcn-style UI · Lucide · Cloudinary · Gemini / OpenAI (optional) · Supabase (optional)

Demo images: Wikimedia Commons contributors (used as illustrative field media).
