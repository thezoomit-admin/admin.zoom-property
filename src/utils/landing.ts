import { config } from "../config";

/** Public path for a project campaign landing, from the CMS path field. */
export function landingHref(path?: string | null) {
  const clean = String(path || "")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
  if (!clean) return "";
  if (clean === "zoomalzahara") return "/zoomalzahara";
  return `/p/${clean}`;
}

/** Absolute URL on the public site (Bengali by default — the live desk). */
export function publicLandingUrl(path?: string | null, locale = "bn") {
  const href = landingHref(path);
  if (!href) return "";
  const base = String(config.site_url || "https://zoompropertyltd.com").replace(
    /\/+$/,
    "",
  );
  return `${base}/${locale}${href}`;
}

/** Public project details page, `/bn/projects/:slug`. */
export function publicProjectUrl(slug?: string | null, locale = "bn") {
  const clean = String(slug || "")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
  if (!clean) return "";
  const base = String(config.site_url || "https://zoompropertyltd.com").replace(
    /\/+$/,
    "",
  );
  return `${base}/${locale}/projects/${clean}`;
}
