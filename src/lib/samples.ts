import type { Project } from "./types";

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

export interface SampleMedia {
  file: string;
  projectId: string;
  location: string;
  /** Field-log capture date supplied to the AI as uploader metadata. */
  date: string;
}

const PROJECT_BY_PREFIX: Record<string, string> = {
  rj: "p-rajasthan-water",
  dl: "p-delhi-greening",
  mh: "p-maharashtra-solar",
};

/**
 * Sample field photos bundled in public/samples. Importing them uploads each file to the
 * configured Cloudinary account and runs real AI analysis; only the project, location and
 * capture date below are supplied as uploader context.
 */
export const SAMPLES: SampleMedia[] = [
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
].map((s) => ({ ...s, projectId: PROJECT_BY_PREFIX[s.file.split("-")[0]] }));

/** Preferred before/after pairs when the sample evidence has been imported. */
export const DEFAULT_PAIRS: Record<string, [string, string]> = {
  "p-rajasthan-water": ["rj-tank-construction-1", "rj-tank-completed"],
  "p-delhi-greening": ["dl-dump-baseline-1", "dl-restored-path"],
  "p-maharashtra-solar": ["mh-school-baseline", "mh-rooftop-1"],
};
