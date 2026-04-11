import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ProcurementService } from './procurement.service';

@ApiTags('procurement')
@Controller('procurement')
export class ProcurementController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly procurementService: ProcurementService) {}
}
