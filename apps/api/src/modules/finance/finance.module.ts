import { Module } from '@nestjs/common';

import { RelationshipsModule } from '../relationships/relationships.module';

import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [RelationshipsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
