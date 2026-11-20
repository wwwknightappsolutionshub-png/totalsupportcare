import { z } from "zod";
import {
  isPhoneLike,
  isSafeHref,
  isSafeImageUrl,
  sanitizeMultiline,
  sanitizeText,
} from "../lib/sanitize.js";

export const CONTACT_INTERESTS = [
  "domiciliary",
  "dementia",
  "eol",
  "respite",
  "careers",
  "other",
  // Pack / marketplace enquiry types
  "quote",
  "cleaning",
  "moving",
  "general",
];

const text = (max) =>
  z
    .string()
    .transform((v) => sanitizeText(v, { max }))
    .pipe(z.string().min(1).max(max));

const optionalText = (max) =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => sanitizeText(v ?? "", { max }));

const multiline = (max, { min = 1 } = {}) =>
  z
    .string()
    .transform((v) => sanitizeMultiline(v, { max }))
    .pipe(z.string().min(min).max(max));

export const emailField = z
  .string()
  .trim()
  .email()
  .max(200)
  .transform((v) => v.toLowerCase());

export const phoneField = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => sanitizeText(v ?? "", { max: 40 }))
  .refine(isPhoneLike, { message: "invalid_phone" });

export const requiredPhoneField = z
  .string()
  .transform((v) => sanitizeText(v, { max: 40 }))
  .pipe(z.string().min(7).max(40))
  .refine(isPhoneLike, { message: "invalid_phone" });

export const safeHrefField = z
  .string()
  .max(2000)
  .refine((v) => v === "" || isSafeHref(v), { message: "unsafe_href" });

export const safeImageUrlField = z
  .string()
  .max(2000)
  .refine((v) => v === "" || isSafeImageUrl(v), {
    message: "unsafe_image_url",
  });

export const interestField = z
  .string()
  .transform((v) => sanitizeText(v ?? "", { max: 40 }).toLowerCase())
  .refine((v) => CONTACT_INTERESTS.includes(v), {
    message: "invalid_interest",
  });

export const nameField = text(200);
export const messageField = multiline(5000, { min: 1 });
export const notesField = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => sanitizeMultiline(v ?? "", { max: 5000 }));

export const honeypotField = z
  .string()
  .max(0)
  .optional()
  .or(z.literal(""));

export { text, optionalText, multiline };
