import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

interface AuthUser {
  user_id?: number | string;
  role?: string;
  email?: string;
}
type AuthRequest = Request & { user?: AuthUser };

/**
 * Extracts the authenticated user's id from request.user.user_id.
 * Also works for ApiKeyGuard which injects req.user = { user_id } for ingest.
 */
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const raw = request.user?.user_id;
    const id = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(id)) {
      throw new UnauthorizedException('Authenticated user id missing');
    }
    return id;
  },
);
