import type { Task } from './task.entity';

/**
 * Column Entity
 * Represents a column in the Kanban board (e.g., Todo, In Progress, Done)
 */
export type Column = {
    /** Unique identifier (UUID) */
    id: string;
    /** Parent project ID */
    projectId: string;
    /** Column name */
    name: string;
    /** Column color (hex code) */
    color: string;
    /** Display order (0-based) */
    position: number;
    /** Creation timestamp */
    createdAt: Date;
};

/**
 * Column with tasks
 */
export type ColumnWithTasks = Column & {
    /** Tasks in this column */
    tasks: Task[];
};

/**
 * Column creation input
 */
export type CreateColumnInput = {
    name: string;
    color?: string;
    position?: number; // Will be auto-calculated if not provided
};

/**
 * Column update input
 */
export type UpdateColumnInput = {
    name?: string;
    color?: string;
};

/**
 * Column reorder input
 */
export type ReorderColumnInput = {
    columnId: string;
    newPosition: number;
};
