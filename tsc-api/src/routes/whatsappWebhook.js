import { Router } from "express";
import { config } from "../config.js";
import {
  ingestInboundMessage,
  verifyWhatsAppSignature,
} from "../services/whatsapp.js";

const router = Router();

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (
    mode === "subscribe" &&
    token &&
    config.whatsapp.verifyToken &&
    token === config.whatsapp.verifyToken
  ) {
    const safe = String(challenge ?? "");
    if (!/^[A-Za-z0-9_-]{1,256}$/.test(safe)) {
      return res.sendStatus(403);
    }
    return res.status(200).send(safe);
  }
  return res.sendStatus(403);
});

router.post("/", (req, res) => {
  // Always require a configured app secret + valid signature (no unsigned ingest).
  if (!config.whatsapp.appSecret) {
    return res.sendStatus(503);
  }
  const ok = verifyWhatsAppSignature(
    req.rawBody || Buffer.from(""),
    req.get("x-hub-signature-256")
  );
  if (!ok) return res.sendStatus(401);

  try {
    const body = req.body;
    const entries = body?.entry || [];
    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const message of value.messages || []) {
          if (message.type !== "text") continue;
          const contact = (value.contacts || [])[0];
          ingestInboundMessage({
            waId: message.from,
            displayName: contact?.profile?.name,
            body: message.text?.body || "",
            waMessageId: message.id,
          });
        }
      }
    }
  } catch (err) {
    console.error("[whatsapp:webhook]", err);
  }

  // Always 200 quickly to Meta when verified
  return res.sendStatus(200);
});

export default router;
