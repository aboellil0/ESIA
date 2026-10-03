import "reflect-metadata";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";
import { Admin } from "../models/Admin";
import { RefreshToken } from "../models/RefreshToken";
import { AppError } from "../utils/AppError";
import { buildPasswordResetUrl, buildVerificationUrl, sendPasswordResetEmail, sendVerificationEmail } from "./mail.service";
import {
  signAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  findRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "./token.service";
import { UserRole } from "../models/enums";
import config from "../config";

const PASSWORD_REGEX = {
  minLength: 8,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  digit: /[0-9]/,
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/,
};

function validatePasswordStrength(password: string): void {
  const errors: string[] = [];
  if (password.length < PASSWORD_REGEX.minLength) errors.push(`at least ${PASSWORD_REGEX.minLength} characters`);
  if (!PASSWORD_REGEX.uppercase.test(password)) errors.push("one uppercase letter (A-Z)");
  if (!PASSWORD_REGEX.lowercase.test(password)) errors.push("one lowercase letter (a-z)");
  if (!PASSWORD_REGEX.digit.test(password)) errors.push("one number (0-9)");
  if (!PASSWORD_REGEX.special.test(password)) errors.push("one special character (!@#$%^&* etc.)");
  if (/\s/.test(password)) errors.push("no spaces");
  if (errors.length) {
    throw AppError.validation(`Password must contain ${errors.join(", ")}. Example: \"Password123!\"`);
  }
}

export const AuthService = {
  async register(data: { name?: string; email?: string; password?: string; phone?: string }) {
    const { name, email, password, phone } = data;
    if (!name || !email || !password) throw AppError.validation("name, email and password are required");
    validatePasswordStrength(password);

    const userRepo = AppDataSource.getRepository(User);
    const existing = await userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      // Allow re-register / resend if a previous signup never verified
      if (!existing.isVerified) {
        const { rawToken, tokenHash, expiresAt } = newVerificationToken();
        existing.name = name;
        existing.phone = phone || null;
        existing.passwordHash = await bcrypt.hash(password, config.bcryptRounds);
        existing.verificationTokenHash = tokenHash;
        existing.verificationExpiresAt = expiresAt;
        await userRepo.save(existing);
        await sendVerificationEmailSafe(existing.email, existing.name, rawToken);
        return { id: existing.id, name: existing.name, email: existing.email, phone: existing.phone, isVerified: false, requiresVerification: true };
      }
      throw AppError.conflict("A user with this email already exists");
    }

    const hash = await bcrypt.hash(password, config.bcryptRounds);
    const { rawToken, tokenHash, expiresAt } = newVerificationToken();
    const user = userRepo.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hash,
      phone: phone || null,
      isVerified: false,
      verificationTokenHash: tokenHash,
      verificationExpiresAt: expiresAt,
    });
    const saved = await userRepo.save(user);
    await sendVerificationEmailSafe(saved.email, saved.name, rawToken);
    return { id: saved.id, name: saved.name, email: saved.email, phone: saved.phone, isVerified: false, requiresVerification: true };
  },

  async verifyEmail(rawToken?: string) {
    if (!rawToken) throw AppError.validation("Verification token is required");
    const tokenHash = hashVerificationToken(rawToken);
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { verificationTokenHash: tokenHash } });
    if (!user) throw AppError.badRequest("Invalid or expired verification link");
    if (user.isVerified) {
      user.verificationTokenHash = null;
      user.verificationExpiresAt = null;
      await userRepo.save(user);
      return { id: user.id, email: user.email, isVerified: true };
    }
    if (!user.verificationExpiresAt || user.verificationExpiresAt < new Date()) {
      throw AppError.badRequest("Verification link has expired. Please request a new one.");
    }
    user.isVerified = true;
    user.verificationTokenHash = null;
    user.verificationExpiresAt = null;
    await userRepo.save(user);
    return { id: user.id, name: user.name, email: user.email, isVerified: true };
  },

  async resendVerification(email?: string) {
    if (!email) throw AppError.validation("Email is required");
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw AppError.notFound("No account found with this email");
    if (user.isVerified) throw AppError.badRequest("Email is already verified. You can log in.");
    const { rawToken, tokenHash, expiresAt } = newVerificationToken();
    user.verificationTokenHash = tokenHash;
    user.verificationExpiresAt = expiresAt;
    await userRepo.save(user);
    await sendVerificationEmailSafe(user.email, user.name, rawToken);
    return { email: user.email, requiresVerification: true };
  },

  async forgotPassword(email?: string) {
    if (!email) throw AppError.validation("Email is required");
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: email.toLowerCase() } });
    // Always respond with success to avoid revealing which emails are registered.
    if (!user) return { email: email.toLowerCase() };
    const { rawToken, tokenHash, expiresAt } = newPasswordResetToken();
    user.resetTokenHash = tokenHash;
    user.resetExpiresAt = expiresAt;
    await userRepo.save(user);
    try {
      await sendPasswordResetEmail(user.email, user.name, buildPasswordResetUrl(rawToken));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[mail] password reset email failed:", (err as Error).message);
    }
    return { email: user.email };
  },

  async resetPassword(rawToken?: string, newPassword?: string) {
    if (!rawToken) throw AppError.validation("Reset token is required");
    if (!newPassword) throw AppError.validation("New password is required");
    validatePasswordStrength(newPassword);
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { resetTokenHash: hashVerificationToken(rawToken) } });
    if (!user) throw AppError.badRequest("Invalid or expired password reset link");
    if (!user.resetExpiresAt || user.resetExpiresAt < new Date()) {
      throw AppError.badRequest("Password reset link has expired. Please request a new one.");
    }
    user.passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
    user.resetTokenHash = null;
    user.resetExpiresAt = null;
    await userRepo.save(user);
    // Invalidate all sessions issued before the reset.
    await AppDataSource.getRepository(RefreshToken).delete({ userId: user.id });
    return { id: user.id, email: user.email };
  },

  async login(identifier?: string, password?: string, deviceId: string = "unknown") {
    if (!identifier || !password) throw AppError.validation("Email and password are required");

    const emailLower = identifier.toLowerCase();

    // Unified login: try Admin first, then User (single endpoint for all roles)
    const adminRepo = AppDataSource.getRepository(Admin);
    const admin = await adminRepo.findOne({ where: { email: emailLower } });
    if (admin) {
      const match = await bcrypt.compare(password, admin.passwordHash);
      if (!match) throw AppError.unauthorized("Invalid credentials");
      const rawRefreshToken = generateRefreshToken();
      const accessToken = signAccessToken(String(admin.id), admin.email, UserRole.ADMIN);
      const refreshDoc = await saveRefreshToken(rawRefreshToken, admin.id, "admin", deviceId);
      const decoded = jwt.decode(accessToken) as any;
      return {
        accessToken,
        refreshToken: rawRefreshToken,
        tokenExpiration: new Date(decoded.exp * 1000).toISOString(),
        refreshTokenExpiration: refreshDoc.expiresAt.toISOString(),
        deviceId,
        user: { id: admin.id, email: admin.email, role: UserRole.ADMIN, name: "Admin" },
      };
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: emailLower } });
    if (!user) throw AppError.unauthorized("Invalid credentials");

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw AppError.unauthorized("Invalid credentials");

    if (!user.isVerified) {
      throw new AppError("Please verify your email before logging in. Check your inbox for the confirmation link.", 403, "EMAIL_NOT_VERIFIED");
    }

    const rawRefreshToken = generateRefreshToken();
    const accessToken = signAccessToken(String(user.id), user.email, UserRole.USER);
    const refreshDoc = await saveRefreshToken(rawRefreshToken, user.id, "user", deviceId);
    const decoded = jwt.decode(accessToken) as any;

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      tokenExpiration: new Date(decoded.exp * 1000).toISOString(),
      refreshTokenExpiration: refreshDoc.expiresAt.toISOString(),
      deviceId,
      user: { id: user.id, name: user.name, email: user.email, role: UserRole.USER },
    };
  },

  async refresh(rawToken?: string) {
    if (!rawToken) throw AppError.unauthorized("No refresh token provided");
    const stored = await findRefreshToken(rawToken);
    if (!stored) throw AppError.unauthorized("Refresh token is invalid or has been revoked");
    if (stored.expiresAt < new Date()) {
      await AppDataSource.getRepository(RefreshToken).delete({ id: stored.id });
      throw AppError.unauthorized("Refresh token has expired");
    }

    let ownerId: number;
    let role: UserRole;
    let email: string;

    if (stored.userId) {
      const user = await AppDataSource.getRepository(User).findOne({ where: { id: stored.userId } });
      if (!user) throw AppError.unauthorized("User not found");
      if (!user.isVerified) {
        // Never mint tokens for unverified accounts — revoke the stale session.
        await AppDataSource.getRepository(RefreshToken).delete({ id: stored.id });
        throw new AppError("Please verify your email before logging in. Check your inbox for the confirmation link.", 403, "EMAIL_NOT_VERIFIED");
      }
      ownerId = user.id;
      role = UserRole.USER;
      email = user.email;
    } else if (stored.adminId) {
      const admin = await AppDataSource.getRepository(Admin).findOne({ where: { id: stored.adminId } });
      if (!admin) throw AppError.unauthorized("Admin not found");
      ownerId = admin.id;
      role = UserRole.ADMIN;
      email = admin.email;
    } else {
      throw AppError.unauthorized("Invalid refresh token owner");
    }

    const newRaw = generateRefreshToken();
    const newAccess = signAccessToken(String(ownerId), email, role);
    const rotated = await rotateRefreshToken(stored.id, newRaw, stored.deviceId);
    const decoded = jwt.decode(newAccess) as any;

    return {
      accessToken: newAccess,
      refreshToken: newRaw,
      tokenExpiration: new Date(decoded.exp * 1000).toISOString(),
      refreshTokenExpiration: rotated!.expiresAt.toISOString(),
      deviceId: stored.deviceId,
    };
  },

  async logout(rawToken?: string) {
    if (rawToken) await revokeRefreshToken(rawToken);
    return null;
  },

  async createAdmin(data: { email?: string; password?: string }) {
    const { email, password } = data;
    if (!email || !password) throw AppError.validation("email and password are required");
    validatePasswordStrength(password);

    const adminRepo = AppDataSource.getRepository(Admin);
    const existing = await adminRepo.findOne({ where: { email: email.toLowerCase() } });
    if (existing) throw AppError.conflict("An admin with this email already exists");

    const hash = await bcrypt.hash(password, config.bcryptRounds);
    const admin = adminRepo.create({
      email: email.toLowerCase(),
      passwordHash: hash,
    });
    const saved = await adminRepo.save(admin);
    return { id: saved.id, email: saved.email };
  },
};

// --- Email verification helpers (token stored hashed, like refresh tokens) ---

function hashVerificationToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function newVerificationToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hours = config.emailVerificationExpiresHours || 24;
  return {
    rawToken,
    tokenHash: hashVerificationToken(rawToken),
    expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
  };
}

function newPasswordResetToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const minutes = config.passwordResetExpiresMinutes || 60;
  return {
    rawToken,
    tokenHash: hashVerificationToken(rawToken),
    expiresAt: new Date(Date.now() + minutes * 60 * 1000),
  };
}

async function sendVerificationEmailSafe(email: string, name: string, rawToken: string): Promise<void> {
  try {
    await sendVerificationEmail(email, name, buildVerificationUrl(rawToken));
  } catch (err) {
    // Don't fail registration if Brevo is down — user can use resend endpoint.
    // eslint-disable-next-line no-console
    console.error("[mail] verification email failed:", (err as Error).message);
  }
}