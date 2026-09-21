import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const globalErrorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ success: false, message: "File is too large.", errors: [err.message], statusCode: 413 });
      return;
    }
    res.status(400).json({ success: false, message: `Upload Error: ${err.message}`, errors: [err.message], statusCode: 400 });
    return;
  }
  if (err.message && err.message.startsWith("CORS:")) {
    res.status(403).json({ success: false, message: err.message, errors: [err.message], statusCode: 403 });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message, errors: [err.message], statusCode: err.statusCode, code: err.code });
    return;
  }
  if (err.code && typeof err.statusCode === "number") {
    res.status(err.statusCode).json({ success: false, message: Array.isArray(err.message) ? err.message.join(", ") : err.message, errors: Array.isArray(err.message) ? err.message : [err.message], statusCode: err.statusCode, code: err.code });
    return;
  }
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "production") console.error(err.stack || err);
  else console.error(message);
  res.status(statusCode).json({ success: false, message: statusCode === 500 && process.env.NODE_ENV === "production" ? "Internal Server Error" : message, errors: [message], statusCode });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: "Route not found", errors: ["Route not found"], statusCode: 404 });
};