import sharp from "sharp";
import path from "path";
import fs from "fs";

/**
 * Best scenario from Al Rouba: sharp compression per extension.
 * - jpg/jpeg: quality 80
 * - png: compressionLevel 6
 * - webp: quality 80
 * - gif: leave as is (or keep original)
 * Overwrites original with compressed temp file.
 */
export const MediaService = {
  async compressImage(filePath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();
    const tempPath = filePath.replace(ext, `-temp-${Date.now()}${ext}`);
    try {
      let pipeline = sharp(filePath);

      if (ext === ".jpg" || ext === ".jpeg") {
        pipeline = pipeline.jpeg({ quality: 80 });
      } else if (ext === ".png") {
        pipeline = pipeline.png({ compressionLevel: 6 });
      } else if (ext === ".webp") {
        pipeline = pipeline.webp({ quality: 80 });
      } else {
        // gif and others: no compression, keep original
        return;
      }

      await pipeline.toFile(tempPath);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
      }
    } catch {
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {}
      }
      // keep original on failure
    }
  },

  // Video compression kept for parity with Al Rouba but optional for ESIA (products only use images)
  // If fluent-ffmpeg not installed, this will no-op.
  async compressVideo(filePath: string): Promise<void> {
    try {
      const ffmpeg = await import("fluent-ffmpeg");
      const ext = path.extname(filePath).toLowerCase();
      const tempPath = filePath.replace(ext, `-temp-${Date.now()}${ext}`);
      return new Promise<void>((resolve) => {
        (ffmpeg.default || (ffmpeg as any))(filePath)
          .videoCodec("libx264")
          .audioCodec("aac")
          .outputOptions(["-crf 28", "-preset faster", "-movflags +faststart"])
          .on("end", () => {
            try {
              if (fs.existsSync(tempPath)) {
                fs.unlinkSync(filePath);
                fs.renameSync(tempPath, filePath);
              }
              resolve();
            } catch {
              resolve();
            }
          })
          .on("error", () => {
            if (fs.existsSync(tempPath))
              try {
                fs.unlinkSync(tempPath);
              } catch {}
            resolve();
          })
          .save(tempPath);
      });
    } catch {
      // fluent-ffmpeg not available — skip video compression
      return;
    }
  },
};
