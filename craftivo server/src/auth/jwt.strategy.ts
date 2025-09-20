/**
 * JWT Authentication Strategy
 *
 * Implements a hybrid JWT authentication system that supports both:
 * 1. Cookie-based authentication (for web browsers)
 * 2. Bearer token authentication (for mobile apps/APIs)
 *
 * Key Security Features:
 * - Real-time user validation (checks if user still exists and is active)
 * - Flexible token extraction (cookies take precedence over headers)
 * - Automatic token expiration handling
 * - User status verification on each request
 *
 * This strategy is executed on every protected route to validate the user.
 */

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * JWT Payload Structure
 * Defines what data is stored inside the JWT token
 */
interface JwtPayload {
  sub: number; // User ID
  email: string;
  role: string;
}

interface AuthenticatedUser {
  user_id: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Retrieve JWT secret from environment variables
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Configure passport-jwt strategy with hybrid token extraction
    super({
      /**
       * Hybrid Token Extraction Strategy
       *
       * Priority order:
       * 1. HTTP-only cookie (secure for web browsers)
       * 2. Authorization Bearer header (for API clients)
       *
       * This approach supports both web and mobile clients seamlessly
       */
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Primary: Extract from HTTP-only cookie (CSRF-safe)
        (request: Request): string | null => {
          const rawContainer = request as unknown as {
            cookies?: Record<string, unknown>;
          };
          const raw = rawContainer.cookies?.token;
          return typeof raw === 'string' ? raw : null;
        },
        // Fallback: Extract from Authorization: Bearer <token> header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false, // Enforce token expiration
      secretOrKey: secret, // Secret key for token verification
    });
  }

  /**
   * Validates JWT payload and ensures user is still valid
   *
   * This method is called after JWT signature verification.
   * It performs additional security checks:
   * - Verifies user still exists in database
   * - Checks if user account is still active
   * - Returns user object that gets attached to request
   *
   * @param payload Decoded JWT payload
   * @returns User object attached to request.user
   * @throws UnauthorizedException if user is invalid or inactive
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Real-time user validation - critical security check
    // Prevents using tokens for deleted/deactivated users
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, active: true },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user object that gets attached to request.user
    // This object is available in all protected route handlers
    return { user_id: user.id, email: user.email, role: user.role };
  }
}
