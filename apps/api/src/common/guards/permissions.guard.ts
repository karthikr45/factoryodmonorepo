import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { DEFAULT_ROLE_PERMISSIONS } from '../../modules/custom-roles/role-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface RequestUser {
  id: string;
  orgId: string;
  role: string;
}

/**
 * Fine-grained permission enforcement. Runs after JwtGuard.
 *
 * Resolution order:
 *   1. If user has a customRoleId, permissions come from CustomRole.permissions.
 *   2. Otherwise, permissions come from DEFAULT_ROLE_PERMISSIONS[user.role].
 *   3. SUPER_ADMIN and OWNER are always allowed.
 *
 * Results are cached per-user for 60s to avoid per-request DB lookups.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly cache = new Map<string, { perms: Set<string>; expires: number }>();
  private static readonly TTL_MS = 60_000;

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    // Fast-path: owners and super admins bypass permission checks.
    if (user.role === 'OWNER' || user.role === 'SUPER_ADMIN') return true;

    const perms = await this.resolvePermissions(user.id, user.role);
    const missing = required.filter((p) => !perms.has(p));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Missing permission${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      );
    }
    return true;
  }

  private async resolvePermissions(userId: string, role: string): Promise<Set<string>> {
    const now = Date.now();
    const cached = this.cache.get(userId);
    if (cached && cached.expires > now) return cached.perms;

    const u = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { customRoleId: true, role: true },
    });

    let perms: string[];
    if (u?.customRoleId) {
      const cr = await this.prisma.client.customRole.findUnique({
        where: { id: u.customRoleId },
        select: { permissions: true },
      });
      perms = Array.isArray(cr?.permissions) ? (cr!.permissions as string[]) : [];
    } else {
      perms = DEFAULT_ROLE_PERMISSIONS[u?.role ?? role] ?? [];
    }

    const set = new Set(perms);
    this.cache.set(userId, { perms: set, expires: now + PermissionsGuard.TTL_MS });
    return set;
  }

  /** Public helper so services can invalidate a user when their role changes. */
  invalidate(userId: string): void {
    this.cache.delete(userId);
  }
}
