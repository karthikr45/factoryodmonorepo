import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';

import { VideoCallsController } from './video-calls.controller';
import { VideoCallsService } from './video-calls.service';

@Module({
  imports: [NotificationsModule],
  controllers: [VideoCallsController],
  providers: [VideoCallsService],
  exports: [VideoCallsService],
})
export class VideoCallsModule {}
