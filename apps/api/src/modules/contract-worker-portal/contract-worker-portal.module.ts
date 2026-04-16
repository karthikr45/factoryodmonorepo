import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from '../auth/auth.module';
import { WorkersModule } from '../workers/workers.module';

import { ContractWorkerPortalController } from './contract-worker-portal.controller';
import { ContractWorkerPortalService } from './contract-worker-portal.service';

@Module({
  imports: [
    AuthModule, // re-export TwilioService
    WorkersModule,
    JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev-secret-change-me' }),
  ],
  controllers: [ContractWorkerPortalController],
  providers: [ContractWorkerPortalService],
})
export class ContractWorkerPortalModule {}
