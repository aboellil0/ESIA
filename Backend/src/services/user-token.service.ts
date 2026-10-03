import crypto from "crypto";
import { AppDataSource } from "../config/data-source";
import { UserToken } from "../models/UserToken";
import { UserTokenType } from "../models/enums";
import { User } from "../models/User";

export const hashEmailToken = (rawToken: string): string =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

/**
 * Issue a single-use email token for a user.
 * One-to-one: any previous token for this user is replaced,
 * regardless of its type. Returns the RAW token (only copy ever exposed).
 */
export async function issueUserToken(userId: number, type: UserTokenType, ttlMs: number): Promise<string> {
  const repo = AppDataSource.getRepository(UserToken);
  const rawToken = crypto.randomBytes(32).toString("hex");
  await repo.delete({ userId });
  await repo.save(
    repo.create({
      userId,
      type,
      tokenHash: hashEmailToken(rawToken),
      expiresAt: new Date(Date.now() + ttlMs),
    })
  );
  return rawToken;
}

export type TakenToken =
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "valid"; user: User };

/**
 * Consume a single-use token (deleted on read, valid or expired).
 * - "invalid": no such token (or wrong type)
 * - "expired": token found but past expiry
 * - "valid": token accepted, with its owner
 */
export async function takeUserToken(rawToken: string, type: UserTokenType): Promise<TakenToken> {
  if (!rawToken) return { status: "invalid" };
  const repo = AppDataSource.getRepository(UserToken);
  const stored = await repo.findOne({
    where: { tokenHash: hashEmailToken(rawToken), type },
    relations: { user: true },
  });
  if (!stored) return { status: "invalid" };
  await repo.delete({ id: stored.id });
  if (stored.expiresAt < new Date()) return { status: "expired" };
  return { status: "valid", user: stored.user };
}

/** Revoke any pending token for a user without issuing a new one. */
export async function clearUserTokens(userId: number): Promise<void> {
  await AppDataSource.getRepository(UserToken).delete({ userId });
}

export { UserTokenType };
