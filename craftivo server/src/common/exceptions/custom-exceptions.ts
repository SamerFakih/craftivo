/**
 * Custom Exception System
 *
 * This module provides a standardized exception handling system that:
 * - Maps generic errors to specific HTTP status codes
 * - Provides consistent error messages across the application
 * - Handles database-specific errors (Prisma) gracefully
 * - Improves API consumer experience with clear error responses
 *
 * Benefits:
 * - Reduces code duplication in error handling
 * - Provides better debugging information
 * - Ensures consistent error response format
 */

import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

/**
 * Enhanced NotFoundException with resource context
 *
 * Provides more specific error messages for missing resources
 * Example: "User with ID 123 not found" vs generic "Not Found"
 */
export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message);
  }
}

/**
 * Handles resource conflict scenarios (duplicate entries)
 *
 * Common use case: User tries to create resource with existing unique field
 * Example: Email already exists, username taken, etc.
 */
export class ResourceConflictException extends ConflictException {
  constructor(resource: string, field: string, value: string | number) {
    super(`${resource} with ${field} '${value}' already exists`);
  }
}

/**
 * Authorization exception with action context
 *
 * Provides clear feedback about what action was attempted
 * Example: "You are not authorized to delete this project"
 */
export class UnauthorizedResourceException extends ForbiddenException {
  constructor(action: string, resource: string) {
    super(`You are not authorized to ${action} this ${resource}`);
  }
}

/**
 * Enhanced validation exception with multiple error support
 *
 * Aggregates multiple validation errors into a single response
 * Supports both single error messages and arrays of errors
 */
export class ValidationException extends BadRequestException {
  constructor(errors: string[] | string) {
    const message = Array.isArray(errors) ? errors.join(', ') : errors;
    super(`Validation failed: ${message}`);
  }
}

/**
 * Database operation exception with operation context
 *
 * Provides context about which database operation failed
 * Helps distinguish between different types of database errors
 */
export class DatabaseException extends InternalServerErrorException {
  constructor(operation: string, details?: string) {
    const message = details
      ? `Database ${operation} failed: ${details}`
      : `Database ${operation} failed`;
    super(message);
  }
}

/**
 * Prisma Error Handler - Database Error Translation System
 *
 * Prisma generates specific error codes for different database issues.
 * This handler translates Prisma's internal error codes into meaningful
 * HTTP exceptions that API consumers can understand.
 *
 * Common Prisma Error Codes:
 * - P2002: Unique constraint violation (duplicate entry)
 * - P2025: Record not found during update/delete
 * - P2003: Foreign key constraint failure
 * - P2014: Invalid ID format
 *
 * Benefits:
 * - Hides database implementation details from API consumers
 * - Provides consistent error responses across all database operations
 * - Prevents database-specific error messages from leaking to frontend
 */
export class PrismaErrorHandler {
  /**
   * Translates Prisma database errors into appropriate HTTP exceptions
   *
   * @param error - Prisma error object with code and metadata
   * @throws {ConflictException} For unique constraint violations
   * @throws {NotFoundException} For missing records
   * @throws {BadRequestException} For invalid data or foreign key issues
   * @throws {InternalServerErrorException} For unexpected database errors
   */
  static handle(error: unknown): never {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
    ) {
      const code = (error as { code: string }).code;
      switch (code) {
        case 'P2002': {
          const target = (error as { meta?: { target?: string[] } }).meta
            ?.target;
          const field =
            Array.isArray(target) && target[0] ? target[0] : 'field';
          throw new ConflictException(
            `A record with this ${field} already exists`,
          );
        }
        case 'P2025':
          throw new NotFoundException('Record not found');
        case 'P2003':
          throw new BadRequestException(
            'Cannot delete record due to related data',
          );
        case 'P2014':
          throw new BadRequestException('Invalid ID provided');
        default:
          throw new InternalServerErrorException(
            'An unexpected database error occurred',
          );
      }
    }
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
