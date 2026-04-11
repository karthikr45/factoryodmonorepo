import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';

import { CustomersService } from './customers.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, CustomersService],
  exports: [OrdersService, CustomersService],
})
export class OrdersModule {}
