import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { WorkersService } from './workers.service';

@ApiTags('workers')
@Controller('workers')
export class WorkersController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly workersService: WorkersService) {}
}
