import { z } from "zod";
import {
  emailField,
  honeypotField,
  interestField,
  messageField,
  nameField,
  notesField,
  requiredPhoneField,
} from "./primitives.js";

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  phone: requiredPhoneField,
  interest: interestField,
  message: messageField,
  // Accept any short string so honeypot can soft-fail after parse
  website: z.string().max(200).optional().or(z.literal("")),
  formStartedAt: z.coerce.number().int().positive(),
  captchaToken: z.string().max(4000).optional().or(z.literal("")),
});

export const applyFieldsSchema = z.object({
  fullName: nameField,
  email: emailField,
  phone: requiredPhoneField,
  hasUkLicence: z.boolean(),
  hasOwnVehicle: z.boolean(),
  hasBusinessInsurance: z.boolean(),
  careCertificate: z.boolean(),
  dbsConsent: z.literal(true),
  notes: notesField,
  formStartedAt: z.coerce.number().int().positive(),
  website: honeypotField,
  captchaToken: z.string().max(4000).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(8).max(200),
});
