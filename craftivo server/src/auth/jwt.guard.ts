import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface JwtUser {
  user_id: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  handleRequest<TUser = any>(
    err: unknown,
    user: unknown,
    info?: { message?: string; name?: string },
  ): TUser {
    if (err instanceof Error) {
      this.logger.warn(`JWT error: ${err.message}`);
      throw new UnauthorizedException(err.message);
    }
    if (!user) {
      const reason = info?.message || info?.name || 'Invalid or missing token';
      this.logger.debug(`JWT missing/invalid: ${reason}`);
      throw new UnauthorizedException(reason);
    }
    // Runtime shape check (minimal) before returning
    if (
      typeof user !== 'object' ||
      user === null ||
      typeof (user as Partial<JwtUser>).user_id !== 'number'
    ) {
      this.logger.warn('JWT payload shape invalid');
      throw new UnauthorizedException('Malformed token payload');
    }
    return user as TUser;
  }
}
