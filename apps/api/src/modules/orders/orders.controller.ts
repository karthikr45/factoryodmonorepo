import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly ordersService: OrdersService) {}
}
