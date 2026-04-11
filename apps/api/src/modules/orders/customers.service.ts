import { Injectable, NotFoundException } from '@nestjs/common';

import type { CreateCustomerInput, UpdateCustomerInput } from '@repo/validators';

import { PrismaService } from '../../common/prisma/prisma.service';

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  gstin: string | null;
  outstandingAmount: number;
  creditLimit: number;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, search?: string): Promise<CustomerListItem[]> {
    const customers = await this.prisma.client.customer.findMany({
      where: {
        orgId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      gstin: c.gstin,
      outstandingAmount: Number(c.outstandingAmount),
      creditLimit: Number(c.creditLimit),
    }));
  }

  async get(orgId: string, id: string): Promise<CustomerListItem & { email: string | null; address: string | null }> {
    const c = await this.prisma.client.customer.findFirst({ where: { id, orgId } });
    if (!c) throw new NotFoundException('Customer not found');
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      gstin: c.gstin,
      address: c.address,
      outstandingAmount: Number(c.outstandingAmount),
      creditLimit: Number(c.creditLimit),
    };
  }

  async create(orgId: string, input: CreateCustomerInput): Promise<{ id: string }> {
    const c = await this.prisma.client.customer.create({
      data: {
        orgId,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        gstin: input.gstin ?? null,
        address: input.address ?? null,
        creditLimit: BigInt(input.creditLimit ?? 0),
      },
    });
    return { id: c.id };
  }

  async update(orgId: string, id: string, input: UpdateCustomerInput): Promise<{ id: string }> {
    const existing = await this.prisma.client.customer.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Customer not found');
    await this.prisma.client.customer.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.gstin !== undefined ? { gstin: input.gstin } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.creditLimit !== undefined
          ? { creditLimit: BigInt(input.creditLimit) }
          : {}),
      },
    });
    return { id };
  }

  async recordPayment(
    orgId: string,
    id: string,
    amountPaise: number,
  ): Promise<{ newOutstanding: number }> {
    const customer = await this.prisma.client.customer.findFirst({ where: { id, orgId } });
    if (!customer) throw new NotFoundException('Customer not found');
    const updated = await this.prisma.client.customer.update({
      where: { id },
      data: { outstandingAmount: { decrement: BigInt(amountPaise) } },
    });
    return { newOutstanding: Number(updated.outstandingAmount) };
  }
}
