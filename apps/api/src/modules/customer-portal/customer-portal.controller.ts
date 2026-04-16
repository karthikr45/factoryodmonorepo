import { BadRequestException, Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { QuotationsService } from '../quotations/quotations.service';

import { CustomerPortalService } from './customer-portal.service';

@Public()
@ApiTags('customer-portal')
@Controller('customer-portal')
export class CustomerPortalController {
  constructor(
    private readonly portal: CustomerPortalService,
    private readonly invoices: InvoicesService,
    private readonly quotations: QuotationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('lookup')
  @ApiOperation({ summary: 'Customer-facing order tracker. 404 if phone+order combo does not match.' })
  async lookup(
    @Query('orderNumber') orderNumber: string,
    @Query('phone') phone: string,
  ): ReturnType<CustomerPortalService['lookup']> {
    if (!orderNumber || !phone) throw new BadRequestException('orderNumber and phone are required');
    return this.portal.lookup(orderNumber, phone);
  }

  @Get('invoice/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async invoicePdf(
    @Param('id') id: string,
    @Query('phone') phone: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!phone) throw new BadRequestException('phone is required');
    await this.portal.assertCanReadInvoice(id, phone);
    const inv = await this.prisma.client.invoice.findUnique({ where: { id }, select: { orgId: true } });
    if (!inv) throw new BadRequestException('Invoice not found');
    const { buffer, filename } = await this.invoices.getPdf(inv.orgId, id);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }

  @Get('quotation/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async quotationPdf(
    @Param('id') id: string,
    @Query('phone') phone: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!phone) throw new BadRequestException('phone is required');
    await this.portal.assertCanReadQuotation(id, phone);
    const q = await this.prisma.client.quotation.findUnique({ where: { id }, select: { orgId: true } });
    if (!q) throw new BadRequestException('Quotation not found');
    const { buffer, filename } = await this.quotations.getPdf(q.orgId, id);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }
}
