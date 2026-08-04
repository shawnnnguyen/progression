import crypto from "node:crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { ConflictError, NotFoundError, UnauthorizedError } from "../errors/index.js";
import type { UserRow } from "./types.js";

export interface AuthUserRepository {
  findUserByEmail(email: string): Promise<(UserRow & { passwordHash: string }) | null>;
  findUserById(userId: string): Promise<UserRow | null>;
  createUser(input: { email: string; name: string; passwordHash: string }): Promise<UserRow>;
  deactivateUser(userId: string): Promise<void>;
}

export interface AuthRefreshTokenRepository {
  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findValidRefreshTokenByHash(tokenHash: string): Promise<{ userId: string } | null>;
  rotateRefreshToken(oldTokenHash: string, userId: string, newTokenHash: string, expiresAt: Date): Promise<void>;
  revokeRefreshTokenByHash(tokenHash: string): Promise<void>;
  revokeAllRefreshTokensForUser(userId: string): Promise<void>;
}

export interface AuthConfig {
  accessSecret: string;
  accessTtlSeconds: number;
  refreshTtlMs: number;
}

export interface AuthServiceDeps {
  users: AuthUserRepository;
  refreshTokens: AuthRefreshTokenRepository;
  config: AuthConfig;
}

export interface AccessTokenClaims {
  userId: string;
  actorType: "user";
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signAccessToken(userId: string, config: AuthConfig): string {
  return jwt.sign({ actorType: "user" }, config.accessSecret, {
    subject: userId,
    expiresIn: config.accessTtlSeconds,
  });
}

export function verifyAccessToken(token: string, config: AuthConfig): AccessTokenClaims | null {
  try {
    const decoded = jwt.verify(token, config.accessSecret);
    if (typeof decoded === "string" || !decoded.sub) return null;
    return { userId: decoded.sub, actorType: "user" };
  } catch {
    return null;
  }
}

async function issueRefreshToken(userId: string, deps: AuthServiceDeps): Promise<string> {
  const plaintext = crypto.randomBytes(40).toString("hex");
  await deps.refreshTokens.createRefreshToken(userId, hashToken(plaintext), new Date(Date.now() + deps.config.refreshTtlMs));
  return plaintext;
}

export async function register(
  input: { email: string; name: string; password: string },
  deps: AuthServiceDeps,
): Promise<UserRow> {
  if (await deps.users.findUserByEmail(input.email)) {
    throw new ConflictError("An account with this email already exists");
  }
  const passwordHash = await argon2.hash(input.password);
  return deps.users.createUser({ email: input.email, name: input.name, passwordHash });
}

export async function login(
  email: string,
  password: string,
  deps: AuthServiceDeps,
): Promise<{ user: UserRow; accessToken: string; refreshToken: string }> {
  const record = await deps.users.findUserByEmail(email);
  if (!record || record.deactivatedAt) {
    throw new UnauthorizedError("Invalid email or password");
  }
  if (!(await argon2.verify(record.passwordHash, password))) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const accessToken = signAccessToken(record.id, deps.config);
  const refreshToken = await issueRefreshToken(record.id, deps);
  const { passwordHash: _passwordHash, ...user } = record;
  return { user, accessToken, refreshToken };
}

// Rotated on every use (§5): the presented refresh token is revoked and a
// new one issued in the same repository-level transaction, so replay of an
// already-used token is detectable (it simply won't be "valid" anymore).
//
// Also re-checks deactivatedAt here, not just at login: an access token
// that was already minted keeps working until it expires (unavoidable with
// a stateless JWT), but a deactivated user must not be able to mint a new
// one — this, plus revoking every outstanding refresh token on deactivation
// (see deactivateSelf below), bounds a deactivated account's remaining
// access to at most one access-token lifetime.
export async function refreshAccessToken(
  refreshToken: string,
  deps: AuthServiceDeps,
): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenHash = hashToken(refreshToken);
  const valid = await deps.refreshTokens.findValidRefreshTokenByHash(tokenHash);
  if (!valid) throw new UnauthorizedError("Invalid or expired refresh token");

  const user = await deps.users.findUserById(valid.userId);
  if (!user || user.deactivatedAt) throw new UnauthorizedError("Invalid or expired refresh token");

  const newPlaintext = crypto.randomBytes(40).toString("hex");
  await deps.refreshTokens.rotateRefreshToken(tokenHash, valid.userId, hashToken(newPlaintext), new Date(Date.now() + deps.config.refreshTtlMs));

  return { accessToken: signAccessToken(valid.userId, deps.config), refreshToken: newPlaintext };
}

export async function logout(refreshToken: string, deps: AuthServiceDeps): Promise<void> {
  await deps.refreshTokens.revokeRefreshTokenByHash(hashToken(refreshToken));
}

export async function getCurrentUser(userId: string, deps: AuthServiceDeps): Promise<UserRow> {
  const user = await deps.users.findUserById(userId);
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function deactivateSelf(userId: string, deps: AuthServiceDeps): Promise<void> {
  await deps.users.deactivateUser(userId);
  await deps.refreshTokens.revokeAllRefreshTokensForUser(userId);
}
