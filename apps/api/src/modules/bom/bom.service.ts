import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BomService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, input: {
    productName: string; productCode?: string; notes?: string;
    items: Array<{ inventoryItemId: string; quantity: number; unit: string; wastagePercent?: number }>;
  }): Promise<{ id: string }> {
    const bom = await this.prisma.client.billOfMaterial.create({
      data: {
        orgId, productName: input.productName,
        productCode: input.productCode ?? null, notes: input.notes ?? null,
        items: {
          create: input.items.map((i) => ({
            inventoryItemId: i.inventoryItemId, quantity: i.quantity,
            unit: i.unit, wastagePercent: i.wastagePercent ?? 0,
          })),
        },
      },
    });
    return { id: bom.id };
  }

  async list(orgId: string): Promise<Array<{
    id: string; productName: string; productCode: string | null;
    itemCount: number; isActive: boolean;
  }>> {
    const boms = await this.prisma.client.billOfMaterial.findMany({
      where: { orgId, isActive: true },
      include: { _count: { select: { items: true } } },
      orderBy: { productName: 'asc' },
    });
    return boms.map((b) => ({
      id: b.id, productName: b.productName, productCode: b.productCode,
      itemCount: b._count.items, isActive: b.isActive,
    }));
  }

  async get(orgId: string, id: string): Promise<{
    id: string; productName: string; productCode: string | null; notes: string | null;
    items: Array<{
      id: string; inventoryItem: { id: string; name: string; unit: string; currentStock: number };
      quantity: number; unit: string; wastagePercent: number;
    }>;
  }> {
    const bom = await this.prisma.client.billOfMaterial.findFirst({
      where: { id, orgId },
      include: {
        items: {
          include: { inventoryItem: { select: { id: true, name: true, unit: true, currentStock: true } } },
        },
      },
    });
    if (!bom) throw new NotFoundException('BOM not found');
    return {
      id: bom.id, productName: bom.productName, productCode: bom.productCode,
      notes: bom.notes,
      items: bom.items.map((i) => ({
        id: i.id, inventoryItem: i.inventoryItem,
        quantity: i.quantity, unit: i.unit, wastagePercent: i.wastagePercent,
      })),
    };
  }

  /**
   * Calculate material requirements for a given quantity of a product.
   * Accounts for wastage percentage in the BOM.
   */
  async calculateRequirements(orgId: string, bomId: string, orderQuantity: number): Promise<{
    requirements: Array<{
      inventoryItem: { id: string; name: string; unit: string; currentStock: number };
      requiredQuantity: number;
      availableStock: number;
      shortfall: number;
    }>;
  }> {
    const bom = await this.get(orgId, bomId);
    return {
      requirements: bom.items.map((item) => {
        const withWastage = item.quantity * orderQuantity * (1 + item.wastagePercent / 100);
        const required = Math.ceil(withWastage * 100) / 100;
        const available = item.inventoryItem.currentStock;
        return {
          inventoryItem: item.inventoryItem,
          requiredQuantity: required,
          availableStock: available,
          shortfall: Math.max(0, required - available),
        };
      }),
    };
  }
}
