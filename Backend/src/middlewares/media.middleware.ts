import { Request, Response, NextFunction } from "express";
import { MediaService } from "../services/media.service";
import fs from "fs";

/**
 * Mirrors Al Rouba's media.middleware.processMedia — best scenario:
 * - validates image ≤3MB, video ≤30MB *after* multer disk write but *before* controller
 * - deletes all files in batch if one exceeds limit (fail-fast cleanup)
 * - compresses images in parallel (sharp), videos sequentially (ffmpeg heavy)
 * - never blocks request on compression failure — calls next() regardless
 */
export const processMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filesToProcess: Express.Multer.File[] = [];

    if ((req as any).file) filesToProcess.push((req as any).file as Express.Multer.File);

    const reqFiles: any = (req as any).files;
    if (reqFiles) {
      if (Array.isArray(reqFiles)) filesToProcess.push(...reqFiles);
      else {
        Object.values(reqFiles).forEach((arr: any) => {
          if (Array.isArray(arr)) filesToProcess.push(...arr);
        });
      }
    }

    if (filesToProcess.length === 0) {
      next();
      return;
    }

    const IMAGE_SIZE_LIMIT = 3 * 1024 * 1024; // 3 MB — Al Rouba standard
    const VIDEO_SIZE_LIMIT = 30 * 1024 * 1024; // 30 MB

    for (const file of filesToProcess) {
      if (file.mimetype.startsWith("image/") && file.size > IMAGE_SIZE_LIMIT) {
        filesToProcess.forEach((f) => {
          if (fs.existsSync(f.path)) {
            try {
              fs.unlinkSync(f.path);
            } catch {}
          }
        });
        res.status(400).json({ success: false, message: `Image file ${file.originalname} exceeds the 3MB limit.`, statusCode: 400 });
        return;
      }
      if (file.mimetype.startsWith("video/") && file.size > VIDEO_SIZE_LIMIT) {
        filesToProcess.forEach((f) => {
          if (fs.existsSync(f.path)) {
            try {
              fs.unlinkSync(f.path);
            } catch {}
          }
        });
        res.status(400).json({ success: false, message: `Video file ${file.originalname} exceeds the 30MB limit.`, statusCode: 400 });
        return;
      }
    }

    const images = filesToProcess.filter((f) => f.mimetype.startsWith("image/"));
    const videos = filesToProcess.filter((f) => f.mimetype.startsWith("video/"));

    // Images parallel, videos sequential (CPU/RAM heavy)
    await Promise.all(images.map((f) => MediaService.compressImage(f.path)));
    for (const v of videos) await MediaService.compressVideo(v.path);

    next();
  } catch {
    // Al Rouba: continue even if processing fails — better uncompressed than broken
    next();
  }
};
