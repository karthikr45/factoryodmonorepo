import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './common/prisma/prisma.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { FinanceModule } from './modules/finance/finance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { ProductionModule } from './modules/production/production.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WorkersModule } from './modules/workers/workers.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
      { name: 'otp', ttl: 60_000, limit: 5 },
    ]),

    PrismaModule,
    AuthModule,
    OrganisationsModule,
    OrdersModule,
    ProductionModule,
    ProcurementModule,
    AttendanceModule,
    WorkersModule,
    FinanceModule,
    NotificationsModule,
    ComplianceModule,
    ReportsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
