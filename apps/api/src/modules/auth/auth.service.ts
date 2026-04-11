import { createHash, randomInt } from 'node:crypto';

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { AuthTokens, JwtPayload } from '@repo/types';

import { PrismaService } from '../../common/prisma/prisma.service';

import { TwilioService } from './twilio.service';

interface VerifyOtpResult {
  tokens: AuthTokens;
  user: {
    id: string;
    orgId: string;
    name: string;
    phone: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly ACCESS_TTL = process.env.JWT_EXPIRES_IN ?? '15m';
  private readonly REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly twilio: TwilioService,
  ) {}

  /**
   * Generate + store a 6-digit OTP, then dispatch over SMS.
   * Stores a sha256 hash — never the raw code.
   */
  async requestOtp(phone: string): Promise<{ expiresAt: Date }> {
    const code = randomInt(100_000, 1_000_000).toString();
    const hash = this.hashOtp(code);
    const expiresAt = new Date(Date.now() + this.OTP_TTL_MS);

    await this.prisma.client.oTP.create({
      data: { phone, code: hash, expiresAt, used: false },
    });

    await this.twilio.sendOtp(phone, code);
    this.logger.log(`OTP sent to ${phone}`);
    return { expiresAt };
  }

  /**
   * Verify an OTP and return a JWT pair.
   * On first-time login the user is NOT yet attached to an org — caller must then
   * hit POST /organisations/onboard to create or join one.
   */
  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    const hash = this.hashOtp(code);
    const record = await this.prisma.client.oTP.findFirst({
      where: { phone, code: hash, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    await this.prisma.client.oTP.update({
      where: { id: record.id },
      data: { used: true },
    });

    let user = await this.prisma.client.user.findUnique({ where: { phone } });
    if (!user) {
      // Unregistered phone: create a placeholder user with no org yet.
      // They will complete onboarding next.
      const placeholderOrg = await this.prisma.client.organisation.create({
        data: {
          name: `Pending ${phone.slice(-4)}`,
          type: 'FACTORY',
          plan: 'FREE',
          isActive: false,
        },
      });
      user = await this.prisma.client.user.create({
        data: {
          orgId: placeholderOrg.id,
          name: `User ${phone.slice(-4)}`,
          phone,
          role: 'OWNER',
        },
      });
    }

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.orgId, user.role, user.phone);
    return {
      tokens,
      user: {
        id: user.id,
        orgId: user.orgId,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  /**
   * Rotate tokens using a refresh token. New pair is issued and the old one becomes useless
   * (clients must always use the most recently issued refresh token).
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.client.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }

    return this.issueTokens(user.id, user.orgId, user.role, user.phone);
  }

  async getCurrentUser(userId: string): Promise<{
    id: string;
    orgId: string;
    name: string;
    phone: string;
    email: string | null;
    role: string;
    organisation: {
      id: string;
      name: string;
      type: string;
      plan: string;
      isActive: boolean;
    };
  }> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { organisation: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      orgId: user.orgId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      organisation: {
        id: user.organisation.id,
        name: user.organisation.name,
        type: user.organisation.type,
        plan: user.organisation.plan,
        isActive: user.organisation.isActive,
      },
    };
  }

  private async issueTokens(
    userId: string,
    orgId: string,
    role: string,
    phone: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, orgId, role, phone };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      expiresIn: this.ACCESS_TTL,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      expiresIn: this.REFRESH_TTL,
    });

    // 15 min default — clients treat this as "refresh at least N seconds before".
    const expiresIn = this.parseTtlSeconds(this.ACCESS_TTL);
    return { accessToken, refreshToken, expiresIn };
  }

  private hashOtp(code: string): string {
    const salt = process.env.JWT_SECRET ?? 'dev-secret-change-me';
    return createHash('sha256').update(`${salt}:${code}`).digest('hex');
  }

  private parseTtlSeconds(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 900;
    const n = Number(match[1]);
    switch (match[2]) {
      case 's':
        return n;
      case 'm':
        return n * 60;
      case 'h':
        return n * 3600;
      case 'd':
        return n * 86400;
      default:
        return 900;
    }
  }
}
