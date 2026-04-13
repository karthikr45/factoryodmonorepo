import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { AIAssistantService } from './ai-assistant.service';

@ApiBearerAuth()
@ApiTags('ai-assistant')
@Controller('ai')
export class AIAssistantController {
  constructor(private readonly service: AIAssistantService) {}

  @Post('generate-workflow')
  @ApiOperation({ summary: 'Generate a workflow draft from business description' })
  async generateWorkflow(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { description: string },
  ): ReturnType<AIAssistantService['generateWorkflow']> {
    return this.service.generateWorkflow(orgId, user.id, body.description);
  }

  @Post('ask')
  @ApiOperation({ summary: 'Natural language query against your factory data' })
  async ask(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { question: string },
  ): ReturnType<AIAssistantService['naturalLanguageQuery']> {
    return this.service.naturalLanguageQuery(orgId, user.id, body.question);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Real-time anomalies detected in your factory' })
  async anomalies(@OrgId() orgId: string): ReturnType<AIAssistantService['detectAnomalies']> {
    return this.service.detectAnomalies(orgId);
  }
}
