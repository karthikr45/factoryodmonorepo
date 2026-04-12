/**
 * Prisma client singleton.
 * Import { prisma } from '@repo/database' everywhere — never instantiate PrismaClient directly.
 *
 * The singleton pattern prevents hot-reload from creating a fresh client on every
 * edit in development, which exhausts the Postgres connection pool.
 */
const { PrismaClient } = require('@prisma/client');

const prisma =
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

module.exports = { prisma, PrismaClient, ...require('@prisma/client') };
