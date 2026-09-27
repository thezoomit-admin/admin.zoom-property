import { config } from "../config";

/**
 * Fire-and-forget: tell the Next.js frontend to drop its cached data for
 * the given tag(s) so the next visitor gets fresh HTML.
 *
 * This is intentionally `void` — admin saves should never block on the
 * frontend cache being warm. If the ping fails (frontend is down, wrong
 * secret) we log it but don't toast the user.
 */
export async function revalidateFrontend(
  tag: string | string[] = "projects",
): Promise<void> {
  const siteUrl = config.site_url;
  // Secret is shared between frontend .env (REVALIDATE_SECRET) and admin
  const secret =
    (import.meta.env.VITE_PUBLIC_REVALIDATE_SECRET as string) ||
    "dev-revalidate-secret";

  if (!siteUrl) {
    console.warn("[revalidate] skipped — VITE_PUBLIC_SITE_URL is not set");
    return;
  }

  const tags = Array.isArray(tag) ? tag : [tag];

  try {
    const url = new URL("/api/revalidate", siteUrl);
    url.searchParams.set("secret", secret);
    for (const t of tags) url.searchParams.append("tag", t);

    const res = await fetch(url.toString(), { method: "POST" });
    if (!res.ok) {
      console.warn(`[revalidate] ${res.status} — ${await res.text()}`);
    }
  } catch (err) {
    // Network error — frontend might be down; don't break the admin flow
    console.warn("[revalidate] failed:", err);
  }
}
