import type { User } from './user.entity';
import type { Project } from './project.entity';
import type { MemberRole } from '../enums/member-role.enum';

/**
 * ProjectMember Entity
 * Junction table representing a user's membership in a project
 */
export type ProjectMember = {
    /** Unique identifier (UUID) */
    id: string;
    /** Project ID */
    projectId: string;
    /** User ID */
    userId: string;
    /** Member's role in the project */
    role: MemberRole;
    /** When the user joined the project */
    joinedAt: Date;
};

/**
 * ProjectMember with user details
 */
export type ProjectMemberWithUser = ProjectMember & {
    /** Member's user details */
    user: User;
};

/**
 * ProjectMember with project details
 */
export type ProjectMemberWithProject = ProjectMember & {
    /** Project details */
    project: Project;
};

/**
 * Add member input
 */
export type AddMemberInput = {
    email: string; // Find user by email
    role: MemberRole;
};

/**
 * Update member role input
 */
export type UpdateMemberRoleInput = {
    memberId: string;
    role: MemberRole;
};
