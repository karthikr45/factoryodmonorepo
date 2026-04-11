import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ComplianceService } from './compliance.service';

@ApiTags('compliance')
@Controller('compliance')
export class ComplianceController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly complianceService: ComplianceService) {}
}
