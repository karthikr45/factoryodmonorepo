import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { OrganisationsService } from './organisations.service';

@ApiTags('organisations')
@Controller('organisations')
export class OrganisationsController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly organisationsService: OrganisationsService) {}
}
