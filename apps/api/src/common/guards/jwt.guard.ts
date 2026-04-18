import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Default guard for every route. Any endpoint that doesn't set @Public() requires a valid JWT.
 */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  override handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser,
    info?: { name?: string; message?: string } | Error,
  ): TUser {
    if (err || !user) {
      // Surface passport's real reason ("jwt expired", "invalid signature",
      // "No auth token") — much easier to diagnose than a generic "required".
      const reason =
        (info && 'message' in info && typeof info.message === 'string'
          ? info.message
          : undefined) ??
        (info instanceof Error ? info.message : undefined) ??
        'Authentication required';
      throw err ?? new UnauthorizedException(reason);
    }
    return user;
  }
}
