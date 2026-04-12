import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, category?: string): Promise<Array<{
    id: string; name: string; sku: string | null; unit: string;
    currentStock: number; minimumStock: number; location: string | null;
    category: string | null; costPerUnit: number; isLowStock: boolean;
  }>> {
    const items = await this.prisma.client.inventoryItem.findMany({
      where: { orgId, ...(category ? { category } : {}) },
      orderBy: { name: 'asc' },
    });
    return items.map((i) => ({
      id: i.id, name: i.name, sku: i.sku, unit: i.unit,
      currentStock: i.currentStock, minimumStock: i.minimumStock,
      location: i.location, category: i.category,
      costPerUnit: Number(i.costPerUnit),
      isLowStock: i.currentStock <= i.minimumStock,
    }));
  }

  async create(orgId: string, input: {
    name: string; sku?: string; unit: string; currentStock?: number;
    minimumStock?: number; location?: string; category?: string; costPerUnit?: number;
  }): Promise<{ id: string }> {
    const item = await this.prisma.client.inventoryItem.create({
      data: {
        orgId, name: input.name, sku: input.sku ?? null, unit: input.unit,
        currentStock: input.currentStock ?? 0, minimumStock: input.minimumStock ?? 0,
        location: input.location ?? null, category: input.category ?? null,
        costPerUnit: BigInt(input.costPerUnit ?? 0),
      },
    });
    return { id: item.id };
  }

  async stockIn(orgId: string, userId: string, input: {
    inventoryItemId: string; quantity: number; referenceType?: string;
    referenceId?: string; notes?: string;
  }): Promise<{ newStock: number }> {
    const item = await this.prisma.client.inventoryItem.findFirst({
      where: { id: input.inventoryItemId, orgId },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    await this.prisma.client.stockMovement.create({
      data: {
        inventoryItemId: input.inventoryItemId, orgId, type: 'IN',
        quantity: input.quantity, referenceType: (input.referenceType ?? 'MANUAL') as never,
        referenceId: input.referenceId ?? null, notes: input.notes ?? null,
        createdBy: userId,
      },
    });

    const updated = await this.prisma.client.inventoryItem.update({
      where: { id: input.inventoryItemId },
      data: { currentStock: { increment: input.quantity } },
    });
    return { newStock: updated.currentStock };
  }

  async stockOut(orgId: string, userId: string, input: {
    inventoryItemId: string; quantity: number; referenceType?: string;
    referenceId?: string; notes?: string;
  }): Promise<{ newStock: number }> {
    const item = await this.prisma.client.inventoryItem.findFirst({
      where: { id: input.inventoryItemId, orgId },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    if (item.currentStock < input.quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${item.currentStock} ${item.unit}`);
    }

    await this.prisma.client.stockMovement.create({
      data: {
        inventoryItemId: input.inventoryItemId, orgId, type: 'OUT',
        quantity: input.quantity, referenceType: (input.referenceType ?? 'MANUAL') as never,
        referenceId: input.referenceId ?? null, notes: input.notes ?? null,
        createdBy: userId,
      },
    });

    const updated = await this.prisma.client.inventoryItem.update({
      where: { id: input.inventoryItemId },
      data: { currentStock: { decrement: input.quantity } },
    });
    return { newStock: updated.currentStock };
  }

  async movements(orgId: string, inventoryItemId?: string, limit = 50): Promise<Array<{
    id: string; type: string; quantity: number; referenceType: string;
    notes: string | null; createdAt: Date; item: { name: string; unit: string };
  }>> {
    const rows = await this.prisma.client.stockMovement.findMany({
      where: { orgId, ...(inventoryItemId ? { inventoryItemId } : {}) },
      include: { item: { select: { name: true, unit: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id, type: r.type, quantity: r.quantity,
      referenceType: r.referenceType, notes: r.notes,
      createdAt: r.createdAt, item: r.item,
    }));
  }

  async lowStockAlerts(orgId: string): Promise<Array<{
    id: string; name: string; currentStock: number; minimumStock: number; unit: string;
  }>> {
    return this.prisma.client.inventoryItem.findMany({
      where: { orgId, currentStock: { lte: this.prisma.client.inventoryItem.fields.minimumStock as never } },
    }).then(() =>
      // Prisma doesn't support column-to-column comparison easily, so do it manually:
      this.prisma.client.inventoryItem.findMany({ where: { orgId } })
        .then((items) => items
          .filter((i) => i.currentStock <= i.minimumStock && i.minimumStock > 0)
          .map((i) => ({
            id: i.id, name: i.name, currentStock: i.currentStock,
            minimumStock: i.minimumStock, unit: i.unit,
          }))
        )
    );
  }
}
