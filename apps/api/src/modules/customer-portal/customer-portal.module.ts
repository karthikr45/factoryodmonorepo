import { Module } from '@nestjs/common';

import { InvoicesModule } from '../invoices/invoices.module';
import { QuotationsModule } from '../quotations/quotations.module';

import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';

@Module({
  imports: [InvoicesModule, QuotationsModule],
  controllers: [CustomerPortalController],
  providers: [CustomerPortalService],
})
export class CustomerPortalModule {}
