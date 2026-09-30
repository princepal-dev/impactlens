export const MEDIA_VIEWS = ["tiles", "gallery", "list", "timeline"] as const;

export type MediaView = (typeof MEDIA_VIEWS)[number];

export const isMediaView = (v: unknown): v is MediaView => MEDIA_VIEWS.includes(v as MediaView);
