import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  login,
  refreshAccessToken,
  register,
  verifyAccessToken,
  type AuthServiceDeps,
} from "../../src/services/authService.js";
import { ConflictError, UnauthorizedError } from "../../src/errors/index.js";
import argon2 from "argon2";

const config = {
  accessSecret: "test-access-secret",
  accessTtlSeconds: 900,
  refreshTtlMs: 1000 * 60 * 60,
};

function makeDeps(): { deps: AuthServiceDeps; usersByEmail: Map<string, any>; refreshTokens: Map<string, { userId: string; revoked: boolean; expiresAt: Date }> } {
  const usersByEmail = new Map<string, any>();
  const refreshTokens = new Map<string, { userId: string; revoked: boolean; expiresAt: Date }>();
  let nextId = 1;

  const deps: AuthServiceDeps = {
    users: {
      async findUserByEmail(email) {
        return usersByEmail.get(email) ?? null;
      },
      async findUserById(userId) {
        for (const user of usersByEmail.values()) {
          if (user.id === userId) return user;
        }
        return null;
      },
      async createUser(input) {
        const user = {
          id: `user-${nextId++}`,
          email: input.email,
          name: input.name,
          passwordHash: input.passwordHash,
          avatarUrl: null,
          deactivatedAt: null,
          createdAt: new Date(),
        };
        usersByEmail.set(input.email, user);
        return user;
      },
      async deactivateUser(userId) {
        for (const user of usersByEmail.values()) {
          if (user.id === userId) user.deactivatedAt = new Date();
        }
      },
    },
    refreshTokens: {
      async createRefreshToken(userId, tokenHash, expiresAt) {
        refreshTokens.set(tokenHash, { userId, revoked: false, expiresAt });
      },
      async findValidRefreshTokenByHash(tokenHash) {
        const token = refreshTokens.get(tokenHash);
        if (!token || token.revoked || token.expiresAt < new Date()) return null;
        return { userId: token.userId };
      },
      async rotateRefreshToken(oldTokenHash, userId, newTokenHash, expiresAt) {
        const old = refreshTokens.get(oldTokenHash);
        if (old) old.revoked = true;
        refreshTokens.set(newTokenHash, { userId, revoked: false, expiresAt });
      },
      async revokeRefreshTokenByHash(tokenHash) {
        const token = refreshTokens.get(tokenHash);
        if (token) token.revoked = true;
      },
      async revokeAllRefreshTokensForUser(userId) {
        for (const token of refreshTokens.values()) {
          if (token.userId === userId) token.revoked = true;
        }
      },
    },
    config,
  };

  return { deps, usersByEmail, refreshTokens };
}

describe("verifyAccessToken", () => {
  it("accepts a validly signed token and extracts the userId", () => {
    const token = jwt.sign({ actorType: "user" }, config.accessSecret, { subject: "user-1", expiresIn: "5m" });
    expect(verifyAccessToken(token, config)).toEqual({ userId: "user-1", actorType: "user" });
  });

  it("rejects a token signed with the wrong secret", () => {
    const token = jwt.sign({ actorType: "user" }, "wrong-secret", { subject: "user-1", expiresIn: "5m" });
    expect(verifyAccessToken(token, config)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = jwt.sign({ actorType: "user" }, config.accessSecret, { subject: "user-1", expiresIn: -10 });
    expect(verifyAccessToken(token, config)).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(verifyAccessToken("not-a-jwt", config)).toBeNull();
  });
});

describe("register / login", () => {
  it("registers a new user with a hashed password, never storing plaintext", async () => {
    const { deps, usersByEmail } = makeDeps();
    await register({ email: "a@example.com", name: "A", password: "hunter2hunter2" }, deps);
    const stored = usersByEmail.get("a@example.com");
    expect(stored.passwordHash).not.toBe("hunter2hunter2");
    expect(await argon2.verify(stored.passwordHash, "hunter2hunter2")).toBe(true);
  });

  it("rejects registering the same email twice", async () => {
    const { deps } = makeDeps();
    await register({ email: "a@example.com", name: "A", password: "hunter2hunter2" }, deps);
    await expect(register({ email: "a@example.com", name: "A2", password: "whatever12" }, deps)).rejects.toThrow(
      ConflictError,
    );
  });

  it("logs in with correct credentials and issues an access + refresh token", async () => {
    const { deps } = makeDeps();
    await register({ email: "a@example.com", name: "A", password: "hunter2hunter2" }, deps);
    const result = await login("a@example.com", "hunter2hunter2", deps);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(verifyAccessToken(result.accessToken, config)?.userId).toBe(result.user.id);
  });

  it("rejects login with the wrong password", async () => {
    const { deps } = makeDeps();
    await register({ email: "a@example.com", name: "A", password: "hunter2hunter2" }, deps);
    await expect(login("a@example.com", "wrong-password", deps)).rejects.toThrow(UnauthorizedError);
  });

  it("rejects login for a deactivated user", async () => {
    const { deps, usersByEmail } = makeDeps();
    await register({ email: "a@example.com", name: "A", password: "hunter2hunter2" }, deps);
    usersByEmail.get("a@example.com").deactivatedAt = new Date();
    await expect(login("a@example.com", "hunter2hunter2", deps)).rejects.toThrow(UnauthorizedError);
  });
});

describe("refreshAccessToken", () => {
  it("rotates the refresh token so the old one can't be reused (replay detection)", async () => {
    const { deps } = makeDeps();
    await register({ email: "a@example.com", name: "A", password: "hunter2hunter2" }, deps);
    const { refreshToken } = await login("a@example.com", "hunter2hunter2", deps);

    const rotated = await refreshAccessToken(refreshToken, deps);
    expect(rotated.refreshToken).not.toBe(refreshToken);

    await expect(refreshAccessToken(refreshToken, deps)).rejects.toThrow(UnauthorizedError);
  });

  it("rejects an unknown refresh token", async () => {
    const { deps } = makeDeps();
    await expect(refreshAccessToken("nonsense", deps)).rejects.toThrow(UnauthorizedError);
  });
});
