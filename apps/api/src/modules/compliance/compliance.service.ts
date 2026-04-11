import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ComplianceService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // GSTR-1 / GSTR-3B / GSTR-9 generation, EPF / ESIC challans, TDS reports.
}
