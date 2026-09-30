# ImpactLens

**AI-powered impact & sustainability media intelligence.** ImpactLens turns raw field photos and videos into structured, searchable, traceable evidence. Originals are stored and transformed by Cloudinary, analyzed by Gemini vision, indexed in SQLite and compiled into impact reports that link every claim back to the original media.

Upload → Cloudinary → AI analyze → Auto-tag → Search → Compare → Generate report → Trace back to original evidence.

## Setup

Requires Node.js 22.13+ (uses the built-in `node:sqlite`).

```bash
npm install
cp .env.example .env.local   # add your Cloudinary + Gemini keys
npm run dev                  # http://localhost:3000
```

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | [Cloudinary console](https://console.cloudinary.com/) → Settings → API Keys |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) (free tier works) |
| `OPENROUTER_API_KEY` (optional) | [OpenRouter](https://openrouter.ai/keys) — free vision models, used automatically when Gemini/OpenAI fail, or on its own |
| `DATABASE_PATH` (optional) | Defaults to `.data/impactlens.db` |

AI providers are tried in order — Gemini, OpenAI, then OpenRouter free models — with retries per provider; a provider whose key is rejected is skipped for 10 minutes. Without storage or any AI key, upload/analysis endpoints return `503` with a neutral message and the missing variables are logged server-side. `GET /api/health` reports database, storage and AI status.

## Getting evidence in

- **Upload** field photos or videos on **Media Library** (JPG, PNG, WEBP, MP4, MOV, ≤100 MB). Optionally assign a project and site location — both are passed to the AI as uploader context. Capture dates come from EXIF when present.
- **Import from Cloudinary** by pasting a delivery URL; the original public ID is preserved.
- **Import sample evidence** (Overview or Settings): uploads 30 bundled photos from three Indian projects to your Cloudinary account and runs real Gemini analysis on each. Only project, site and capture date are supplied; titles, descriptions, tags, stages and impact areas are generated from the pixels.
- **New Project** on the Overview creates additional projects.

If analysis fails (rate limit, network), the asset stays in Cloudinary and can be retried or tagged manually from its evidence page.

## Cloudinary usage

- Originals are uploaded untouched (signed `upload_stream` with `image_metadata`, or unsigned preset).
- Thumbnails: `c_fill,g_auto,w_640,h_420,f_auto,q_auto` (smart crop keeps the subject).
- Display: `c_limit,w_1600,f_auto,q_auto`; videos get a generated poster frame (`so_1`) and `q_auto,f_auto:video` delivery.
- AI analysis receives a Cloudinary-derived frame (`c_limit,w_1024,f_jpg`, or `so_2` for video) — never a re-upload.
- Every evidence record lists its public ID, original URL and derived transformations for traceability.

## API

| Route | Purpose |
| --- | --- |
| `POST /api/upload` | multipart `file` (+ `projectId`, `location`) or JSON `{ url, projectId, location }` → pending asset in Cloudinary |
| `POST /api/analyze` | `{ assetId }` → Gemini metadata (schema-normalized); `{ assetId, metadata }` saves manual tags |
| `POST /api/search` | `{ query }` → natural-language evidence search with query interpretation |
| `POST /api/compare` | `{ beforeId, afterId }` → two-image visual change analysis |
| `POST /api/report` / `GET /api/report?id=` | generate / fetch impact reports |
| `GET/POST /api/projects` | list / create projects |
| `GET/POST /api/samples` | sample import status / import one sample |

## Demo walkthrough (2 minutes)

1. **Overview** — KPIs computed from indexed evidence, recent activity, projects.
2. **Media Library** — drop a field photo, watch it upload to Cloudinary, get analyzed and indexed. **Open evidence** shows the traceability chain: AI insight → evidence record → Cloudinary asset → original media.
3. **Evidence Search** — *"Show me water infrastructure projects in Rajasthan"*. Note the query interpretation and relevance scores.
4. **Compare** — pick a project, drag the before/after slider, read Gemini's comparison of the two frames.
5. **Impact Reports** — generate a report; every section cites source evidence. **Export Report** prints a clean PDF.

## Responsible AI

The analysis prompt only describes what is visible. ImpactLens never invents beneficiary counts, litres, tonnes or kWh; reports use cautious wording ("visual evidence suggests…") and flag that outcomes beyond the media require additional verification.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Radix UI · Lucide · Cloudinary · Gemini (or OpenAI) · SQLite (`node:sqlite`)

Sample images: Wikimedia Commons contributors.
