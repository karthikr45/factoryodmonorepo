/**
 * Prisma client singleton.
 * Import { prisma } from '@repo/database' everywhere — never instantiate PrismaClient directly.
 *
 * The singleton pattern prevents hot-reload from creating a fresh client on every
 * edit in development, which exhausts the Postgres connection pool.
 */
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __factoryos_prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__factoryos_prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__factoryos_prisma = prisma;
}

export * from '@prisma/client';
