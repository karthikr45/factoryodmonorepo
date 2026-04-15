import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PurchaseOrderStatus } from '@repo/types';
import type {
  CreatePurchaseOrderInput,
  CreateVendorInput,
  UpdatePurchaseOrderStatusInput,
} from '@repo/validators';

import { AccountingService } from '../../common/accounting/accounting.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

interface POItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number; // paise
  gstRate: number;   // percentage
}

@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
    private readonly gateway: NotificationsGateway,
    private readonly approvals: ApprovalsService,
  ) {}

  // ---- Vendors ----

  async listVendors(
    orgId: string,
    search?: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      phone: string;
      gstin: string | null;
      totalOrders: number;
      rating: number | null;
    }>
  > {
    const rows = await this.prisma.client.vendor.findMany({
      where: {
        orgId,
        ...(search
          ? { name: { contains: search, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
    return rows;
  }

  async createVendor(orgId: string, input: CreateVendorInput): Promise<{ id: string }> {
    const v = await this.prisma.client.vendor.create({
      data: {
        orgId,
        name: input.name,
        phone: input.phone,
        gstin: input.gstin ?? null,
        address: input.address ?? null,
      },
    });
    return { id: v.id };
  }

  // ---- Purchase orders ----

  async listPurchaseOrders(
    orgId: string,
    status?: PurchaseOrderStatus,
  ): Promise<
    Array<{
      id: string;
      poNumber: string;
      status: PurchaseOrderStatus;
      totalAmount: number;
      gstAmount: number;
      vendor: { id: string; name: string };
      expectedDate: Date | null;
      receivedDate: Date | null;
    }>
  > {
    const rows = await this.prisma.client.purchaseOrder.findMany({
      where: {
        orgId,
        ...(status ? { status } : {}),
      },
      include: { vendor: { select: { id: true, name: true } } },
      orderBy: { expectedDate: 'desc' },
      take: 200,
    });
    return rows.map((p) => ({
      id: p.id,
      poNumber: p.poNumber,
      status: p.status as PurchaseOrderStatus,
      totalAmount: Number(p.totalAmount),
      gstAmount: Number(p.gstAmount),
      vendor: p.vendor,
      expectedDate: p.expectedDate,
      receivedDate: p.receivedDate,
    }));
  }

  async getPurchaseOrder(orgId: string, id: string): Promise<{
    id: string;
    poNumber: string;
    status: PurchaseOrderStatus;
    items: POItem[];
    totalAmount: number;
    gstAmount: number;
    vendor: { id: string; name: string; gstin: string | null };
    expectedDate: Date | null;
    receivedDate: Date | null;
  }> {
    const po = await this.prisma.client.purchaseOrder.findFirst({
      where: { id, orgId },
      include: { vendor: { select: { id: true, name: true, gstin: true } } },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return {
      id: po.id,
      poNumber: po.poNumber,
      status: po.status as PurchaseOrderStatus,
      items: po.items as unknown as POItem[],
      totalAmount: Number(po.totalAmount),
      gstAmount: Number(po.gstAmount),
      vendor: po.vendor,
      expectedDate: po.expectedDate,
      receivedDate: po.receivedDate,
    };
  }

  async createPurchaseOrder(
    orgId: string,
    input: CreatePurchaseOrderInput,
    userId?: string,
  ): Promise<{ id: string; totalAmount: number; gstAmount: number; requiresApproval: boolean; approvalRequestIds: string[] }> {
    const vendor = await this.prisma.client.vendor.findFirst({
      where: { id: input.vendorId, orgId },
    });
    if (!vendor) throw new BadRequestException('Vendor not found in this organisation');

    let netPaise = 0n;
    let gstPaise = 0n;
    for (const item of input.items) {
      const lineNet = BigInt(Math.round(item.unitPrice * item.quantity));
      const lineGst = (lineNet * BigInt(Math.round(item.gstRate * 100))) / 10_000n;
      netPaise += lineNet;
      gstPaise += lineGst;
    }
    const totalPaise = netPaise + gstPaise;

    const po = await this.prisma.client.purchaseOrder.create({
      data: {
        orgId,
        vendorId: input.vendorId,
        poNumber: input.poNumber,
        items: input.items as unknown as object,
        totalAmount: totalPaise,
        gstAmount: gstPaise,
        status: 'DRAFT',
        expectedDate: input.expectedDate ?? null,
      },
    });

    // Fire approval rules on PO create. Rules match against total amount in rupees.
    let approvalResult = { requiresApproval: false, requestIds: [] as string[] };
    if (userId) {
      approvalResult = await this.approvals.fireEvent(orgId, {
        triggerType: 'PURCHASE_ORDER',
        subjectType: 'PO',
        subjectId: po.id,
        requestedBy: userId,
        fieldValue: Number(totalPaise) / 100, // rupees — matches how rules are configured
        metadata: {
          poNumber: po.poNumber,
          vendorName: vendor.name,
          totalRupees: Number(totalPaise) / 100,
        },
      });
    }

    return {
      id: po.id,
      totalAmount: Number(totalPaise),
      gstAmount: Number(gstPaise),
      requiresApproval: approvalResult.requiresApproval,
      approvalRequestIds: approvalResult.requestIds,
    };
  }

  /**
   * Transition a PO's status. When status becomes RECEIVED or PARTIALLY_RECEIVED,
   * trigger the auto-accounting entry for inventory + input GST + A/P.
   */
  async updateStatus(
    orgId: string,
    id: string,
    input: UpdatePurchaseOrderStatusInput,
  ): Promise<{ id: string; status: PurchaseOrderStatus }> {
    const po = await this.prisma.client.purchaseOrder.findFirst({
      where: { id, orgId },
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    const now = new Date();
    const updated = await this.prisma.client.purchaseOrder.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.status === 'RECEIVED' || input.status === 'PARTIALLY_RECEIVED'
          ? { receivedDate: now }
          : {}),
      },
    });

    if (input.status === 'RECEIVED' || input.status === 'PARTIALLY_RECEIVED') {
      await this.accounting.onPurchaseReceived({
        orgId,
        poId: id,
        poNumber: po.poNumber,
        totalPaise: po.totalAmount,
        gstPaise: po.gstAmount,
        date: now,
      });

      await this.prisma.client.vendor.update({
        where: { id: po.vendorId },
        data: { totalOrders: { increment: 1 } },
      });

      // Auto stock-in: try to match PO items to inventory items by description
      const poItems = po.items as Array<{ description: string; quantity: number; unit: string }>;
      for (const item of poItems) {
        const invItem = await this.prisma.client.inventoryItem.findFirst({
          where: { orgId, name: { contains: item.description, mode: 'insensitive' } },
        });
        if (invItem) {
          await this.prisma.client.inventoryItem.update({
            where: { id: invItem.id },
            data: { currentStock: { increment: item.quantity } },
          });
          await this.prisma.client.stockMovement.create({
            data: {
              inventoryItemId: invItem.id, orgId, type: 'IN',
              quantity: item.quantity, referenceType: 'PURCHASE',
              referenceId: id, notes: `Auto stock-in from PO ${po.poNumber}`,
              createdBy: orgId, // system
            },
          });
        }
      }
    }

    this.gateway.emitToOrg(orgId, 'po:status_changed', {
      id,
      status: input.status,
    });

    return { id: updated.id, status: updated.status as PurchaseOrderStatus };
  }
}
