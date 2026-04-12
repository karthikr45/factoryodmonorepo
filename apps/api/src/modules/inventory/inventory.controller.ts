import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { InventoryService } from './inventory.service';

@ApiBearerAuth()
@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async list(@OrgId() orgId: string, @Query('category') category?: string): ReturnType<InventoryService['list']> {
    return this.inventoryService.list(orgId, category);
  }

  @Post()
  @ApiOperation({ summary: 'Create inventory item' })
  async create(@OrgId() orgId: string, @Body() body: {
    name: string; sku?: string; unit: string; currentStock?: number;
    minimumStock?: number; location?: string; category?: string; costPerUnit?: number;
  }): ReturnType<InventoryService['create']> {
    return this.inventoryService.create(orgId, body);
  }

  @Post('stock-in')
  @ApiOperation({ summary: 'Add stock (purchase received, return, etc.)' })
  async stockIn(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: {
    inventoryItemId: string; quantity: number; referenceType?: string; referenceId?: string; notes?: string;
  }): ReturnType<InventoryService['stockIn']> {
    return this.inventoryService.stockIn(orgId, user.id, body);
  }

  @Post('stock-out')
  @ApiOperation({ summary: 'Consume stock (production, damage, etc.)' })
  async stockOut(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: {
    inventoryItemId: string; quantity: number; referenceType?: string; referenceId?: string; notes?: string;
  }): ReturnType<InventoryService['stockOut']> {
    return this.inventoryService.stockOut(orgId, user.id, body);
  }

  @Get('movements')
  async movements(@OrgId() orgId: string, @Query('itemId') itemId?: string): ReturnType<InventoryService['movements']> {
    return this.inventoryService.movements(orgId, itemId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Items below minimum stock level' })
  async lowStock(@OrgId() orgId: string): ReturnType<InventoryService['lowStockAlerts']> {
    return this.inventoryService.lowStockAlerts(orgId);
  }
}
