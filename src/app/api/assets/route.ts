import { listAssets } from "@/lib/store";

export async function GET(req: Request) {
  const project = new URL(req.url).searchParams.get("projectId");
  const assets = await listAssets();
  return Response.json(project ? assets.filter((a) => a.projectId === project) : assets);
}
