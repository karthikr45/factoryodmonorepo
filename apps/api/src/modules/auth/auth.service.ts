import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly prisma: PrismaService) {}

  // To be implemented: requestOtp, verifyOtp, refreshTokens, logout, getCurrentUser
}
