import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for pagination parameters
 */
export class PaginationDto {
    @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize?: number = 20;

    @ApiPropertyOptional({ description: 'Sort field' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Generic paginated result wrapper
 */
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

/**
 * Helper function to create paginated result
 */
export function createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
): PaginatedResult<T> {
    const totalPages = Math.ceil(total / pageSize);

    return {
        data,
        meta: {
            total,
            page,
            pageSize,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}

/**
 * Calculate skip value for Prisma queries
 */
export function calculateSkip(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
}
