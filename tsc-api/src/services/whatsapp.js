import crypto from "node:crypto";
import { config } from "../config.js";
import { db, nowIso } from "../db/index.js";
import { v4 as uuid } from "uuid";

export function verifyWhatsAppSignature(rawBody, signatureHeader) {
  if (!config.whatsapp.appSecret) return false;
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expected = crypto
    .createHmac("sha256", config.whatsapp.appSecret)
    .update(rawBody)
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

export async function sendWhatsAppText(toPhone, body) {
  if (!config.whatsapp.enabled) {
    throw new Error("whatsapp_disabled");
  }
  if (
    !config.whatsapp.accessToken ||
    !config.whatsapp.phoneNumberId
  ) {
    throw new Error("whatsapp_not_configured");
  }

  const to = normalizePhone(toPhone);
  const url = `https://graph.facebook.com/v21.0/${config.whatsapp.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: String(body).slice(0, 4000) },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`whatsapp_send_failed:${res.status}:${text}`);
  }

  const data = await res.json();
  const waId = to;
  const now = nowIso();
  let conversation = db
    .prepare("SELECT id FROM wa_conversations WHERE wa_id = ?")
    .get(waId);
  if (!conversation) {
    const id = uuid();
    db.prepare(
      `INSERT INTO wa_conversations (id, contact_id, wa_id, display_name, updated_at)
       VALUES (?, NULL, ?, NULL, ?)`
    ).run(id, waId, now);
    conversation = { id };
  } else {
    db.prepare(
      "UPDATE wa_conversations SET updated_at = ? WHERE id = ?"
    ).run(now, conversation.id);
  }

  db.prepare(
    `INSERT INTO wa_messages (id, conversation_id, direction, body, wa_message_id, status, created_at)
     VALUES (?, ?, 'outbound', ?, ?, 'sent', ?)`
  ).run(
    uuid(),
    conversation.id,
    body,
    data?.messages?.[0]?.id || null,
    now
  );

  return data;
}

export function ingestInboundMessage({ waId, displayName, body, waMessageId }) {
  const now = nowIso();
  let conversation = db
    .prepare("SELECT id FROM wa_conversations WHERE wa_id = ?")
    .get(waId);
  if (!conversation) {
    const id = uuid();
    db.prepare(
      `INSERT INTO wa_conversations (id, contact_id, wa_id, display_name, updated_at)
       VALUES (?, NULL, ?, ?, ?)`
    ).run(id, waId, displayName || null, now);
    conversation = { id };
  } else {
    db.prepare(
      "UPDATE wa_conversations SET display_name = COALESCE(?, display_name), updated_at = ? WHERE id = ?"
    ).run(displayName || null, now, conversation.id);
  }

  db.prepare(
    `INSERT INTO wa_messages (id, conversation_id, direction, body, wa_message_id, status, created_at)
     VALUES (?, ?, 'inbound', ?, ?, 'received', ?)`
  ).run(uuid(), conversation.id, body, waMessageId || null, now);
}
