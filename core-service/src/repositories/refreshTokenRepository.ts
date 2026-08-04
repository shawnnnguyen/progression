import { prisma } from "./prismaClient.js";

export const refreshTokenRepository = {
  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  },

  async findValidRefreshTokenByHash(tokenHash: string) {
    const token = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!token || token.revokedAt || token.expiresAt < new Date()) return null;
    return token;
  },

  /** Rotation: revoke the used token and issue a new one, atomically (§5). */
  async rotateRefreshToken(oldTokenHash: string, userId: string, newTokenHash: string, expiresAt: Date): Promise<void> {
    await prisma.$transaction([
      prisma.refreshToken.update({ where: { tokenHash: oldTokenHash }, data: { revokedAt: new Date() } }),
      prisma.refreshToken.create({ data: { userId, tokenHash: newTokenHash, expiresAt } }),
    ]);
  },

  async revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
