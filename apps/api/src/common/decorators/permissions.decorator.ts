import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Require one or more fine-grained permission keys on a route.
 * All listed permissions must be present (AND semantics).
 *
 * @example @RequirePermissions('orders.create')
 * @example @RequirePermissions('finance.view', 'reports.view')
 */
export const RequirePermissions = (...keys: string[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(PERMISSIONS_KEY, keys);
