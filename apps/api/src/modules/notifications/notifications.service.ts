import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from '@repo/database';

import { PrismaService } from '../../common/prisma/prisma.service';

import { NotificationsGateway } from './notifications.gateway';

interface NotifyUserInput {
  userId: string;
  orgId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

interface NotifyOrgInput {
  orgId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async list(
    userId: string,
    options: { onlyUnread?: boolean; limit?: number },
  ): Promise<
    Array<{
      id: string;
      type: string;
      title: string;
      body: string;
      isRead: boolean;
      createdAt: Date;
      metadata: Record<string, unknown> | null;
    }>
  > {
    const rows = await this.prisma.client.notification.findMany({
      where: {
        userId,
        ...(options.onlyUnread ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
    });
    return rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      createdAt: n.createdAt,
      metadata: (n.metadata as Record<string, unknown> | null) ?? null,
    }));
  }

  async markRead(userId: string, ids: string[]): Promise<{ updated: number }> {
    const result = await this.prisma.client.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.client.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async notifyUser(input: NotifyUserInput): Promise<void> {
    const meta = input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull;

    const n = await this.prisma.client.notification.create({
      data: {
        userId: input.userId,
        orgId: input.orgId,
        type: input.type as never,
        title: input.title,
        body: input.body,
        channel: 'INAPP',
        metadata: meta,
        sentAt: new Date(),
      },
    });
    this.gateway.emitToUser(input.userId, 'notification:new', {
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
    });
    this.logger.debug(`Notification → user ${input.userId}: ${input.title}`);
  }

  /**
   * Fan out an org-level notification to every active user in the org.
   */
  async notifyOrg(input: NotifyOrgInput): Promise<void> {
    const users = await this.prisma.client.user.findMany({
      where: { orgId: input.orgId, isActive: true },
      select: { id: true },
    });
    if (users.length === 0) return;

    const meta = input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull;

    await this.prisma.client.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        orgId: input.orgId,
        type: input.type as never,
        title: input.title,
        body: input.body,
        channel: 'INAPP' as const,
        metadata: meta,
        sentAt: new Date(),
      })),
    });

    this.gateway.emitToOrg(input.orgId, 'notification:new', {
      title: input.title,
      body: input.body,
      type: input.type,
    });
  }
}
