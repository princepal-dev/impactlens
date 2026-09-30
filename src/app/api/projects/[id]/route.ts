import { readStrings } from "@/lib/api";
import { addActivity, deleteProject, getProject, updateProject } from "@/lib/store";
import type { Project } from "@/lib/types";

const CATEGORIES = ["Water & Sanitation", "Environment", "Renewable Energy", "Infrastructure", "Community", "Other"];
const STATUSES: Project["status"][] = ["Active", "Completed", "Monitoring"];

export async function PATCH(req: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const { id } = await ctx.params;
  if (!getProject(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const body = await readStrings(req);
  const name = body.name?.trim();
  if (name) {
    const clash = getProject(name);
    if (clash && clash.id !== id) return Response.json({ error: "A project with this name already exists." }, { status: 409 });
  }
  const project = updateProject(id, {
    ...(name ? { name: name.slice(0, 80) } : {}),
    ...(body.category && CATEGORIES.includes(body.category) ? { category: body.category } : {}),
    ...(body.location?.trim() ? { location: body.location.trim().slice(0, 80) } : {}),
    ...(body.region?.trim() ? { region: body.region.trim().slice(0, 80) } : {}),
    ...(body.description !== undefined ? { description: body.description.trim().slice(0, 400) } : {}),
    ...(body.status && STATUSES.includes(body.status as Project["status"]) ? { status: body.status as Project["status"] } : {}),
  });
  return Response.json(project);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const { id } = await ctx.params;
  const project = getProject(id);
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  deleteProject(project.id);
  await addActivity({ type: "project", message: `Project "${project.name}" deleted`, href: "/settings" });
  return Response.json({ ok: true });
}
