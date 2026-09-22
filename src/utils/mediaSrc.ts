import { config } from "../config";

type MediaLike = { url?: string; key?: string; _id?: string } | string | null | undefined;

/** Cloudflare R2 public bucket — where uploaded media keys actually resolve. */
const R2_PUBLIC_FALLBACK = "https://pub-fe014e73b16347aab5e799483354b483.r2.dev";

/** Bare Mongo ObjectIds are not file keys — don't build a fake R2 URL. */
const isMongoObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value.trim());

/**
 * Prefer R2 for object keys. `image_access_url` used to point at
 * `api…/uploads`, which 404s for every key and breaks admin previews.
 */
const mediaBase = () => {
  const configured = String(config.image_access_url || "").replace(/\/+$/, "");
  if (!configured) return R2_PUBLIC_FALLBACK;
  // Legacy misconfig: API /uploads is not where R2 keys live.
  if (/\/uploads$/i.test(configured) || /api\.zoompropertyltd\.com$/i.test(configured)) {
    return R2_PUBLIC_FALLBACK;
  }
  return configured;
};

/**
 * Where a populated media document's file actually lives.
 */
export const mediaSrc = (media: MediaLike): string => {
  if (!media) return "";
  if (typeof media === "string") {
    if (!media.trim()) return "";
    if (/^(https?:)?\/\//i.test(media)) return media;
    if (isMongoObjectId(media)) return "";
    const base = mediaBase();
    return `${base}/${media.replace(/^\/+/, "")}`;
  }
  if (media.url && typeof media.url === "string" && media.url.trim()) {
    return media.url;
  }
  const key = media.key;
  if (!key) return "";
  if (/^(https?:)?\/\//i.test(key)) return key;
  if (isMongoObjectId(key)) return "";
  const base = mediaBase();
  return `${base}/${key.replace(/^\/+/, "")}`;
};

export default mediaSrc;
