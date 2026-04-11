import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Socket.IO gateway for real-time events.
 *
 * Rooms: one per orgId + one per userId.
 * Events: order:status_changed, jobcard:completed, attendance:marked,
 *         attendance:approved, ca:query_raised, notification:new.
 */
@WebSocketGateway({
  cors: { origin: (process.env.CORS_ORIGIN ?? '').split(',') || '*', credentials: true },
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  readonly server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToOrg<T>(orgId: string, event: string, payload: T): void {
    this.server.to(`org:${orgId}`).emit(event, payload);
  }

  emitToUser<T>(userId: string, event: string, payload: T): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
