import "reflect-metadata";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";
import { Admin } from "../models/Admin";
import { RefreshToken } from "../models/RefreshToken";
import { AppError } from "../utils/AppError";
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
    if (existing) throw AppError.conflict("A user with this email already exists");

    const hash = await bcrypt.hash(password, config.bcryptRounds);
    const user = userRepo.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hash,
      phone: phone || null,
    });
    const saved = await userRepo.save(user);
    return { id: saved.id, name: saved.name, email: saved.email, phone: saved.phone };
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