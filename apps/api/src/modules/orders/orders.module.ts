import { forwardRef, Module } from '@nestjs/common';

import { ApprovalsModule } from '../approvals/approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

import { CustomersService } from './customers.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [NotificationsModule, forwardRef(() => ApprovalsModule), WhatsAppModule],
  controllers: [OrdersController],
  providers: [OrdersService, CustomersService],
  exports: [OrdersService, CustomersService],
})
export class OrdersModule {}
