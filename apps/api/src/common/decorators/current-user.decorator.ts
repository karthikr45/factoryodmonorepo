import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import type { UserRole } from '@repo/types';

export interface AuthenticatedUser {
  id: string;
  orgId: string;
  role: UserRole;
  phone: string;
}

/**
 * Inject the authenticated user from the JWT payload.
 * Usage: myRoute(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return req.user;
  },
);
