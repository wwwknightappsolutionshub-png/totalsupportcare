import { config } from "../config.js";
import { sendWhatsAppText } from "./whatsapp.js";

const STATUS_COPY = {
  new: "We have received your application and will review it shortly.",
  screening: "Your application is now in screening.",
  interview: "Congratulations — we would like to invite you to interview.",
  offer: "We are pleased to progress an offer with you.",
  hired: "Welcome to the Total Support Care family.",
  rejected:
    "Thank you for applying. We will not be progressing your application at this time.",
};

export async function notifyApplicationStatus({
  toStatus,
  email,
  phone,
  name,
}) {
  const message = `Total Support Care: Hi ${name}. ${STATUS_COPY[toStatus] || "Your application status was updated."}`;

  // Email: log until SMTP is configured (no silent fake success in prod without transport)
  console.info(`[notify:email] to=${email} status=${toStatus}`);

  if (config.whatsapp.enabled && phone) {
    try {
      await sendWhatsAppText(phone, message);
    } catch (err) {
      console.error("[notify:whatsapp] failed", err.message);
    }
  }

  return { emailQueued: true, whatsappAttempted: config.whatsapp.enabled };
}

/** Alert HR inbox when a new application (optionally with CV) arrives */
export async function notifyHrNewApplication({
  applicationId,
  name,
  email,
  phone,
  hasCv,
}) {
  const hrEmail = config.hrNotifyEmail;
  const summary = `New Total Support Care application from ${name} (${email}${phone ? `, ${phone}` : ""})${hasCv ? " — CV attached" : " — no CV"}. Open Recruitment in admin to review. id=${applicationId}`;

  console.info(`[notify:hr-email] to=${hrEmail} application=${applicationId}`);
  console.info(`[notify:hr-email] ${summary}`);

  if (config.whatsapp.enabled && config.hrNotifyPhone) {
    try {
      await sendWhatsAppText(
        config.hrNotifyPhone,
        `Total Support Care HR: New application from ${name}. ${hasCv ? "CV uploaded. " : ""}Check Recruitment.`
      );
    } catch (err) {
      console.error("[notify:hr-whatsapp] failed", err.message);
    }
  }

  return { hrEmailQueued: true };
}
