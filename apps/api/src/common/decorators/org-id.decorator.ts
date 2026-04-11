import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * Convenience decorator to pull orgId off the authenticated user directly.
 * Every service method should receive orgId from this — never from the request body.
 */
export const OrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<{ user: { orgId: string } }>();
  return req.user.orgId;
});
