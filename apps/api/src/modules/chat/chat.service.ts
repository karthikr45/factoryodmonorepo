import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createRoom(orgId: string, userId: string, input: {
    name?: string; type?: string; memberIds: string[]; relatedType?: string; relatedId?: string;
  }): Promise<{ id: string }> {
    const allMembers = [...new Set([userId, ...input.memberIds])];
    const room = await this.prisma.client.chatRoom.create({
      data: {
        orgId, name: input.name ?? null,
        type: (input.type ?? 'GROUP') as never,
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
        members: { create: allMembers.map((uid) => ({ userId: uid })) },
      },
    });
    return { id: room.id };
  }

  async listRooms(orgId: string, userId: string): Promise<Array<{
    id: string; name: string | null; type: string; memberCount: number;
    lastMessage: { content: string; createdAt: Date; senderName: string } | null;
  }>> {
    const memberships = await this.prisma.client.chatMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            _count: { select: { members: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { name: true } } },
            },
          },
        },
      },
    });

    return memberships
      .filter((m) => m.room.orgId === orgId)
      .map((m) => ({
        id: m.room.id,
        name: m.room.name,
        type: m.room.type,
        memberCount: m.room._count.members,
        lastMessage: m.room.messages[0]
          ? {
              content: m.room.messages[0].content,
              createdAt: m.room.messages[0].createdAt,
              senderName: m.room.messages[0].sender.name,
            }
          : null,
      }));
  }

  async sendMessage(userId: string, input: {
    roomId: string; content: string; messageType?: string; fileUrl?: string; replyToId?: string;
  }): Promise<{ id: string; createdAt: Date }> {
    const membership = await this.prisma.client.chatMember.findUnique({
      where: { roomId_userId: { roomId: input.roomId, userId } },
    });
    if (!membership) throw new NotFoundException('You are not a member of this room');

    const msg = await this.prisma.client.chatMessage.create({
      data: {
        roomId: input.roomId, senderId: userId,
        content: input.content, messageType: (input.messageType ?? 'TEXT') as never,
        fileUrl: input.fileUrl ?? null, replyToId: input.replyToId ?? null,
      },
      include: { sender: { select: { name: true } } },
    });

    // Broadcast to all members via Socket.IO
    const room = await this.prisma.client.chatRoom.findUnique({
      where: { id: input.roomId },
      select: { orgId: true },
    });
    if (room) {
      this.gateway.emitToOrg(room.orgId, 'chat:message', {
        roomId: input.roomId, id: msg.id, content: msg.content,
        senderName: msg.sender.name, createdAt: msg.createdAt,
      });
    }

    return { id: msg.id, createdAt: msg.createdAt };
  }

  async getMessages(userId: string, roomId: string, limit = 50, before?: string): Promise<Array<{
    id: string; content: string; messageType: string; fileUrl: string | null;
    sender: { id: string; name: string }; createdAt: Date; replyToId: string | null;
  }>> {
    const membership = await this.prisma.client.chatMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) throw new NotFoundException('You are not a member of this room');

    const rows = await this.prisma.client.chatMessage.findMany({
      where: {
        roomId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.reverse().map((m) => ({
      id: m.id, content: m.content, messageType: m.messageType,
      fileUrl: m.fileUrl, sender: m.sender, createdAt: m.createdAt,
      replyToId: m.replyToId,
    }));
  }
}
