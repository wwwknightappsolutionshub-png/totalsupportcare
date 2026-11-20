import { z } from "zod";
import {
  isPhoneLike,
  sanitizeMultiline,
  sanitizeText,
} from "./sanitize";

const CONTACT_INTERESTS = [
  "domiciliary",
  "dementia",
  "eol",
  "respite",
  "careers",
  "other",
  "quote",
  "cleaning",
  "moving",
  "general",
];

const emailField = z
  .string()
  .trim()
  .email("Enter a valid email")
  .max(200)
  .transform((v) => v.toLowerCase());

const phoneRequired = z
  .string()
  .transform((v) => sanitizeText(v, { max: 40 }))
  .pipe(z.string().min(7, "Phone is required").max(40))
  .refine(isPhoneLike, { message: "Enter a valid phone number" });

export const contactFormSchema = z.object({
  name: z
    .string()
    .transform((v) => sanitizeText(v, { max: 200 }))
    .pipe(z.string().min(1, "Name is required").max(200)),
  email: emailField,
  phone: phoneRequired,
  interest: z
    .string()
    .transform((v) => sanitizeText(v ?? "", { max: 40 }).toLowerCase())
    .refine((v) => CONTACT_INTERESTS.includes(v), {
      message: "Invalid enquiry type",
    }),
  message: z
    .string()
    .transform((v) => sanitizeMultiline(v, { max: 5000 }))
    .pipe(z.string().min(1, "Message is required").max(5000)),
  website: z.string().max(200).optional().or(z.literal("")),
  formStartedAt: z.number().int().positive(),
  captchaToken: z.string().max(4000).optional().or(z.literal("")),
});

export const applyFormSchema = z.object({
  fullName: z
    .string()
    .transform((v) => sanitizeText(v, { max: 200 }))
    .pipe(z.string().min(1, "Full name is required").max(200)),
  email: emailField,
  phone: phoneRequired,
  hasUkLicence: z.boolean(),
  hasOwnVehicle: z.boolean(),
  hasBusinessInsurance: z.boolean(),
  careCertificate: z.boolean(),
  dbsConsent: z.literal(true, {
    errorMap: () => ({ message: "DBS consent is required" }),
  }),
  notes: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => sanitizeMultiline(v ?? "", { max: 5000 })),
  formStartedAt: z.number().int().positive(),
  website: z.string().max(0).optional().or(z.literal("")),
  captchaToken: z.string().max(4000).optional().or(z.literal("")),
});

export const loginFormSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});
