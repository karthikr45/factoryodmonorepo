import { Module } from '@nestjs/common';

import { QualityCheckController } from './quality-check.controller';
import { QualityCheckService } from './quality-check.service';

@Module({
  controllers: [QualityCheckController],
  providers: [QualityCheckService],
  exports: [QualityCheckService],
})
export class QualityCheckModule {}
