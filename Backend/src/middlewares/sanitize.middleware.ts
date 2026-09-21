import { Request, Response, NextFunction } from "express";

const sanitizeObject = (obj: any): void => {
  if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
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