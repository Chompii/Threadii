import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import itemsRouter from "./routes/items.js";
import outfitsRouter from "./routes/outfits.js";
import favoritesRouter from "./routes/favorites.js";
import wornRouter from "./routes/worn.js";
import dislikesRouter from "./routes/dislikes.js";
import exportRouter from "./routes/export.js";
import statsRouter from "./routes/stats.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";
import { UPLOADS_DIR } from "./paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/auth", authRouter);

app.use("/api/items", requireAuth, itemsRouter);
app.use("/api/outfits", requireAuth, outfitsRouter);
app.use("/api/favorites", requireAuth, favoritesRouter);
app.use("/api/worn", requireAuth, wornRouter);
app.use("/api/dislikes", requireAuth, dislikesRouter);
app.use("/api/export", requireAuth, exportRouter);
app.use("/api/stats", requireAuth, statsRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// In production the client is built to client/dist and served from here, so
// the whole app is one deployable service. In local dev that folder doesn't
// exist — Vite serves the frontend separately on its own port instead.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Outfit app server listening on http://localhost:${PORT}`);
});
