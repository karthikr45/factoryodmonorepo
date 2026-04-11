import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JobCardStatus } from '@repo/types';
import {
  assignJobCardSchema,
  createDepartmentSchema,
  createJobCardsSchema,
  updateJobCardStatusSchema,
  type AssignJobCardInput,
  type CreateDepartmentInput,
  type CreateJobCardsInput,
  type UpdateJobCardStatusInput,
} from '@repo/validators';

import { OrgId } from '../../common/decorators/org-id.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { ProductionService } from './production.service';

@ApiBearerAuth()
@ApiTags('production')
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('departments')
  @ApiOperation({ summary: 'List all departments in the factory' })
  async listDepartments(
    @OrgId() orgId: string,
  ): ReturnType<ProductionService['listDepartments']> {
    return this.productionService.listDepartments(orgId);
  }

  @Post('departments')
  @UsePipes(new ZodValidationPipe(createDepartmentSchema))
  async createDepartment(
    @OrgId() orgId: string,
    @Body() body: CreateDepartmentInput,
  ): ReturnType<ProductionService['createDepartment']> {
    return this.productionService.createDepartment(orgId, body);
  }

  @Post('job-cards')
  @ApiOperation({ summary: 'Generate job cards for an order' })
  @UsePipes(new ZodValidationPipe(createJobCardsSchema))
  async createJobCards(
    @OrgId() orgId: string,
    @Body() body: CreateJobCardsInput,
  ): ReturnType<ProductionService['createJobCards']> {
    return this.productionService.createJobCards(orgId, body);
  }

  @Get('job-cards')
  @ApiOperation({ summary: 'List job cards with filters' })
  @ApiQuery({ name: 'status', required: false, enum: JobCardStatus })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  async listJobCards(
    @OrgId() orgId: string,
    @Query('status') status?: JobCardStatus,
    @Query('departmentId') departmentId?: string,
    @Query('orderId') orderId?: string,
  ): ReturnType<ProductionService['listJobCards']> {
    return this.productionService.listJobCards(orgId, { status, departmentId, orderId });
  }

  @Post('job-cards/:id/assign')
  @UsePipes(new ZodValidationPipe(assignJobCardSchema))
  async assign(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: AssignJobCardInput,
  ): ReturnType<ProductionService['assign']> {
    return this.productionService.assign(orgId, id, body);
  }

  @Post('job-cards/:id/status')
  @UsePipes(new ZodValidationPipe(updateJobCardStatusSchema))
  async updateStatus(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateJobCardStatusInput,
  ): ReturnType<ProductionService['updateStatus']> {
    return this.productionService.updateStatus(orgId, id, body);
  }
}
