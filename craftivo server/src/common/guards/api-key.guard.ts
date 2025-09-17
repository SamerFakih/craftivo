import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

type IngestRequest = Request & { user?: { user_id: number } };

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<IngestRequest>();
    const headerKey = req.header('x-api-key');
    const configured = this.configService.get<string>(
      'INVOICES_INGEST_API_KEY',
    );
    const ingestUserIdRaw = this.configService.get<string>(
      'INVOICES_INGEST_USER_ID',
    );
    const ingestUserId = ingestUserIdRaw ? Number(ingestUserIdRaw) : NaN;

    if (!configured) {
      // If not configured, deny by default to avoid exposing the endpoint accidentally
      throw new UnauthorizedException('Ingest API key not configured');
    }

    if (!ingestUserIdRaw || Number.isNaN(ingestUserId)) {
      throw new UnauthorizedException('Ingest user not configured');
    }

    if (!headerKey || headerKey !== configured) {
      throw new UnauthorizedException('Invalid or missing API key');
    }
    // Attach a synthetic user to request for downstream services
    req.user = { user_id: ingestUserId };
    return true;
  }
}
