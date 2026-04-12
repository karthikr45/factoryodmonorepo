import { Module } from '@nestjs/common';

import { EmployeesService } from './employees.service';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';

@Module({
  controllers: [OrganisationsController],
  providers: [OrganisationsService, EmployeesService],
  exports: [OrganisationsService, EmployeesService],
})
export class OrganisationsModule {}
