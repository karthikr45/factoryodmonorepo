import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { prisma, PrismaClient } from '@repo/database';

/**
 * Injectable wrapper around the shared Prisma singleton.
 * Every service injects this rather than importing the Prisma client directly.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient = prisma;

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
