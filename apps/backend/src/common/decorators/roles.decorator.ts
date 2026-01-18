import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator để chỉ định MemberRole được phép truy cập endpoint
 * @example @Roles(MemberRole.ADMIN, MemberRole.OWNER)
 */
export const Roles = (...roles: MemberRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator để chỉ định endpoint yêu cầu any role (chỉ cần là member)
 */
export const RequireProjectMember = () =>
    SetMetadata(ROLES_KEY, [MemberRole.MEMBER, MemberRole.ADMIN, MemberRole.OWNER]);

