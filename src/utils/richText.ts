import {
  translateToBanglaApi,
  translateToEnglishApi,
} from "../components/Common/LangInput";

/**
 * The description field, in both directions.
 *
 * The API stores a description as an array of paragraphs; the editor wants one
 * HTML string. These four helpers are what sits between them, and they live
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

/**
 * Walks the tree translating text nodes to Bangla, so the markup the editor
 * produced survives the trip.
 */
const translateNodeTextToBangla = async (node: Node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      const translated = await translateToBanglaApi(text);
      node.textContent = translated;
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    for (const child of Array.from(node.childNodes)) {
      await translateNodeTextToBangla(child);
    }
  }
};

/**
 * Walks the tree translating text nodes to English.
 */
const translateNodeTextToEnglish = async (node: Node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      const translated = await translateToEnglishApi(text);
      node.textContent = translated;
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    for (const child of Array.from(node.childNodes)) {
      await translateNodeTextToEnglish(child);
    }
  }
};

/** Translates rich text to Bangla, keeping the formatting intact. */
export const translateRichTextToBangla = async (
  html: string
): Promise<string> => {
  if (!html || !html.trim()) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  await translateNodeTextToBangla(tempDiv);
  return tempDiv.innerHTML || (await translateToBanglaApi(html));
};

/** Translates rich text to English, keeping the formatting intact. */
export const translateRichTextToEnglish = async (
  html: string
): Promise<string> => {
  if (!html || !html.trim()) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  await translateNodeTextToEnglish(tempDiv);
  return tempDiv.innerHTML || (await translateToEnglishApi(html));
};

/** True when the editor holds nothing a translator could work with. */
export const isEmptyRichText = (html?: string) =>
  !html || !html.trim() || html === "<p><br></p>" || html === "<p></p>";
