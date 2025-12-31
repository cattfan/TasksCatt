import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard to check if user has required MemberRole in the project
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(MemberRole.ADMIN, MemberRole.OWNER)
 * 
 * Requires projectId in:
 * - request.params.id
 * - request.params.projectId  
 * - request.body.projectId
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Get required roles from decorator
        const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles specified, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Bạn cần đăng nhập');
        }

        // Extract projectId from various sources
        const projectId = this.extractProjectId(request);

        if (!projectId) {
            throw new ForbiddenException('Không tìm thấy projectId');
        }

        // Check user's role in this project
        const membership = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId: user.id },
            },
        });

        if (!membership) {
            throw new ForbiddenException('Bạn không phải thành viên của dự án này');
        }

        // Check if user's role is in the allowed roles
        if (!requiredRoles.includes(membership.role)) {
            throw new ForbiddenException(
                `Bạn cần quyền ${requiredRoles.join(' hoặc ')} để thực hiện hành động này`,
            );
        }

        // Attach membership to request for later use
        request.membership = membership;

        return true;
    }

    private extractProjectId(request: any): string | undefined {
        // From route params
        if (request.params?.id) return request.params.id;
        if (request.params?.projectId) return request.params.projectId;

        // From body
        if (request.body?.projectId) return request.body.projectId;

        // From query
        if (request.query?.projectId) return request.query.projectId;

        return undefined;
    }
}
