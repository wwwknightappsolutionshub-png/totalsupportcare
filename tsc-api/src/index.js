import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { requireTrustedOrigin } from "./middleware/origin.js";
import {
  blockSensitivePaths,
  hardenResponseHeaders,
} from "./middleware/security.js";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import hrRoutes from "./routes/hr.js";
import whatsappWebhook from "./routes/whatsappWebhook.js";
import "./db/index.js";
import { ensureSitePacks } from "./services/packs.js";
import { assertNoDefaultAdminPasswords } from "./services/assertAdminSecrets.js";

ensureSitePacks();
assertNoDefaultAdminPasswords();

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(hardenResponseHeaders);
app.use(blockSensitivePaths);

app.use(
  helmet({
    // API serves JSON + authenticated file downloads; CSP is enforced on the web tier
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "no-referrer" },
    hidePoweredBy: true,
    frameguard: { action: "deny" },
    hsts: config.isProd
      ? { maxAge: 15552000, includeSubDomains: true }
      : false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (config.appOrigins.includes(origin)) return callback(null, origin);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());

app.use(
  "/uploads",
  express.static(config.uploadsDir, {
    fallthrough: false,
    index: false,
    dotfiles: "deny",
    setHeaders(res) {
      res.removeHeader("X-Powered-By");
      res.removeHeader("Server");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.use("/api/auth", requireTrustedOrigin, authRoutes);
app.use("/api/public", requireTrustedOrigin, publicRoutes);
app.use("/api/admin", requireTrustedOrigin, adminRoutes);
app.use("/api/hr", requireTrustedOrigin, hrRoutes);
app.use("/api/webhooks/whatsapp", whatsappWebhook);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.message === "invalid_file_type") {
    return res.status(400).json({ error: "invalid_file_type" });
  }
  return res.status(500).json({ error: "internal_error" });
});

app.listen(config.port, config.host, () => {
  console.log(`tsc-api listening on http://${config.host}:${config.port}`);
});
