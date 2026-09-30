import type { CloudinaryRef } from "./types";

type Ref = Pick<CloudinaryRef, "secureUrl" | "resourceType">;

/** Insert a Cloudinary transformation right after `/upload/` in a delivery URL. */
function withTransform(url: string, transformation: string, ext?: string) {
  const i = url.indexOf("/upload/");
  if (i === -1) return url;
  let out = `${url.slice(0, i + 8)}${transformation}/${url.slice(i + 8)}`;
  if (ext) out = out.replace(/\.[a-z0-9]+(\?.*)?$/i, `.${ext}`);
  return out;
}

export const TRANSFORMS = {
  thumb: (w: number, h: number) => `c_fill,g_auto,w_${w},h_${h},f_auto,q_auto`,
  display: "c_limit,w_1600,f_auto,q_auto",
  poster: (w: number, h: number) => `so_50p,c_fill,g_auto,w_${w},h_${h},q_auto`,
  video: "q_auto,f_auto:video",
  analysisImage: "c_limit,w_1024,f_jpg,q_auto",
  analysisVideo: "so_50p,c_limit,w_1024",
};

export function thumbUrl(a: Ref, w = 640, h = 420) {
  if (a.resourceType === "video") return withTransform(a.secureUrl, TRANSFORMS.poster(w, h), "jpg");
  return withTransform(a.secureUrl, TRANSFORMS.thumb(w, h));
}

/** Width-bounded still that keeps the original aspect ratio (for masonry layouts). */
export function naturalUrl(a: Ref, w = 720) {
  if (a.resourceType === "video") return withTransform(a.secureUrl, `so_50p,c_limit,w_${w},q_auto`, "jpg");
  return withTransform(a.secureUrl, `c_limit,w_${w},f_auto,q_auto`);
}

export function displayUrl(a: Ref) {
  return withTransform(a.secureUrl, a.resourceType === "video" ? TRANSFORMS.video : TRANSFORMS.display);
}

/** Frame used for AI analysis (images: downsized JPEG; videos: extracted still). */
export function analysisFrameUrl(a: Ref) {
  if (a.resourceType === "video") return withTransform(a.secureUrl, TRANSFORMS.analysisVideo, "jpg");
  return withTransform(a.secureUrl, TRANSFORMS.analysisImage);
}

export function derivedAssets(a: Ref) {
  const list = [{ label: "Original", transformation: "none", url: a.secureUrl }];
  if (a.resourceType === "video") {
    list.push(
      { label: "Optimized playback", transformation: TRANSFORMS.video, url: displayUrl(a) },
      { label: "Poster frame", transformation: TRANSFORMS.poster(640, 420), url: thumbUrl(a) },
      { label: "AI analysis frame", transformation: TRANSFORMS.analysisVideo, url: analysisFrameUrl(a) },
    );
  } else {
    list.push(
      { label: "Card thumbnail", transformation: TRANSFORMS.thumb(640, 420), url: thumbUrl(a) },
      { label: "Responsive display", transformation: TRANSFORMS.display, url: displayUrl(a) },
      { label: "AI analysis frame", transformation: TRANSFORMS.analysisImage, url: analysisFrameUrl(a) },
    );
  }
  return list;
}
