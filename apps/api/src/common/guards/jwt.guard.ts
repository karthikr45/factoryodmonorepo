import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtGuard.name);

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
      const reason =
        (info && 'message' in info && typeof info.message === 'string'
          ? info.message
          : undefined) ??
        (info instanceof Error ? info.message : undefined) ??
        'Authentication required';
      // Print the exact reason to the API console so the developer doesn't
      // have to guess.
      this.logger.warn(`JWT rejected: ${reason}`);
      throw err ?? new UnauthorizedException(reason);
    }
    return user;
  }
}
