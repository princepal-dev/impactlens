import { errorResponse } from "@/lib/api";
import { addActivity, createProject, getProject, listProjects } from "@/lib/store";

const CATEGORIES = ["Water & Sanitation", "Environment", "Renewable Energy", "Infrastructure", "Community", "Other"];

export async function GET() {
  return Response.json(listProjects());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, string | undefined>;
  const name = body.name?.trim();
  const location = body.location?.trim();
  if (!name || !location) return Response.json({ error: "Project name and location are required." }, { status: 400 });
  if (getProject(name)) return Response.json({ error: "A project with this name already exists." }, { status: 409 });
  const category = CATEGORIES.includes(body.category ?? "") ? body.category! : "Other";
  const state = location.split(",").at(-1)?.trim() ?? location;
  try {
    const project = createProject({
      name: name.slice(0, 80),
      category,
      location: location.slice(0, 80),
      region: body.region?.trim() || `${state}, India`,
      description: body.description?.trim().slice(0, 400) ?? "",
    });
    await addActivity({ type: "project", message: `Project "${project.name}" created`, href: `/media?project=${project.slug}` });
    return Response.json(project);
  } catch (e) {
    return errorResponse("projects", e, "Could not create project");
  }
}
