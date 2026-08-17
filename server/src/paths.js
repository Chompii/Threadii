import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Overridable via env so a persistent volume (Fly.io, Render disk, etc.) can
// be pointed at in production instead of the local project folder.
export const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "closet.db");
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, "..", "..", "uploads");
