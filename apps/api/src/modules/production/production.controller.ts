import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ProductionService } from './production.service';

@ApiTags('production')
@Controller('production')
export class ProductionController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly productionService: ProductionService) {}
}
