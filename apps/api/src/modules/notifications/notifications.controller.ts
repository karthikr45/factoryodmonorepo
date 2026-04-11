import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly notificationsService: NotificationsService) {}
}
