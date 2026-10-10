import { Request, Response, NextFunction } from "express";

const sanitizeObject = (obj: any): void => {
  if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      // Allow indexed multipart-style image fields (image[0].colorId):
      // these are multer field names, not NoSQL injection vectors.
      if (/^(?:image|images)\[\d+\]\.[A-Za-z_]+$/.test(key)) continue;
      if (key.startsWith("$") || key.includes(".")) delete obj[key];
      else sanitizeObject(obj[key]);
    }
  }
};

export const mongoSanitize = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};