import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';

import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';

@Module({
  imports: [NotificationsModule],
  controllers: [CheckInController],
  providers: [CheckInService],
  exports: [CheckInService],
})
export class CheckInModule {}
