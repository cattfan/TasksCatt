import type { User } from './user.entity';
import type { Column } from './column.entity';
import type { ProjectMember } from './project-member.entity';

/**
 * Project Entity
 * Represents a project/workspace containing tasks
 */
export type Project = {
    /** Unique identifier (UUID) */
    id: string;
    /** Project name */
    name: string;
    /** Project description */
    description: string | null;
    /** URL-friendly identifier (unique) */
    slug: string;
    /** Owner user ID */
    ownerId: string;
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
};

/**
 * Project with related entities
 */
export type ProjectWithRelations = Project & {
    /** Project owner */
    owner: User;
    /** Project columns */
    columns: Column[];
    /** Project members */
    members: ProjectMember[];
};

/**
 * Project creation input
 */
export type CreateProjectInput = {
    name: string;
    description?: string | null;
    slug?: string; // Will be auto-generated if not provided
};

/**
 * Project update input
 */
export type UpdateProjectInput = {
    name?: string;
    description?: string | null;
};

/**
 * Project summary for list views
 */
export type ProjectSummary = Project & {
    /** Number of members */
    memberCount: number;
    /** Number of tasks */
    taskCount: number;
    /** User's role in this project */
    userRole: string;
};
