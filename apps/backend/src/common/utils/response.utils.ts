/**
 * Response wrapper utilities for consistent API responses
 */

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface ApiResponse<T> {
    data: T;
    meta?: {
        pagination?: PaginationMeta;
        [key: string]: any;
    };
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
): ApiResponse<T[]> {
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        },
    };
}

/**
 * Wrap data in standard response format
 */
export function response<T>(data: T, meta?: Record<string, any>): ApiResponse<T> {
    return {
        data,
        ...(meta && { meta }),
    };
}

/**
 * Pagination helper for Prisma queries
 */
export function getPaginationParams(page: number = 1, limit: number = 20) {
    const take = Math.min(Math.max(limit, 1), 100); // 1-100
    const skip = (Math.max(page, 1) - 1) * take;

    return { take, skip };
}
