import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly reportsService: ReportsService) {}
}
