import { searchEvidence } from "@/lib/search";

export async function POST(req: Request) {
  const { query } = (await req.json().catch(() => ({}))) as { query?: string };
  if (!query?.trim()) return Response.json({ error: "Enter a question about your evidence." }, { status: 400 });
  try {
    return Response.json(await searchEvidence(query.trim().slice(0, 300)));
  } catch (e) {
    console.error("[search]", e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
