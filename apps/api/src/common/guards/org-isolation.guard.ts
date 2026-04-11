import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

interface RequestUser {
  id: string;
  orgId: string;
}

/**
 * Last-line multi-tenancy defense.
 * If any request body or param includes an orgId that differs from the JWT's orgId, reject it.
 * orgId is source-of-truth from the token — never from the request.
 */
@Injectable()
export class OrgIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user: RequestUser;
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
      params?: Record<string, unknown>;
    }>();

    const tokenOrgId = req.user?.orgId;
    if (!tokenOrgId) {
      throw new ForbiddenException('Missing organisation context');
    }

    const claimed = [req.body?.orgId, req.query?.orgId, req.params?.orgId].filter(
      (v): v is string => typeof v === 'string',
    );
    for (const candidate of claimed) {
      if (candidate !== tokenOrgId) {
        throw new ForbiddenException('Cross-organisation access is not permitted');
      }
    }
    return true;
  }
}
