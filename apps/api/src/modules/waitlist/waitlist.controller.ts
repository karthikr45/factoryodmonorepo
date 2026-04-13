import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';

import { WaitlistService } from './waitlist.service';

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly service: WaitlistService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Join the pre-launch waitlist' })
  async join(@Body() body: Parameters<WaitlistService['join']>[0]): ReturnType<WaitlistService['join']> {
    return this.service.join(body);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Super admin: see waitlist stats' })
  async list(): ReturnType<WaitlistService['list']> {
    return this.service.list();
  }
}
