import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type ActivityAction =
    // System-wide actions (projectId = null)
    | 'USER_REGISTERED'
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'USER_BLOCKED'
    | 'USER_UNBLOCKED'
    | 'PROJECT_CREATED'
    | 'PROJECT_DELETED'
    // Project-specific actions
    | 'TASK_CREATED'
    | 'TASK_UPDATED'
    | 'TASK_MOVED'
    | 'TASK_DELETED'
    | 'TASK_COMPLETED'
    | 'COMMENT_ADDED'
    | 'COMMENT_DELETED'
    | 'MEMBER_ADDED'
    | 'MEMBER_REMOVED'
    | 'MEMBER_ROLE_CHANGED'
    | 'COLUMN_CREATED'
    | 'COLUMN_DELETED';

interface LogOptions {
    projectId?: string | null;
    userId: string;
    action: ActivityAction;
    targetType?: string;
    targetId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class ActivityLogService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create an activity log entry
     */
    async log(options: LogOptions) {
        return this.prisma.activityLog.create({
            data: {
                projectId: options.projectId ?? null,
                userId: options.userId,
                action: options.action,
                targetType: options.targetType,
                targetId: options.targetId,
                details: options.details,
                ipAddress: options.ipAddress,
                userAgent: options.userAgent,
            },
        });
    }

    /**
     * Get system-wide logs (projectId = null)
     */
    async getSystemLogs(limit = 50, offset = 0) {
        return this.prisma.activityLog.findMany({
            where: { projectId: null },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }

    /**
     * Get logs for a specific project
     */
    async getProjectLogs(projectId: string, limit = 50, offset = 0) {
        return this.prisma.activityLog.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }

    /**
     * Get all logs (for admin view)
     */
    async getAllLogs(limit = 50, offset = 0) {
        return this.prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
    }

    /**
     * Get logs count for pagination
     */
    async getLogsCount(projectId?: string | null) {
        return this.prisma.activityLog.count({
            where: projectId === null ? { projectId: null } : projectId ? { projectId } : undefined,
        });
    }

    /**
     * Get activity stats for admin dashboard
     */
    async getActivityStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [todayCount, weekCount, totalCount] = await Promise.all([
            this.prisma.activityLog.count({
                where: { createdAt: { gte: today } },
            }),
            this.prisma.activityLog.count({
                where: { createdAt: { gte: lastWeek } },
            }),
            this.prisma.activityLog.count(),
        ]);

        return {
            today: todayCount,
            thisWeek: weekCount,
            total: totalCount,
        };
    }
}
