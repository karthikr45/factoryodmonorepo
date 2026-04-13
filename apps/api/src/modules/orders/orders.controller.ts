import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { OrderStatus } from '@repo/types';
import {
  changeOrderStatusSchema,
  createCustomerSchema,
  createOrderSchema,
  updateCustomerSchema,
  updateOrderSchema,
  type ChangeOrderStatusInput,
  type CreateCustomerInput,
  type CreateOrderInput,
  type UpdateCustomerInput,
  type UpdateOrderInput,
} from '@repo/validators';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { CustomersService } from './customers.service';
import { OrdersService } from './orders.service';

@ApiBearerAuth()
@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
  ) {}

  // ---- Customers ----
  @Get('customers')
  @ApiOperation({ summary: 'List customers for the current org' })
  @ApiQuery({ name: 'search', required: false })
  async listCustomers(
    @OrgId() orgId: string,
    @Query('search') search?: string,
  ): ReturnType<CustomersService['list']> {
    return this.customersService.list(orgId, search);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get a single customer' })
  async getCustomer(
    @OrgId() orgId: string,
    @Param('id') id: string,
  ): ReturnType<CustomersService['get']> {
    return this.customersService.get(orgId, id);
  }

  @Post('customers')
  @UsePipes(new ZodValidationPipe(createCustomerSchema))
  async createCustomer(
    @OrgId() orgId: string,
    @Body() body: CreateCustomerInput,
  ): ReturnType<CustomersService['create']> {
    return this.customersService.create(orgId, body);
  }

  @Patch('customers/:id')
  @UsePipes(new ZodValidationPipe(updateCustomerSchema))
  async updateCustomer(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateCustomerInput,
  ): ReturnType<CustomersService['update']> {
    return this.customersService.update(orgId, id, body);
  }

  // ---- Orders ----
  @Get('orders')
  @ApiOperation({ summary: 'List orders with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'search', required: false })
  async listOrders(
    @OrgId() orgId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
  ): ReturnType<OrdersService['list']> {
    return this.ordersService.list(orgId, {
      page: Number(page ?? 1),
      pageSize: Math.min(Number(pageSize ?? 20), 100),
      status,
      search,
    });
  }

  @Get('orders/:id/lifecycle')
  @ApiOperation({ summary: 'Full order lifecycle — quote + job cards + QC + dispatch + invoice' })
  async getOrderLifecycle(
    @OrgId() orgId: string,
    @Param('id') id: string,
  ): ReturnType<OrdersService['getLifecycle']> {
    return this.ordersService.getLifecycle(orgId, id);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order detail including job cards' })
  async getOrder(
    @OrgId() orgId: string,
    @Param('id') id: string,
  ): ReturnType<OrdersService['get']> {
    return this.ordersService.get(orgId, id);
  }

  @Post('orders')
  @UsePipes(new ZodValidationPipe(createOrderSchema))
  async createOrder(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateOrderInput,
  ): ReturnType<OrdersService['create']> {
    return this.ordersService.create(orgId, user.id, body);
  }

  @Post('orders/with-customer')
  @ApiOperation({ summary: 'Create order + customer (if new) in one atomic transaction' })
  async createOrderWithCustomer(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: Parameters<OrdersService['createWithCustomer']>[2],
  ): ReturnType<OrdersService['createWithCustomer']> {
    return this.ordersService.createWithCustomer(orgId, user.id, body);
  }

  @Patch('orders/:id')
  @UsePipes(new ZodValidationPipe(updateOrderSchema))
  async updateOrder(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateOrderInput,
  ): ReturnType<OrdersService['update']> {
    return this.ordersService.update(orgId, id, body);
  }

  @Post('orders/:id/status')
  @UsePipes(new ZodValidationPipe(changeOrderStatusSchema))
  async changeStatus(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: ChangeOrderStatusInput,
  ): ReturnType<OrdersService['changeStatus']> {
    return this.ordersService.changeStatus(orgId, user.id, id, body);
  }

  @Post('orders/:id/payments')
  async recordPayment(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: { amountPaise: number },
  ): ReturnType<OrdersService['recordPayment']> {
    return this.ordersService.recordPayment(orgId, id, body.amountPaise);
  }
}
