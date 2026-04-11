import { Body, Controller, Get, Param, Post, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { generateGstReturnSchema, type GenerateGstReturnInput } from '@repo/validators';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { ComplianceService } from './compliance.service';

@ApiBearerAuth()
@ApiTags('compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('gst-returns')
  async listReturns(
    @OrgId() orgId: string,
  ): ReturnType<ComplianceService['listReturns']> {
    return this.complianceService.listReturns(orgId);
  }

  @Post('gst-returns/generate')
  @ApiOperation({ summary: 'Generate a GSTR-1 or GSTR-3B return for a period' })
  @UsePipes(new ZodValidationPipe(generateGstReturnSchema))
  async generate(
    @OrgId() orgId: string,
    @Body() body: GenerateGstReturnInput,
  ): ReturnType<ComplianceService['generateReturn']> {
    return this.complianceService.generateReturn(orgId, body);
  }

  @Post('gst-returns/:id/file')
  async markFiled(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ReturnType<ComplianceService['markFiled']> {
    return this.complianceService.markFiled(orgId, id, user.id);
  }
}
