import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AttendanceService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // Mark / approve / dispute attendance. Broadcasts Socket.IO events to factory owner + agency.
}
