import { config } from "../config";

type MediaLike = { url?: string; key?: string; _id?: string } | string | null | undefined;

const R2_PUBLIC_FALLBACK = "https://pub-5b52277bf86041a0b4872bee7a979553.r2.dev";

/** Bare Mongo ObjectIds are not file keys — don't build a fake R2 URL. */
const isMongoObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value.trim());

/**
 * Where a populated media document's file actually lives.
 */
export const mediaSrc = (media: MediaLike): string => {
  if (!media) return "";
  if (typeof media === "string") {
    if (!media.trim()) return "";
    if (/^(https?:)?\/\//i.test(media)) return media;
    if (isMongoObjectId(media)) return "";
    const base = String(config.image_access_url || R2_PUBLIC_FALLBACK).replace(/\/+$/, "");
    return `${base}/${media.replace(/^\/+/, "")}`;
  }
  if (media.url && typeof media.url === "string" && media.url.trim()) {
    return media.url;
  }
  const key = media.key;
  if (!key) return "";
  if (/^(https?:)?\/\//i.test(key)) return key;
  if (isMongoObjectId(key)) return "";
  const base = String(config.image_access_url || R2_PUBLIC_FALLBACK).replace(/\/+$/, "");
  return `${base}/${key.replace(/^\/+/, "")}`;
};

export default mediaSrc;
