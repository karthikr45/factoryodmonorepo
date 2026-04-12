import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { VideoCallsService } from './video-calls.service';

@ApiBearerAuth()
@ApiTags('video-calls')
@Controller('video-calls')
export class VideoCallsController {
  constructor(private readonly videoCallsService: VideoCallsService) {}

  @Post()
  async initiate(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: {
    callType?: string; participantIds: string[]; relatedType?: string; relatedId?: string;
  }): ReturnType<VideoCallsService['initiate']> {
    return this.videoCallsService.initiate(orgId, user.id, body);
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string): ReturnType<VideoCallsService['accept']> {
    return this.videoCallsService.accept(id);
  }

  @Post(':id/end')
  async end(@Param('id') id: string): ReturnType<VideoCallsService['end']> {
    return this.videoCallsService.end(id);
  }

  @Get('history')
  async history(@OrgId() orgId: string): ReturnType<VideoCallsService['history']> {
    return this.videoCallsService.history(orgId);
  }
}
