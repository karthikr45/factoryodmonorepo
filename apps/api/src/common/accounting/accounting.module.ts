import { Global, Module } from '@nestjs/common';

import { AccountingService } from './accounting.service';

/**
 * Global accounting module. Every domain module can inject AccountingService.
 */
@Global()
@Module({
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
