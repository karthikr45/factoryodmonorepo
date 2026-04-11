import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { markReadSchema, type MarkReadInput } from '@repo/validators';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiQuery({ name: 'onlyUnread', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('onlyUnread') onlyUnread?: string,
    @Query('limit') limit?: string,
  ): ReturnType<NotificationsService['list']> {
    return this.notificationsService.list(user.id, {
      onlyUnread: onlyUnread === 'true',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('unread-count')
  async unreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): ReturnType<NotificationsService['unreadCount']> {
    return this.notificationsService.unreadCount(user.id);
  }

  @Post('mark-read')
  @UsePipes(new ZodValidationPipe(markReadSchema))
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: MarkReadInput,
  ): ReturnType<NotificationsService['markRead']> {
    return this.notificationsService.markRead(user.id, body.notificationIds);
  }
}
