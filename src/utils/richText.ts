/**
 * The description field.
 *
 * The API stores a description as an array of paragraphs; the editor wants one
 * HTML string. These helpers are what sits between them, and they live
 * here because the listing form and the project form both need them — a second
 * copy is how the two screens end up disagreeing about what an empty
 * description looks like.
 */

/** API array (or legacy string) to the single HTML string the editor holds. */
export const normalizeDescriptionForEditor = (desc?: string[] | string) => {
  if (!desc) return "";
  if (typeof desc === "string") return desc;
  if (Array.isArray(desc)) {
    return desc
      .map((p) => (p.trim().startsWith("<") ? p : `<p>${p}</p>`))
      .join("");
  }
  return "";
};

/** Editor HTML back to the array the API expects. */
export const toDescriptionArray = (value?: string) => {
  if (!value || !value.trim()) return [];
  return [value.trim()];
};

/** True when the editor holds no content. */
export const isEmptyRichText = (html?: string) =>
  !html || !html.trim() || html === "<p><br></p>" || html === "<p></p>";
