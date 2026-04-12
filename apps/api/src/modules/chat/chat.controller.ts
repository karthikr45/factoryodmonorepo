import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { ChatService } from './chat.service';

@ApiBearerAuth()
@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  async createRoom(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: {
    name?: string; type?: string; memberIds: string[]; relatedType?: string; relatedId?: string;
  }): ReturnType<ChatService['createRoom']> {
    return this.chatService.createRoom(orgId, user.id, body);
  }

  @Get('rooms')
  async listRooms(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser): ReturnType<ChatService['listRooms']> {
    return this.chatService.listRooms(orgId, user.id);
  }

  @Post('messages')
  async sendMessage(@CurrentUser() user: AuthenticatedUser, @Body() body: {
    roomId: string; content: string; messageType?: string; fileUrl?: string; replyToId?: string;
  }): ReturnType<ChatService['sendMessage']> {
    return this.chatService.sendMessage(user.id, body);
  }

  @Get('rooms/:roomId/messages')
  async getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ): ReturnType<ChatService['getMessages']> {
    return this.chatService.getMessages(user.id, roomId, limit ? Number(limit) : 50, before);
  }
}
