import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OrgId } from '../../common/decorators/org-id.decorator';

import { WhatsAppService } from './whatsapp.service';

@ApiBearerAuth()
@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('send')
  async send(@OrgId() orgId: string, @Body() body: { phone: string; message: string }): ReturnType<WhatsAppService['sendText']> {
    return this.whatsappService.sendText(orgId, body.phone, body.message);
  }

  @Get('messages')
  async list(@OrgId() orgId: string, @Query('phone') phone?: string): ReturnType<WhatsAppService['listMessages']> {
    return this.whatsappService.listMessages(orgId, phone);
  }
}
