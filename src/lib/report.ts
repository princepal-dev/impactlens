import "server-only";
import { generateJSON } from "./ai";
import { UserError } from "./api";
import { aiProvider } from "./config";
import { metadataCompare, pickPair } from "./compare";
import { DEFAULT_PAIRS } from "./samples";
import { getProject, projectAssets, saveReport, addActivity } from "./store";
import type { MediaAsset, ReportContent } from "./types";

const MONTH = (d: string) =>
  new Date(`${d.slice(0, 7)}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

const count = <T extends string>(list: T[]) =>
  list.filter((k) => k && k.trim()).reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});

const strings = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim()).slice(0, max) : [];

const top = (m: Record<string, number>, n: number) =>
  Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);

export async function buildReport(opts: { projectId: string; from: string; to: string }): Promise<ReportContent> {
  const project = await getProject(opts.projectId);
  if (!project) throw new UserError("Project not found.", 404);

  const all = await projectAssets(project.id);
  const assets = all
    .filter((a) => a.status === "indexed" && (!a.date || (a.date >= opts.from && a.date <= opts.to)))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!assets.length) throw new UserError("No analyzed evidence found for this project and period.", 422);

  const stages = count(assets.map((a) => a.stage));
  const activities = top(count(assets.map((a) => a.activity.toLowerCase())), 4);
  const impact = count(assets.flatMap((a) => a.impactAreas));
  const locations = top(count(assets.map((a) => a.location.split(",")[0])), 4);

  // Timeline — group by month, keep the highest-confidence frame as highlight.
  const byMonth = new Map<string, MediaAsset[]>();
  for (const a of assets) {
    const k = a.date.slice(0, 7);
    byMonth.set(k, [...(byMonth.get(k) ?? []), a]);
  }
  const timeline = [...byMonth.entries()].map(([month, list]) => {
    const best = [...list].sort((a, b) => b.confidence - a.confidence)[0];
    return { label: MONTH(`${month}-01`), month, count: list.length, highlight: best.title, assetIds: list.slice(0, 3).map((a) => a.id) };
  });

  const pair = pickPair(assets, DEFAULT_PAIRS[project.id]);
  const comparison = pair ? metadataCompare(pair[0], pair[1]) : null;

  const evidence = [...assets]
    .sort((a, b) => b.confidence - a.confidence)
    .filter((a, i, arr) => arr.findIndex((x) => x.activity === a.activity) === i || i < 3)
    .slice(0, 6)
    .sort((a, b) => a.date.localeCompare(b.date));

  const periodLabel = `${MONTH(opts.from)} — ${MONTH(opts.to)}`;
  const coverageMonths = byMonth.size;

  const delivered = top(count(assets.filter((a) => a.stage !== "baseline").map((a) => a.activity.toLowerCase())), 3);
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] ?? "");
  let summary = `Field evidence collected between ${MONTH(opts.from)} and ${MONTH(opts.to)} documents the implementation of ${project.category.toLowerCase()} work${
    locations.length ? ` across ${list(locations)}` : ""
  } (${project.region.split(",")[0]}). The ${assets.length} uploaded media assets provide visual evidence of ${
    delivered.length ? list(delivered) : "project activity"
  }, progressing from ${
    stages.baseline ? "baseline site conditions" : "early implementation"
  } to ${stages.completed || stages.monitoring ? "completed and operational project areas" : "ongoing activity"}. Outcomes beyond what is visible in the media require additional verification.`;

  let observations = [
    ...(comparison?.observations.slice(0, 3) ?? []),
    `${stages.completed ?? 0} assets show completed works and ${stages.monitoring ?? 0} document post-completion monitoring.`,
  ];
  const signals = top(count(assets.flatMap((a) => a.tags)), 5);
  let patterns = [
    `Evidence spans ${coverageMonths} of the months in the reporting period, with the densest documentation in ${timeline.slice().sort((a, b) => b.count - a.count)[0].label}.`,
    ...(activities.length ? [`Most frequently documented activities: ${activities.slice(0, 3).join(", ")}.`] : []),
    ...(signals.length ? [`Recurring visual signals: ${signals.join(", ")}.`] : []),
  ];
  let potentialImpact = top(impact, 3).map(
    (k) => `Potential contribution to ${k.toLowerCase()}, based on ${impact[k]} assets tagged with this impact area.`,
  );
  const verificationNotes = [
    "Impact outcomes (beneficiaries, volumes, energy output) are not measurable from imagery and should be verified with field records.",
    ...(assets.some((a) => a.confidence < 0.86) ? [`${assets.filter((a) => a.confidence < 0.86).length} assets have AI confidence below 86% and should be manually reviewed.`] : []),
    ...(assets.some((a) => a.peopleCount == null) ? ["People counts are only recorded where reasonably visible."] : []),
    "Site locations come from uploader-supplied metadata or visible context, not verified GPS coordinates.",
  ];

  let engine = "Template narrative (AI unavailable)";
  if (aiProvider()) {
    try {
      const facts = assets.slice(-200).map((a) => `${a.date} | ${a.location} | ${a.stage} | ${a.title} | ${a.description}`).join("\n");
      const { data: ai, engine: aiEngine } = await generateJSON<{ summary: string; observations: string[]; patterns: string[]; potentialImpact: string[] }>({
        system:
          "You write concise, credible impact evidence reports for NGOs. Use ONLY the supplied media metadata. Never invent statistics, beneficiary numbers, volumes, percentages or outcomes. Use wording like 'The uploaded evidence shows', 'Visual evidence suggests', 'Potential impact', 'Additional verification recommended'. Return JSON only.",
        prompt: `Project: ${project.name} (${project.category}, ${project.region})
Reporting period: ${periodLabel}
Media metadata (date | location | stage | title | description):
${facts}

Return { "summary": string (3 sentences max), "observations": string[] (3-4), "patterns": string[] (2-3), "potentialImpact": string[] (2-3) }`,
        timeoutMs: 25000,
        budgetMs: 70_000,
      });
      if (typeof ai.summary === "string" && ai.summary.trim()) summary = ai.summary.trim();
      const aiObservations = strings(ai.observations, 5);
      const aiPatterns = strings(ai.patterns, 4);
      const aiImpact = strings(ai.potentialImpact, 4);
      if (aiObservations.length) observations = aiObservations;
      if (aiPatterns.length) patterns = aiPatterns;
      if (aiImpact.length) potentialImpact = aiImpact;
      engine = aiEngine;
    } catch (e) {
      console.warn("[report] AI narrative failed, using template", e);
    }
  }

  const report: ReportContent = {
    id: crypto.randomUUID().slice(0, 8),
    projectId: project.id,
    project: project.name,
    title: "Impact Evidence Report",
    period: { from: opts.from, to: opts.to, label: periodLabel },
    generatedAt: new Date().toISOString(),
    engine,
    summary,
    overview: {
      location: project.region,
      category: project.category,
      assetCount: assets.length,
      imageCount: assets.filter((a) => a.resourceType === "image").length,
      videoCount: assets.filter((a) => a.resourceType === "video").length,
      coverage: `${coverageMonths} months · ${locations.length} sites`,
      stages,
    },
    timeline,
    comparison: comparison ? { beforeId: comparison.beforeId, afterId: comparison.afterId, observations: comparison.observations.slice(0, 4) } : null,
    impactAreas: top(impact, 4).map((name) => ({
      name,
      evidenceCount: impact[name],
      note: `Identified in ${impact[name]} of ${assets.length} assets`,
    })),
    observations,
    patterns,
    potentialImpact,
    verificationNotes,
    evidenceIds: evidence.map((a) => a.id),
  };

  await saveReport(report);
  await addActivity({ type: "report", message: `Impact report generated for "${project.name}"`, href: `/reports?id=${report.id}` });
  return report;
}
