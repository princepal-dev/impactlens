import { errorResponse, readBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { searchEvidence } from "@/lib/search";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { query } = await readBody<{ query: string }>(req);
  if (typeof query !== "string" || !query.trim()) return Response.json({ error: "Enter a question about your evidence." }, { status: 400 });
  const limited = rateLimit(req, "search", 40);
  if (limited) return limited;
  try {
    return Response.json(await searchEvidence(query.trim().slice(0, 300)));
  } catch (e) {
    return errorResponse("search", e, "Search failed. Please try again.");
  }
}
