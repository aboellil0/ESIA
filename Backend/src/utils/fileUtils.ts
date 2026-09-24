import fs from "fs";
import path from "path";

/**
 * Mirrors Al Rouba's fileUtils.deleteFile — best scenario:
 * - skip external URLs (http/https)
 * - resolve /uploads/... to filesystem path safely
 * - unlink if exists, swallow errors
 */
export const deleteFile = (url?: string | null): void => {
  if (!url) return;
  if (url.startsWith("http://") || url.startsWith("https://")) return;
  try {
    const cleanUrl = url.replace(/^\/+/, "");
    // try cwd + cleanUrl
    let filePath = path.join(process.cwd(), cleanUrl);
    // also try __dirname based (for dist)
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, "../../", cleanUrl);
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
};

/**
 * Delete product images array on product removal
 */
export const deleteFiles = (urls: (string | null | undefined)[]): void => {
  urls.forEach((u) => deleteFile(u || undefined));
};
