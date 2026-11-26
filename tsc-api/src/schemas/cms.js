import { z } from "zod";
import { sanitizeMultiline, sanitizeText } from "../lib/sanitize.js";
import {
  isSafeHref,
  isSafeImageUrl,
  isSafeInternalPath,
} from "../lib/sanitize.js";

const MAX_SECTIONS = 80;
const MAX_SECTION_JSON = 512 * 1024;

const SECTION_TYPES = [
  "home_hero",
  "rich_text",
  "services_intro",
  "services_board",
  "support_list",
  "areas_strip",
  "approach_steps",
  "difference_block",
  "brand_circle",
  "home_reviews",
  "home_contact",
  "page_hero",
  "page_cta_band",
  "hiring_letter",
  "hiring_must",
  "hiring_benefits",
  "hiring_role",
  "hiring_provided",
  "news_masthead",
  "cards",
  "team",
  "news",
  "split",
  "cta",
  "faq",
];

function scrubValue(value, depth = 0) {
  if (depth > 8) return null;
  if (value == null) return value;
  if (typeof value === "string") {
    let s = sanitizeMultiline(value, { max: 20000 });
    if (isSafeHref(s) || isSafeImageUrl(s) || isSafeInternalPath(s)) {
      return s;
    }
    if (/^(javascript|data|vbscript|file):/i.test(s)) return "";
    return s;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 200).map((v) => scrubValue(v, depth + 1));
  }
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value).slice(0, 80)) {
      const key = sanitizeText(k, { max: 80 });
      if (!key) continue;
      out[key] = scrubValue(v, depth + 1);
    }
    return out;
  }
  return null;
}

const sectionSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    type: z.string().trim().max(64),
    fields: z.record(z.any()).default({}),
  })
  .passthrough()
  .transform((section) => {
    const type = SECTION_TYPES.includes(section.type)
      ? section.type
      : sanitizeText(section.type, { max: 64 });
    return {
      ...section,
      id: sanitizeText(section.id, { max: 64 }),
      type,
      fields: scrubValue(section.fields) || {},
    };
  });

export const cmsSectionsSchema = z
  .array(sectionSchema)
  .max(MAX_SECTIONS)
  .superRefine((sections, ctx) => {
    const size = JSON.stringify(sections).length;
    if (size > MAX_SECTION_JSON) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "sections_too_large",
      });
    }
  });
