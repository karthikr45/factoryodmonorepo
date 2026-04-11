import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // Profit-per-order, cash flow, outstanding, audit reports — readable by factory owner + CA.
}
