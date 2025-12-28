/**
 * @packages/shared
 * Shared code between frontend and backend
 *
 * This package contains pure TypeScript code that can be used
 * by both NestJS (backend) and Next.js (frontend).
 *
 * Rules:
 * - No framework-specific code (@nestjs/*, react, etc.)
 * - No ORM decorators (TypeORM, Prisma client)
 * - Only pure TypeScript types, enums, and utilities
 */

// Enums
export * from './enums';

// Entities (Business types)
export * from './entities';

// Constants
export * from './constants';

// DTOs
export * from './dtos';
