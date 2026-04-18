import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  refreshTokenSchema,
  requestOtpSchema,
  verifyOtpSchema,
  type RefreshTokenInput,
  type RequestOtpInput,
  type VerifyOtpInput,
} from '@repo/validators';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a 6-digit OTP to the given phone number' })
  @ApiResponse({ status: 200, description: 'OTP dispatched' })
  @UsePipes(new ZodValidationPipe(requestOtpSchema))
  async requestOtp(@Body() body: RequestOtpInput): Promise<{ expiresAt: Date }> {
    return this.authService.requestOtp(body.phone);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an OTP and exchange it for JWT tokens' })
  @ApiResponse({ status: 200, description: 'JWT pair returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async verifyOtp(
    @Body() body: VerifyOtpInput,
  ): ReturnType<AuthService['verifyOtp']> {
    return this.authService.verifyOtp(body.phone, body.code, body.inviteToken);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate access + refresh tokens' })
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(@Body() body: RefreshTokenInput): ReturnType<AuthService['refreshTokens']> {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Return the current authenticated user + organisation' })
  async me(@CurrentUser() user: AuthenticatedUser): ReturnType<AuthService['getCurrentUser']> {
    return this.authService.getCurrentUser(user.id);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out (stateless — client discards tokens)' })
  logout(): { ok: true } {
    return { ok: true };
  }

  /**
   * DEV ONLY — paste your JWT and see exactly why it passes or fails
   * verification. Remove before deploying to production.
   */
  @Public()
  @Get('debug-token')
  async debugToken(@Query('token') token: string): Promise<unknown> {
    if (!token) return { error: 'pass ?token=eyJ...' };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
    try {
      const decoded = jwt.verify(token, secret);
      return { status: 'VALID', secretPreview: `${secret.slice(0, 4)}...${secret.slice(-4)}`, decoded };
    } catch (err) {
      const raw = jwt.decode(token);
      return {
        status: 'INVALID',
        reason: err instanceof Error ? err.message : String(err),
        secretPreview: `${secret.slice(0, 4)}...${secret.slice(-4)}`,
        rawPayload: raw,
      };
    }
  }
}
