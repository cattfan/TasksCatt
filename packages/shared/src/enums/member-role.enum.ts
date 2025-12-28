/**
 * Member Role Enum
 * Defines the access level of a user within a project
 */
export enum MemberRole {
    /** Project owner - full control, cannot be removed */
    OWNER = 'OWNER',
    /** Administrator - can manage members and all tasks */
    ADMIN = 'ADMIN',
    /** Regular member - can manage own tasks */
    MEMBER = 'MEMBER',
    /** Viewer - read-only access */
    VIEWER = 'VIEWER',
}

/**
 * Role permissions configuration
 */
export const MemberRolePermissions: Record<
    MemberRole,
    {
        canManageProject: boolean;
        canManageMembers: boolean;
        canManageAllTasks: boolean;
        canCreateTasks: boolean;
        canEditOwnTasks: boolean;
        canViewTasks: boolean;
    }
> = {
    [MemberRole.OWNER]: {
        canManageProject: true,
        canManageMembers: true,
        canManageAllTasks: true,
        canCreateTasks: true,
        canEditOwnTasks: true,
        canViewTasks: true,
    },
    [MemberRole.ADMIN]: {
        canManageProject: false,
        canManageMembers: true,
        canManageAllTasks: true,
        canCreateTasks: true,
        canEditOwnTasks: true,
        canViewTasks: true,
    },
    [MemberRole.MEMBER]: {
        canManageProject: false,
        canManageMembers: false,
        canManageAllTasks: false,
        canCreateTasks: true,
        canEditOwnTasks: true,
        canViewTasks: true,
    },
    [MemberRole.VIEWER]: {
        canManageProject: false,
        canManageMembers: false,
        canManageAllTasks: false,
        canCreateTasks: false,
        canEditOwnTasks: false,
        canViewTasks: true,
    },
};

/**
 * Role display labels (Vietnamese)
 */
export const MemberRoleLabels: Record<MemberRole, string> = {
    [MemberRole.OWNER]: 'Chủ sở hữu',
    [MemberRole.ADMIN]: 'Quản trị viên',
    [MemberRole.MEMBER]: 'Thành viên',
    [MemberRole.VIEWER]: 'Người xem',
};
