import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtGuard } from '../../common/guards/jwt.guard';
import { InvitationsModule } from '../invitations/invitations.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TwilioService } from './twilio.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN
          ?? (process.env.NODE_ENV === 'production' ? '15m' : '8h'),
      },
    }),
    InvitationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TwilioService,
    // Register JwtGuard as the DEFAULT guard for every route.
    // Endpoints opt out with @Public().
    { provide: APP_GUARD, useClass: JwtGuard },
  ],
  exports: [AuthService, JwtStrategy, TwilioService],
})
export class AuthModule {}
