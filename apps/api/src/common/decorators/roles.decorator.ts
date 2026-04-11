import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '@repo/types';

export const ROLES_KEY = 'roles';

/**
 * Restrict a controller or handler to specific user roles.
 * @example @Roles('OWNER', 'MANAGER')
 */
export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
