import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { UserRole } from "../models/enums";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      admin?: UserPayload;
    }
  }
}

const getSecret = (): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "change_me_esia_access_secret_2026_very_long_random_key_32chars";
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET or JWT_SECRET is not defined");
  return secret;
};

export const protect = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Not authorized - no access token"));
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, getSecret()) as UserPayload;
    req.user = decoded;
    // keep admin alias for backward compat with Basira pattern
    (req as any).admin = decoded;
    next();
  } catch {
    return next(AppError.unauthorized("Access token expired or invalid"));
  }
};

export const optionalProtect = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, getSecret()) as UserPayload;
      req.user = decoded;
      (req as any).admin = decoded;
    } catch {}
  }
  next();
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized("Not authenticated"));
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden(`Forbidden - requires one of: ${allowedRoles.join(", ")}`));
    }
    next();
  };
};

export const adminOnly = authorize(UserRole.ADMIN);
export const requireAdmin = adminOnly;
export const isAdmin = adminOnly;

export const userOnly = authorize(UserRole.USER);
export const requireUser = userOnly;

/**
 * requireVerifiedUser — defense-in-depth behind `protect`.
 * Admins pass through (no verification concept). Users must have
 * isVerified=true, otherwise 403 EMAIL_NOT_VERIFIED and no access.
 * Covers legacy/stale access tokens minted before verification.
 */
export const requireVerifiedUser = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) return next(AppError.unauthorized("Not authenticated"));
    if (req.user.role !== UserRole.USER) return next();
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: Number(req.user.id) } });
    if (!user) return next(AppError.unauthorized("User not found"));
    if (!user.isVerified) {
      return next(
        new AppError("Please verify your email before using your account. Check your inbox for the confirmation link.", 403, "EMAIL_NOT_VERIFIED")
      );
    }
    next();
  } catch {
    next(AppError.unauthorized("Not authenticated"));
  }
};

export const adminOrUser = authorize(UserRole.ADMIN, UserRole.USER);
export const allowBothRoles = adminOrUser;