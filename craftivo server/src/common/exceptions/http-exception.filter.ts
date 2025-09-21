import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  // This method is called when an exception is thrown
  // It handles the exception and sends an appropriate HTTP response
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const msg = (exceptionResponse as { message?: unknown }).message;
        if (typeof msg === 'string') message = msg;
        else if (Array.isArray(msg)) message = msg.join(', ');
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      // Map common Prisma errors
      if (exception.message.includes('Unique constraint')) {
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists';
      } else if (exception.message.includes('Foreign key constraint')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference provided';
      }
    }
    // Construct a consistent error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      requestId: (request as unknown as { requestId?: string }).requestId,
    };
    // Log the error details
    const requestId = (request as unknown as { requestId?: string }).requestId;
    this.logger.error(`${request.method} ${request.url} [${requestId}]`);
    if (exception instanceof Error) {
      this.logger.error(exception.stack);
    } else {
      this.logger.error(String(exception));
    }

    response.status(status).json(errorResponse);
  }
}
