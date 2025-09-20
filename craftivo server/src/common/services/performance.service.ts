/**
 * Performance and Pagination Services
 *
 * This module provides utilities for optimizing API performance through:
 * - Smart pagination with configurable limits
 * - Performance monitoring and measurement
 * - Database query optimization helpers
 * - Batch processing for large datasets
 *
 * These services help maintain good API performance as data grows
 * and provide insights into operation timing for optimization.
 */

import { Injectable } from '@nestjs/common';

/**
 * Configuration options for pagination
 * Allows clients to control data retrieval without overwhelming the server
 */
export interface PaginationOptions {
  page?: number; // Page number (1-based)
  limit?: number; // Number of items per page
  sortBy?: string; // Field to sort by
  sortOrder?: 'asc' | 'desc'; // Sort direction
}

/**
 * Standardized pagination response format
 * Provides both data and metadata for client-side pagination controls
 */
export interface PaginationResult<T> {
  data: T[]; // The actual data for this page
  pagination: {
    page: number; // Current page number
    limit: number; // Items per page
    total: number; // Total number of items across all pages
    totalPages: number; // Total number of pages
    hasNext: boolean; // Whether there are more pages after this one
    hasPrev: boolean; // Whether there are pages before this one
  };
}

/**
 * Pagination Service - Smart Data Pagination
 *
 * Provides consistent pagination functionality across all endpoints.
 * Prevents database overload by limiting query results and provides
 * frontend-friendly pagination metadata.
 */
@Injectable()
export class PaginationService {
  /**
   * Creates pagination metadata object
   *
   * Calculates pagination state based on current page, limit, and total count.
   * Used to build the pagination object in API responses.
   *
   * @param page Current page number (1-based)
   * @param limit Number of items per page
   * @param total Total number of items in the dataset
   * @returns Pagination metadata object
   */
  createPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationResult<any>['pagination'] {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Calculate skip value for database queries
   */
  calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Validate and normalize pagination options
   */
  normalizePaginationOptions(
    options: PaginationOptions,
  ): Required<PaginationOptions> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10)); // Max 100 items
    const sortBy = options.sortBy || 'id';
    const sortOrder = options.sortOrder || 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  /**
   * Create complete paginated result
   */
  createPaginatedResult<T>(
    data: T[],
    total: number,
    options: Required<PaginationOptions>,
  ): PaginationResult<T> {
    return {
      data,
      pagination: this.createPaginationMeta(options.page, options.limit, total),
    };
  }
}

/**
 * Performance monitoring utilities
 */
@Injectable()
export class PerformanceService {
  /**
   * Measure execution time of a function
   */
  async measureTime<T>(
    operation: string,
    fn: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    console.log(`⚡ ${operation} completed in ${duration.toFixed(2)}ms`);

    return { result, duration };
  }

  /**
   * Create optimized select object for Prisma queries
   */
  createSelectObject<T extends Record<string, any>>(
    fields: (keyof T)[],
  ): Record<keyof T, boolean> {
    return fields.reduce(
      (acc, field) => {
        acc[field] = true;
        return acc;
      },
      {} as Record<keyof T, boolean>,
    );
  }

  /**
   * Batch process large datasets
   */
  async batchProcess<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }

    return results;
  }
}
