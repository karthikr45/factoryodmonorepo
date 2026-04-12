import { randomBytes } from 'node:crypto';

import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

/**
 * Video call management.
 * Uses a unique room token per call. Clients connect via WebRTC using
 * a provider like Daily.co, 100ms, or LiveKit. This service manages
 * the call lifecycle and metadata; actual signaling is client-side.
 */
@Injectable()
export class VideoCallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async initiate(orgId: string, userId: string, input: {
    callType?: string; participantIds: string[]; relatedType?: string; relatedId?: string;
  }): Promise<{ id: string; roomToken: string }> {
    const roomToken = randomBytes(16).toString('hex');
    const participants = [...new Set([userId, ...input.participantIds])];

    const call = await this.prisma.client.videoCall.create({
      data: {
        orgId, roomToken, initiatedBy: userId,
        callType: input.callType ?? 'VIDEO',
        status: 'RINGING',
        participants: participants,
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
      },
    });

    // Notify each participant via socket
    for (const pid of input.participantIds) {
      this.gateway.emitToUser(pid, 'call:incoming', {
        callId: call.id, roomToken, callType: input.callType ?? 'VIDEO',
        from: userId, relatedType: input.relatedType, relatedId: input.relatedId,
      });
    }

    return { id: call.id, roomToken };
  }

  async accept(callId: string): Promise<{ roomToken: string }> {
    const call = await this.prisma.client.videoCall.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');

    await this.prisma.client.videoCall.update({
      where: { id: callId },
      data: { status: 'ACTIVE' },
    });
    return { roomToken: call.roomToken };
  }

  async end(callId: string): Promise<{ durationSecs: number }> {
    const call = await this.prisma.client.videoCall.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');

    const durationSecs = Math.round((Date.now() - call.startedAt.getTime()) / 1000);
    await this.prisma.client.videoCall.update({
      where: { id: callId },
      data: { status: 'ENDED', endedAt: new Date(), durationSecs },
    });

    return { durationSecs };
  }

  async history(orgId: string, limit = 20): Promise<Array<{
    id: string; callType: string; status: string; participants: unknown;
    initiator: { id: string; name: string }; startedAt: Date; endedAt: Date | null;
    durationSecs: number | null;
  }>> {
    const rows = await this.prisma.client.videoCall.findMany({
      where: { orgId },
      include: { initiator: { select: { id: true, name: true } } },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id, callType: r.callType, status: r.status,
      participants: r.participants, initiator: r.initiator,
      startedAt: r.startedAt, endedAt: r.endedAt, durationSecs: r.durationSecs,
    }));
  }
}
