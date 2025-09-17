import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface JwtUser {
  user_id: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: unknown,
    user: unknown,
    info?: { message?: string; name?: string },
  ): TUser {
    if (err instanceof Error) {
      throw new UnauthorizedException(err.message);
    }
    if (!user) {
      const reason = info?.message || info?.name || 'Invalid or missing token';
      throw new UnauthorizedException(reason);
    }
    // Runtime shape check (minimal) before returning
    if (
      typeof user !== 'object' ||
      user === null ||
      typeof (user as Partial<JwtUser>).user_id !== 'number'
    ) {
      throw new UnauthorizedException('Malformed token payload');
    }
    return user as TUser;
  }
}
