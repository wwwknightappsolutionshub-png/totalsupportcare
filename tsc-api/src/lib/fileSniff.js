import fs from "node:fs";

const SIGNATURES = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF….WEBP
  { mime: "application/msword", bytes: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE
];

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function startsWith(buf, signature, offset = 0) {
  if (buf.length < offset + signature.length) return false;
  return signature.every((b, i) => buf[offset + i] === b);
}

/** True if buffer looks like a ZIP that contains Word OOXML markers. */
function looksLikeDocx(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const head = Buffer.alloc(4);
    fs.readSync(fd, head, 0, 4, 0);
    if (!startsWith(head, [0x50, 0x4b, 0x03, 0x04])) return false;

    // Scan early local-file headers / compressed payload for OOXML word markers.
    const probe = Buffer.alloc(65536);
    const n = fs.readSync(fd, probe, 0, probe.length, 0);
    const text = probe.subarray(0, n).toString("latin1");
    return (
      text.includes("word/") ||
      text.includes("wordprocessingml") ||
      text.includes("[Content_Types].xml")
    );
  } catch {
    return false;
  } finally {
    if (fd != null) {
      try {
        fs.closeSync(fd);
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Read file header and confirm it matches an allowed MIME family.
 * Returns detected mime or null.
 */
export function sniffFileMime(filePath, allowedMimes) {
  const allowed = new Set(allowedMimes);
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);

    if (allowed.has(DOCX_MIME) && startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) {
      // Close before re-open inside looksLikeDocx
      try {
        fs.closeSync(fd);
      } catch {
        /* ignore */
      }
      fd = null;
      return looksLikeDocx(filePath) ? DOCX_MIME : null;
    }

    for (const sig of SIGNATURES) {
      if (!startsWith(buf, sig.bytes, sig.offset || 0)) continue;
      if (sig.mime === "image/webp") {
        if (buf.toString("ascii", 8, 12) !== "WEBP") continue;
      }
      if (allowed.has(sig.mime)) return sig.mime;
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fd != null) {
      try {
        fs.closeSync(fd);
      } catch {
        /* ignore */
      }
    }
  }
}
