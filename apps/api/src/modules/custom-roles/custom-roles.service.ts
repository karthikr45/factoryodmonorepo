import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

import { ROLE_TEMPLATES, PERMISSION_GROUPS } from './role-permissions';

@Injectable()
export class CustomRolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed default role templates for a new factory.
   */
  async seedSystemRoles(orgId: string): Promise<{ created: number }> {
    let created = 0;
    for (const t of ROLE_TEMPLATES) {
      const existing = await this.prisma.client.customRole.findFirst({
        where: { orgId, name: t.name },
      });
      if (existing) continue;
      await this.prisma.client.customRole.create({
        data: {
          orgId, name: t.name, description: t.description,
          permissions: t.permissions as never,
          isSystem: true, icon: t.icon, color: t.color,
        },
      });
      created++;
    }
    return { created };
  }

  listPermissionGroups(): typeof PERMISSION_GROUPS {
    return PERMISSION_GROUPS;
  }

  async list(orgId: string): Promise<Array<{
    id: string; name: string; description: string | null;
    permissions: string[]; isSystem: boolean;
    icon: string | null; color: string | null;
  }>> {
    const rows = await this.prisma.client.customRole.findMany({
      where: { orgId }, orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id, name: r.name, description: r.description,
      permissions: (r.permissions as string[]) ?? [],
      isSystem: r.isSystem, icon: r.icon, color: r.color,
    }));
  }

  async create(orgId: string, input: {
    name: string; description?: string;
    permissions: string[]; icon?: string; color?: string;
  }): Promise<{ id: string }> {
    const existing = await this.prisma.client.customRole.findFirst({
      where: { orgId, name: input.name },
    });
    if (existing) throw new BadRequestException('A role with this name already exists');

    const r = await this.prisma.client.customRole.create({
      data: {
        orgId, name: input.name, description: input.description ?? null,
        permissions: input.permissions as never,
        icon: input.icon ?? null, color: input.color ?? null, isSystem: false,
      },
    });
    return { id: r.id };
  }

  async update(orgId: string, id: string, input: {
    name?: string; description?: string;
    permissions?: string[]; icon?: string; color?: string;
  }): Promise<{ id: string }> {
    const existing = await this.prisma.client.customRole.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Role not found');
    await this.prisma.client.customRole.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.permissions !== undefined ? { permissions: input.permissions as never } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      },
    });
    return { id };
  }

  async delete(orgId: string, id: string): Promise<{ ok: true }> {
    const r = await this.prisma.client.customRole.findFirst({ where: { id, orgId } });
    if (!r) throw new NotFoundException('Role not found');
    if (r.isSystem) throw new BadRequestException('Cannot delete system role');
    await this.prisma.client.customRole.delete({ where: { id } });
    return { ok: true };
  }
}
