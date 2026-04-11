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

import { PurchaseOrderStatus } from '@repo/types';
import {
  createPurchaseOrderSchema,
  createVendorSchema,
  updatePurchaseOrderStatusSchema,
  type CreatePurchaseOrderInput,
  type CreateVendorInput,
  type UpdatePurchaseOrderStatusInput,
} from '@repo/validators';

import { OrgId } from '../../common/decorators/org-id.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { ProcurementService } from './procurement.service';

@ApiBearerAuth()
@ApiTags('procurement')
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  // ---- Vendors ----
  @Get('vendors')
  @ApiQuery({ name: 'search', required: false })
  async listVendors(
    @OrgId() orgId: string,
    @Query('search') search?: string,
  ): ReturnType<ProcurementService['listVendors']> {
    return this.procurementService.listVendors(orgId, search);
  }

  @Post('vendors')
  @UsePipes(new ZodValidationPipe(createVendorSchema))
  async createVendor(
    @OrgId() orgId: string,
    @Body() body: CreateVendorInput,
  ): ReturnType<ProcurementService['createVendor']> {
    return this.procurementService.createVendor(orgId, body);
  }

  // ---- Purchase orders ----
  @Get('purchase-orders')
  @ApiQuery({ name: 'status', required: false, enum: PurchaseOrderStatus })
  async listPOs(
    @OrgId() orgId: string,
    @Query('status') status?: PurchaseOrderStatus,
  ): ReturnType<ProcurementService['listPurchaseOrders']> {
    return this.procurementService.listPurchaseOrders(orgId, status);
  }

  @Get('purchase-orders/:id')
  async getPO(
    @OrgId() orgId: string,
    @Param('id') id: string,
  ): ReturnType<ProcurementService['getPurchaseOrder']> {
    return this.procurementService.getPurchaseOrder(orgId, id);
  }

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Create a new purchase order' })
  @UsePipes(new ZodValidationPipe(createPurchaseOrderSchema))
  async createPO(
    @OrgId() orgId: string,
    @Body() body: CreatePurchaseOrderInput,
  ): ReturnType<ProcurementService['createPurchaseOrder']> {
    return this.procurementService.createPurchaseOrder(orgId, body);
  }

  @Patch('purchase-orders/:id/status')
  @ApiOperation({ summary: 'Mark a PO received (triggers auto-journal)' })
  @UsePipes(new ZodValidationPipe(updatePurchaseOrderStatusSchema))
  async updateStatus(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdatePurchaseOrderStatusInput,
  ): ReturnType<ProcurementService['updateStatus']> {
    return this.procurementService.updateStatus(orgId, id, body);
  }
}
