export type ResourceType = "image" | "video";
export type Stage = "baseline" | "implementation" | "completed" | "monitoring";
export type ProcessingStatus = "uploaded" | "analyzing" | "indexed" | "analysis_failed";

/** Structured metadata produced by the AI vision analysis. */
export interface AIMetadata {
  title: string;
  description: string;
  project: string;
  location: string;
  category: string;
  activity: string;
  tags: string[];
  impactAreas: string[];
  peopleCount: number | null;
  objects: string[];
  stage: Stage;
  confidence: number;
  date: string;
  beforeAfterCandidate: boolean;
}

/** Original source reference. Never discarded once created. */
export interface CloudinaryRef {
  cloudinaryPublicId: string;
  secureUrl: string;
  resourceType: ResourceType;
  format: string;
  width: number;
  height: number;
  bytes?: number;
  createdAt: string;
  storage: "cloudinary";
  originalFilename?: string;
  /** Capture date read from EXIF (YYYY-MM-DD) when the file carries one. */
  exifDate?: string;
  /** Public page for media that came from a third-party library such as Unsplash. */
  sourceUrl?: string;
}

export interface MediaAsset extends CloudinaryRef, AIMetadata {
  id: string;
  projectId: string | null;
  status: ProcessingStatus;
  analysisEngine: string;
  analyzedAt?: string;
  /** Set when a person has corrected the metadata after analysis. */
  editedAt?: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  region: string;
  description: string;
  status: "Active" | "Completed" | "Monitoring";
  startDate: string;
}

export interface ActivityItem {
  id: string;
  type: "analysis" | "project" | "comparison" | "report" | "tags" | "upload";
  message: string;
  at: string;
  href?: string;
}

export interface SearchInterpretation {
  category?: string;
  location?: string;
  project?: string;
  activity?: string;
  stage?: Stage;
  dateAfter?: string;
  dateBefore?: string;
  beforeAfter?: boolean;
  keywords: string[];
}

export interface SearchResult {
  asset: MediaAsset;
  relevance: number;
  matched: string[];
}

export interface SearchResponse {
  query: string;
  interpretation: SearchInterpretation;
  results: SearchResult[];
  diagnostics: {
    interpreter: string;
    ranking: string;
    scanned: number;
    filtersApplied: string[];
    relaxed: boolean;
    ms: number;
  };
}

export interface ComparisonResult {
  beforeId: string;
  afterId: string;
  summary: string;
  observations: string[];
  impactAreas: string[];
  confidence: number;
  caveats: string[];
  engine: string;
}

export interface ReportContent {
  id: string;
  projectId: string;
  project: string;
  title: string;
  period: { from: string; to: string; label: string };
  generatedAt: string;
  engine: string;
  summary: string;
  overview: {
    location: string;
    category: string;
    assetCount: number;
    imageCount: number;
    videoCount: number;
    coverage: string;
    stages: Record<string, number>;
  };
  timeline: { label: string; month: string; count: number; highlight: string; assetIds: string[] }[];
  comparison: { beforeId: string; afterId: string; observations: string[] } | null;
  impactAreas: { name: string; evidenceCount: number; note: string }[];
  observations: string[];
  patterns: string[];
  potentialImpact: string[];
  verificationNotes: string[];
  evidenceIds: string[];
}
