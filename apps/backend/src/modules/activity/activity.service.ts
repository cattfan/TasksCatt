import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type ActivityAction =
    | 'PROJECT_CREATED'
    | 'PROJECT_UPDATED'
    | 'MEMBER_ADDED'
    | 'MEMBER_REMOVED'
    | 'MEMBER_ROLE_CHANGED'
    | 'COLUMN_CREATED'
    | 'COLUMN_UPDATED'
    | 'COLUMN_DELETED'
    | 'TASK_CREATED'
    | 'TASK_UPDATED'
    | 'TASK_MOVED'
    | 'TASK_DELETED'
    | 'TASK_ASSIGNED'
    | 'COMMENT_ADDED';

@Injectable()
export class ActivityService {
    constructor(private prisma: PrismaService) { }

    /**
     * Log an activity (UC33)
     */
    async log(params: {
        projectId: string;
        userId: string;
        action: ActivityAction;
        targetType?: string;
        targetId?: string;
        details?: Record<string, any>;
    }) {
        return this.prisma.activityLog.create({
            data: {
                projectId: params.projectId,
                userId: params.userId,
                action: params.action,
                targetType: params.targetType,
                targetId: params.targetId,
                details: params.details,
            },
        });
    }

    /**
     * Lấy activity log của project (UC33)
     */
    async getByProject(projectId: string, limit = 50) {
        return this.prisma.activityLog.findMany({
            where: { projectId },
            include: {
                user: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Lấy activity log của user
     */
    async getByUser(userId: string, limit = 50) {
        return this.prisma.activityLog.findMany({
            where: { userId },
            include: {
                project: {
                    select: { id: true, name: true, slug: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
