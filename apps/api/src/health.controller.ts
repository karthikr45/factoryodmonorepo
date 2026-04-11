import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: 'ok'; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'factoryos-api',
      timestamp: new Date().toISOString(),
    };
  }
}
