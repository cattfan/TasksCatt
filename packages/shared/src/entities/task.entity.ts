import type { User } from './user.entity';
import type { Column } from './column.entity';
import type { TaskPriority } from '../enums/task-priority.enum';

/**
 * Task Entity
 * Represents a task/issue in a project
 */
export type Task = {
    /** Unique identifier (UUID) */
    id: string;
    /** Parent column ID */
    columnId: string;
    /** Assigned user ID (nullable) */
    assigneeId: string | null;
    /** Creator user ID */
    creatorId: string;
    /** Task title */
    title: string;
    /** Task description (markdown) */
    description: string | null;
    /** Priority level */
    priority: TaskPriority;
    /** Display order within column (0-based) */
    position: number;
    /** Due date (nullable) */
    dueDate: Date | null;
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
};

/**
 * Task with related entities
 */
export type TaskWithRelations = Task & {
    /** Assigned user */
    assignee: User | null;
    /** Task creator */
    creator: User;
    /** Parent column */
    column: Column;
};

/**
 * Task creation input
 */
export type CreateTaskInput = {
    title: string;
    description?: string | null;
    priority?: TaskPriority;
    columnId: string;
    assigneeId?: string | null;
    dueDate?: Date | null;
};

/**
 * Task update input
 */
export type UpdateTaskInput = {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    assigneeId?: string | null;
    dueDate?: Date | null;
};

/**
 * Task move input (drag-drop)
 */
export type MoveTaskInput = {
    taskId: string;
    /** Target column ID */
    targetColumnId: string;
    /** New position in target column */
    newPosition: number;
};

/**
 * Batch task reorder input
 */
export type ReorderTasksInput = {
    columnId: string;
    taskIds: string[]; // Ordered array of task IDs
};
