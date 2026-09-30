import { errorResponse, readBody } from "@/lib/api";
import { askAssistant, type AssistantTurn } from "@/lib/assistant";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { question, history } = await readBody<{ question: string; history?: AssistantTurn[] }>(req);
  if (typeof question !== "string" || !question.trim()) return Response.json({ error: "Ask a question about your evidence." }, { status: 400 });
  const limited = rateLimit(req, "assistant", 30);
  if (limited) return limited;
  const turns = (Array.isArray(history) ? history : [])
    .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.text === "string")
    .slice(-6)
    .map((t) => ({ role: t.role, text: t.text.slice(0, 500) }));
  try {
    return Response.json(await askAssistant(question.trim().slice(0, 400), turns));
  } catch (e) {
    return errorResponse("assistant", e, "The assistant is unavailable right now. Please try again.");
  }
}
