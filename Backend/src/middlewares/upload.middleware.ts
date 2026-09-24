import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Best scenario from Al Rouba: never trust original extension — map verified MIME to safe extension.
const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  // video support kept for parity with Al Rouba (used for product media videos)
  "video/mp4": "mp4",
  "video/mpeg": "mpeg",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "application/pdf": "pdf",
};

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Determine entity dynamically like Al Rouba (req.baseUrl), but force "products" for ESIA product routes
    let entity = "misc";
    if (req.baseUrl) {
      if (req.baseUrl.includes("products")) entity = "products";
      else if (req.baseUrl.includes("categories")) entity = "categories";
      else entity = req.baseUrl.split("/").pop() || "misc";
    } else if ((req.params as any)?.entity) {
      entity = (req.params as any).entity as string;
    }

    let type = "docs";
    if (file.mimetype.startsWith("image/")) type = "images";
    else if (file.mimetype.startsWith("video/")) type = "videos";

    // Use process.cwd() so it works both with tsx (src) and compiled dist, and with Docker.
    // Fallback to __dirname based path for compatibility.
    const baseUpload = process.env.UPLOAD_DIR
      ? path.join(process.cwd(), process.env.UPLOAD_DIR)
      : path.join(process.cwd(), "uploads");
    const targetDir = path.join(baseUpload, entity, type);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeExtension = mimeToExt[file.mimetype] || "bin";
    cb(null, `${uniqueSuffix}.${safeExtension}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (mimeToExt[file.mimetype]) cb(null, true);
  else cb(new Error(`Unsupported file type: ${file.mimetype}`));
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB absolute max (mirrors Al Rouba)
  },
  fileFilter,
});

// Helper to convert absolute path to URL path for DB (mirrors Al Rouba's toUrlPath)
export const toUrlPath = (absolutePath: string): string => {
  const baseUpload = process.env.UPLOAD_DIR || "uploads";
  // normalize to forward slashes and extract /uploads/... part
  const normalized = absolutePath.replace(/\\/g, "/");
  const idx = normalized.indexOf("/uploads/");
  if (idx !== -1) return normalized.slice(idx);
  // fallback: make it relative to cwd uploads
  const cwdUpload = path.join(process.cwd(), "uploads").replace(/\\/g, "/");
  if (normalized.startsWith(cwdUpload)) return normalized.replace(cwdUpload, "/uploads");
  return "/" + normalized.replace(/^\/+/, "");
};
