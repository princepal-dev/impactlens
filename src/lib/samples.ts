import type { Project, Stage } from "./types";

/** Projects created in a fresh workspace. Users can add their own from the Overview page. */
export const STARTER_PROJECTS: Project[] = [
  {
    id: "p-rajasthan-water",
    slug: "rajasthan-water-access",
    name: "Rajasthan Water Access",
    category: "Water & Sanitation",
    location: "Jodhpur, Rajasthan",
    region: "Rajasthan, India",
    description:
      "Community water storage, hand pumps, rainwater harvesting and check dams across arid villages in western Rajasthan.",
    status: "Active",
    startDate: "2026-01-10",
  },
  {
    id: "p-delhi-greening",
    slug: "delhi-urban-greening",
    name: "Delhi Urban Greening",
    category: "Environment",
    location: "New Delhi, Delhi",
    region: "Delhi, India",
    description:
      "Restoration of degraded urban land through waste clean-up, segregation infrastructure and community tree plantation.",
    status: "Active",
    startDate: "2026-01-12",
  },
  {
    id: "p-maharashtra-solar",
    slug: "maharashtra-solar-initiative",
    name: "Maharashtra Solar Initiative",
    category: "Renewable Energy",
    location: "Pune, Maharashtra",
    region: "Maharashtra, India",
    description:
      "Rooftop and ground-mounted solar installations for rural schools and community buildings across western Maharashtra.",
    status: "Active",
    startDate: "2026-01-15",
  },
];

/** Projects that exist only to hold the Unsplash sample collection; created on first import. */
export const UNSPLASH_PROJECTS: Project[] = [
  {
    id: "p-goa-coastal-cleanup",
    slug: "goa-coastal-cleanup",
    name: "Goa Coastal Cleanup",
    category: "Environment",
    location: "Calangute, Goa",
    region: "Goa, India",
    description: "Volunteer beach clean-ups, plastic collection and waste bin installation along the North and South Goa coastline.",
    status: "Active",
    startDate: "2026-01-10",
  },
  {
    id: "p-uttarakhand-forest",
    slug: "uttarakhand-forest-restoration",
    name: "Uttarakhand Forest Restoration",
    category: "Environment",
    location: "Dehradun, Uttarakhand",
    region: "Uttarakhand, India",
    description: "Replanting logged and degraded hill slopes with native saplings, followed by survival monitoring.",
    status: "Active",
    startDate: "2026-01-12",
  },
];

export const SAMPLE_PROJECTS = [...STARTER_PROJECTS, ...UNSPLASH_PROJECTS];

export type SampleCollection = "field" | "unsplash";

export interface SampleMedia {
  file: string;
  projectId: string;
  location: string;
  /** Field-log capture date supplied to the AI as uploader metadata. */
  date: string;
  collection: SampleCollection;
  /** Stage recorded in the field log, passed to the AI as uploader metadata. */
  stage?: Stage;
  /** Remote original for samples that are not bundled in public/samples. */
  remoteUrl?: string;
  /** Page crediting the photographer, shown alongside the imported asset. */
  sourceUrl?: string;
}

const PROJECT_BY_PREFIX: Record<string, string> = {
  rj: "p-rajasthan-water",
  dl: "p-delhi-greening",
  mh: "p-maharashtra-solar",
  cg: "p-goa-coastal-cleanup",
  uk: "p-uttarakhand-forest",
};

const unsplash = (photo: string, page: string) => ({
  remoteUrl: `https://images.unsplash.com/${photo}?w=1600&q=80&fm=jpg`,
  sourceUrl: `https://unsplash.com/photos/${page}`,
});

/**
 * Sample field photos bundled in public/samples. Importing them uploads each file to the
 * configured Cloudinary account and runs real AI analysis; only the project, location and
 * capture date below are supplied as uploader context.
 */
const FIELD_SAMPLES = [
  { file: "rj-drought-baseline", location: "Barmer, Rajasthan", date: "2026-01-12" },
  { file: "rj-village-baseline", location: "Phalodi, Rajasthan", date: "2026-01-18" },
  { file: "rj-water-collection", location: "Osian, Rajasthan", date: "2026-01-25" },
  { file: "rj-tank-construction-1", location: "Jodhpur, Rajasthan", date: "2026-03-08" },
  { file: "rj-rwh-pit", location: "Barmer, Rajasthan", date: "2026-03-20" },
  { file: "rj-tank-construction-2", location: "Jodhpur, Rajasthan", date: "2026-04-02" },
  { file: "rj-hand-pump", location: "Osian, Rajasthan", date: "2026-05-22" },
  { file: "rj-tank-completed", location: "Jodhpur, Rajasthan", date: "2026-06-18" },
  { file: "rj-rwh-tank", location: "Phalodi, Rajasthan", date: "2026-07-09" },
  { file: "rj-check-dam", location: "Barmer, Rajasthan", date: "2026-08-14" },
  { file: "rj-school-hand-pump", location: "Jodhpur, Rajasthan", date: "2026-09-05" },
  { file: "dl-dump-baseline-1", location: "Bhalswa, New Delhi", date: "2026-01-15" },
  { file: "dl-dump-baseline-2", location: "Bhalswa, New Delhi", date: "2026-02-03" },
  { file: "dl-segregation-bins", location: "Saket, New Delhi", date: "2026-03-12" },
  { file: "dl-waste-vehicles", location: "New Delhi, Delhi", date: "2026-03-28" },
  { file: "dl-women-saplings", location: "Yamuna Floodplain, Delhi", date: "2026-07-06" },
  { file: "dl-plantation-drive", location: "Dwarka, New Delhi", date: "2026-07-20" },
  { file: "dl-plantation-row", location: "Dwarka, New Delhi", date: "2026-08-02" },
  { file: "dl-urban-garden", location: "Saket, New Delhi", date: "2026-08-25" },
  { file: "dl-restored-path", location: "Lodhi Road, New Delhi", date: "2026-09-10" },
  { file: "dl-canopy", location: "Saket, New Delhi", date: "2026-09-18" },
  { file: "mh-school-baseline", location: "Satara, Maharashtra", date: "2026-01-20" },
  { file: "mh-foundation-works", location: "Baramati, Maharashtra", date: "2026-03-05" },
  { file: "mh-panel-install-1", location: "Satara, Maharashtra", date: "2026-04-10" },
  { file: "mh-panel-install-2", location: "Satara, Maharashtra", date: "2026-04-24" },
  { file: "mh-rooftop-1", location: "Pune, Maharashtra", date: "2026-06-12" },
  { file: "mh-rooftop-2", location: "Pune, Maharashtra", date: "2026-06-30" },
  { file: "mh-solar-array", location: "Nashik, Maharashtra", date: "2026-07-22" },
  { file: "mh-students", location: "Satara, Maharashtra", date: "2026-08-18" },
  { file: "mh-solar-field", location: "Baramati, Maharashtra", date: "2026-09-02" },
].map((s) => ({ ...s, collection: "field" as const }));

/** Before/after clean-up pairs shot from the same spot and angle, for side-by-side comparison. */
const CLEANUP_PAIRS = (
  [
    { file: "cg-shore-before-cleanup", location: "Calangute, Goa", date: "2026-01-24", stage: "baseline" },
    { file: "cg-shore-after-cleanup", location: "Calangute, Goa", date: "2026-08-30", stage: "completed" },
    { file: "dl-yamuna-bank-before-cleanup", location: "Yamuna Ghat, New Delhi", date: "2026-01-30", stage: "baseline" },
    { file: "dl-yamuna-bank-after-cleanup", location: "Yamuna Ghat, New Delhi", date: "2026-09-06", stage: "completed" },
    { file: "rj-stepwell-before-cleanup", location: "Mandore, Jodhpur", date: "2026-02-06", stage: "baseline" },
    { file: "rj-stepwell-after-cleanup", location: "Mandore, Jodhpur", date: "2026-09-14", stage: "completed" },
  ] satisfies Omit<SampleMedia, "projectId" | "collection">[]
).map((s) => ({ ...s, collection: "field" as const }));

/** Free photos from Unsplash (Unsplash License), fetched from the Unsplash CDN at import time. */
const UNSPLASH_SAMPLES = (
  [
    { file: "cg-litter-baseline", location: "Calangute, Goa", date: "2026-01-14", stage: "baseline", ...unsplash("photo-1653959551549-5e2975ed9a87", "R06KuKfdztk") },
    { file: "cg-debris-line", location: "Colva, Goa", date: "2026-01-21", stage: "baseline", ...unsplash("photo-1526951521990-620dc14c214b", "RUqoVelx59I") },
    { file: "cg-plastic-waste", location: "Baga, Goa", date: "2026-02-04", stage: "baseline", ...unsplash("photo-1569254983547-44dc559f038f", "0G2jF-c704s") },
    { file: "cg-bottles-sand", location: "Anjuna, Goa", date: "2026-02-18", stage: "baseline", ...unsplash("photo-1654575810843-05aefab22c6e", "rrWJZKAMY80") },
    { file: "cg-cleanup-drive", location: "Calangute, Goa", date: "2026-03-15", stage: "implementation", ...unsplash("photo-1565803974275-dccd2f933cbb", "PzQNdXw2a6g") },
    { file: "cg-volunteer-team", location: "Colva, Goa", date: "2026-04-05", stage: "implementation", ...unsplash("photo-1617953141905-b27fb1f17d88", "bWAArZ5M4Ag") },
    { file: "cg-collected-plastic", location: "Baga, Goa", date: "2026-04-19", stage: "implementation", ...unsplash("photo-1610093641855-31ffd617a94a", "-h4B4-jzfnw") },
    { file: "cg-driftwood-bottles", location: "Anjuna, Goa", date: "2026-05-10", stage: "implementation", ...unsplash("photo-1554265352-d7fd5129be15", "43upsZNmy9Q") },
    { file: "cg-beach-bins", location: "Calangute, Goa", date: "2026-07-12", stage: "completed", ...unsplash("photo-1677441151910-bcf27db94052", "p4ai663Qgjk") },
    { file: "cg-clean-beach", location: "Calangute, Goa", date: "2026-08-20", stage: "monitoring", ...unsplash("photo-1621258608430-31a035671615", "rckIiF3zzuo") },
    { file: "uk-logged-slope", location: "Tehri, Uttarakhand", date: "2026-01-16", stage: "baseline", ...unsplash("photo-1691093047010-e8893191e548", "LslXl2JdkGs") },
    { file: "uk-stump-clearing", location: "Dehradun, Uttarakhand", date: "2026-01-28", stage: "baseline", ...unsplash("photo-1762079145513-b9b1ab776dbf", "jWWjfR7F0fs") },
    { file: "uk-dead-trees", location: "Chamoli, Uttarakhand", date: "2026-02-10", stage: "baseline", ...unsplash("photo-1752819532070-3306825b0b7d", "7_P4YB0kBWE") },
    { file: "uk-digging-pits", location: "Dehradun, Uttarakhand", date: "2026-03-06", stage: "implementation", ...unsplash("photo-1710361006404-a13d01802ce9", "kGmz87qVQBM") },
    { file: "uk-sapling-planting", location: "Dehradun, Uttarakhand", date: "2026-03-14", stage: "implementation", ...unsplash("photo-1622383563227-04401ab4e5ea", "CbZh3kaPxrE") },
    { file: "uk-volunteer-planting", location: "Tehri, Uttarakhand", date: "2026-03-22", stage: "implementation", ...unsplash("photo-1584062134595-dacde0a2336d", "VV7hvwRzyQ0") },
    { file: "uk-seedling", location: "Mussoorie, Uttarakhand", date: "2026-04-02", stage: "implementation", ...unsplash("photo-1641320201668-1b2bedb4a066", "RMLJ6KF1Zfk") },
    { file: "uk-regrowth", location: "Dehradun, Uttarakhand", date: "2026-06-25", stage: "completed", ...unsplash("photo-1637552481611-1f36222fb188", "Z-5ctVlACa4") },
    { file: "uk-sapling-guard", location: "Mussoorie, Uttarakhand", date: "2026-07-15", stage: "completed", ...unsplash("photo-1591255199673-4e2b706645a2", "SEFaaIjrjZA") },
    { file: "uk-plantation-rows", location: "Tehri, Uttarakhand", date: "2026-08-28", stage: "monitoring", ...unsplash("photo-1724149715970-666e2264759b", "kRtRPB3v9Ts") },
    { file: "uk-young-forest", location: "Chamoli, Uttarakhand", date: "2026-09-12", stage: "monitoring", ...unsplash("photo-1647220576336-f2e94680f3b8", "B3kK0-JAjMU") },
  ] satisfies Omit<SampleMedia, "projectId" | "collection">[]
).map((s) => ({ ...s, collection: "unsplash" as const }));

export const SAMPLES: SampleMedia[] = [...FIELD_SAMPLES, ...CLEANUP_PAIRS, ...UNSPLASH_SAMPLES].map((s) => ({
  ...s,
  projectId: PROJECT_BY_PREFIX[s.file.split("-")[0]],
}));

/** Preferred before/after pairs when the sample evidence has been imported. */
export const DEFAULT_PAIRS: Record<string, [string, string]> = {
  "p-rajasthan-water": ["rj-stepwell-before-cleanup", "rj-stepwell-after-cleanup"],
  "p-delhi-greening": ["dl-yamuna-bank-before-cleanup", "dl-yamuna-bank-after-cleanup"],
  "p-maharashtra-solar": ["mh-school-baseline", "mh-rooftop-1"],
  "p-goa-coastal-cleanup": ["cg-shore-before-cleanup", "cg-shore-after-cleanup"],
  "p-uttarakhand-forest": ["uk-stump-clearing", "uk-regrowth"],
};

/** Engine label for samples indexed from their field-log entry instead of AI analysis. */
export const FIELD_LOG_ENGINE = "Field log";

/** Readable title from a sample file name, e.g. "rj-tank-construction-1" → "Tank construction". */
export const sampleTitle = (file: string) =>
  file
    .replace(/\.\w+$/, "")
    .split("-")
    .slice(1)
    .filter((w) => !/^\d+$/.test(w))
    .join(" ")
    .replace(/^\w/, (c) => c.toUpperCase());
