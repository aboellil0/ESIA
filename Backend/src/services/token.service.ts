import crypto from "crypto";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../models/RefreshToken";
import jwt from "jsonwebtoken";
import config from "../config";

const parseRefreshDays = (str: string = "7d"): number => {
  const match = str.match(/^(\d+)d$/);
  return match ? parseInt(match[1], 10) : 7;
};

const refreshDays = parseRefreshDays(process.env.REFRESH_TOKEN_EXPIRES || process.env.JWT_EXPIRES_IN || "7d");
export const REFRESH_TOKEN_TTL_MS = refreshDays * 24 * 60 * 60 * 1000;

export const generateDeviceId = (): string => crypto.randomBytes(16).toString("hex");

export const signAccessToken = (userId: string, email: string, role: string): string =>
  jwt.sign(
    { id: userId, email, role },
    (process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "change_me_esia_access_secret_2026_very_long_random_key_32chars") as string,
    { expiresIn: (process.env.ACCESS_TOKEN_EXPIRES || "15m") as any }
  );

export const generateRefreshToken = (): string => crypto.randomBytes(64).toString("hex");

export const hashToken = (rawToken: string): string => crypto.createHash("sha256").update(rawToken).digest("hex");

export const saveRefreshToken = async (rawToken: string, ownerId: number, ownerType: "user" | "admin", deviceId: string) => {
  const repo = AppDataSource.getRepository(RefreshToken);
  const entity = repo.create({
    token: hashToken(rawToken),
    userId: ownerType === "user" ? ownerId : null,
    adminId: ownerType === "admin" ? ownerId : null,
    deviceId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return repo.save(entity);
};

export const findRefreshToken = async (rawToken: string) => {
  const repo = AppDataSource.getRepository(RefreshToken);
  return repo.findOne({ where: { token: hashToken(rawToken) }, relations: { user: true, admin: true } as any });
};

export const rotateRefreshToken = async (storedId: number, newRawToken: string, deviceId: string) => {
  const repo = AppDataSource.getRepository(RefreshToken);
  await repo.update(storedId, {
    token: hashToken(newRawToken),
    deviceId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return repo.findOne({ where: { id: storedId } });
};

export const revokeRefreshToken = async (rawToken: string) => {
  const repo = AppDataSource.getRepository(RefreshToken);
  await repo.delete({ token: hashToken(rawToken) });
};