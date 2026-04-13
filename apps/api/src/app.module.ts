import { resolve } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AccountingModule } from './common/accounting/accounting.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { BomModule } from './modules/bom/bom.module';
import { ChatModule } from './modules/chat/chat.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { CustomRolesModule } from './modules/custom-roles/custom-roles.module';
import { FilesModule } from './modules/files/files.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { ProductionModule } from './modules/production/production.module';
import { QualityCheckModule } from './modules/quality-check/quality-check.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { RelationshipsModule } from './modules/relationships/relationships.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { TransportModule } from './modules/transport/transport.module';
import { VideoCallsModule } from './modules/video-calls/video-calls.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { WorkersModule } from './modules/workers/workers.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '../../../.env'),
        resolve(__dirname, '../.env'),
        '.env',
      ],
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
      { name: 'otp', ttl: 60_000, limit: 5 },
    ]),

    // Infrastructure
    PrismaModule,
    AccountingModule,

    // Auth & Org
    AuthModule,
    OrganisationsModule,
    InvitationsModule,
    RelationshipsModule,
    SuperAdminModule,

    // Core operations
    OrdersModule,
    ProductionModule,
    ProcurementModule,
    AttendanceModule,
    WorkersModule,

    // Sprint 1: Files, Check-in, Inventory, QC
    FilesModule,
    CheckInModule,
    InventoryModule,
    QualityCheckModule,

    // Sprint 2: Transport, Quotations, Invoices
    TransportModule,
    QuotationsModule,
    InvoicesModule,

    // Sprint 3: Chat, BOM
    ChatModule,
    BomModule,

    // Sprint 4: WhatsApp
    WhatsAppModule,

    // Sprint 5: Video calls
    VideoCallsModule,

    // Workflow engine + governance (Option B-1)
    WorkflowsModule,
    CustomRolesModule,
    ApprovalsModule,
    WaitlistModule,

    // Finance, Compliance, Reports, Notifications
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
