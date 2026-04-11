import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';

import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ProcurementController],
  providers: [ProcurementService],
  exports: [ProcurementService],
})
export class ProcurementModule {}
