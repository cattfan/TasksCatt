import type { TaskPriority } from '../enums/task-priority.enum';

/**
 * Default values for the application
 */

/**
 * Default columns created for new projects
 */
export const DEFAULT_COLUMNS = [
    { name: '📋 Backlog', color: '#6B7280', position: 0 },
    { name: '🔄 In Progress', color: '#3B82F6', position: 1 },
    { name: '👀 Review', color: '#F59E0B', position: 2 },
    { name: '✅ Done', color: '#10B981', position: 3 },
] as const;

/**
 * Default task priority
 */
export const DEFAULT_TASK_PRIORITY: TaskPriority = 'MEDIUM' as TaskPriority;

/**
 * Pagination defaults
 */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
    /** Maximum title length */
    TITLE_MAX_LENGTH: 255,
    /** Maximum description length */
    DESCRIPTION_MAX_LENGTH: 10000,
    /** Maximum project name length */
    PROJECT_NAME_MAX_LENGTH: 100,
    /** Minimum project name length */
    PROJECT_NAME_MIN_LENGTH: 3,
    /** Maximum slug length */
    SLUG_MAX_LENGTH: 100,
    /** Minimum slug length */
    SLUG_MIN_LENGTH: 3,
    /** Maximum user full name length */
    FULLNAME_MAX_LENGTH: 100,
    /** Minimum password length */
    PASSWORD_MIN_LENGTH: 8,
    /** Maximum column name length */
    COLUMN_NAME_MAX_LENGTH: 50,
} as const;

/**
 * JWT defaults
 */
export const JWT_DEFAULTS = {
    EXPIRES_IN: '7d',
    REFRESH_EXPIRES_IN: '30d',
} as const;
