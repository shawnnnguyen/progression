import { prisma } from "./prismaClient.js";
import type { UserRow } from "../services/types.js";

export interface NewUserInput {
  email: string;
  name: string;
  passwordHash: string;
}

export interface UserWithPasswordHash extends UserRow {
  passwordHash: string;
}

export const userRepository = {
  async findUserByEmail(email: string): Promise<UserWithPasswordHash | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findUserById(userId: string): Promise<UserRow | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true, deactivatedAt: true, createdAt: true },
    });
  },

  async createUser(input: NewUserInput): Promise<UserRow> {
    return prisma.user.create({
      data: input,
      select: { id: true, email: true, name: true, avatarUrl: true, deactivatedAt: true, createdAt: true },
    });
  },

  async deactivateUser(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { deactivatedAt: new Date() } });
  },
};
