import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OrgId } from '../../common/decorators/org-id.decorator';

import { BomService } from './bom.service';

@ApiBearerAuth()
@ApiTags('bom')
@Controller('bom')
export class BomController {
  constructor(private readonly bomService: BomService) {}

  @Post()
  async create(@OrgId() orgId: string, @Body() body: {
    productName: string; productCode?: string; notes?: string;
    items: Array<{ inventoryItemId: string; quantity: number; unit: string; wastagePercent?: number }>;
  }): ReturnType<BomService['create']> {
    return this.bomService.create(orgId, body);
  }

  @Get()
  async list(@OrgId() orgId: string): ReturnType<BomService['list']> {
    return this.bomService.list(orgId);
  }

  @Get(':id')
  async get(@OrgId() orgId: string, @Param('id') id: string): ReturnType<BomService['get']> {
    return this.bomService.get(orgId, id);
  }

  @Get(':id/requirements')
  async requirements(@OrgId() orgId: string, @Param('id') id: string, @Query('quantity') quantity: string): ReturnType<BomService['calculateRequirements']> {
    return this.bomService.calculateRequirements(orgId, id, Number(quantity || 1));
  }
}
