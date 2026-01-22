import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserAdminDto } from './dto';
import { Parser } from 'json2csv';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    /**
     * Lấy danh sách tất cả users (UC34)
     */
    async findAllUsers(search?: string) {
        return this.prisma.user.findMany({
            where: search
                ? {
                    OR: [
                        { email: { contains: search, mode: 'insensitive' } },
                        { fullName: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : undefined,
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                isAdmin: true,
                isBlocked: true,
                createdAt: true,
                deletedAt: true,
                _count: {
                    select: {
                        ownedProjects: true,
                        memberships: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Lấy chi tiết user
     */
    async findUserById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                isAdmin: true,
                isBlocked: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                _count: {
                    select: {
                        ownedProjects: true,
                        memberships: true,
                        createdTasks: true,
                        comments: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        return user;
    }

    /**
     * Cập nhật user (block/unblock, set admin) (UC35)
     */
    async updateUser(userId: string, dto: UpdateUserAdminDto, adminId: string) {
        // Prevent admin from modifying themselves
        if (userId === adminId) {
            throw new BadRequestException('Bạn không thể tự thay đổi trạng thái của mình');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: dto,
            select: {
                id: true,
                email: true,
                fullName: true,
                isAdmin: true,
                isBlocked: true,
            },
        });
    }

    /**
     * Block user (UC35)
     */
    async blockUser(userId: string, adminId: string) {
        return this.updateUser(userId, { isBlocked: true }, adminId);
    }

    /**
     * Unblock user (UC35)
     */
    async unblockUser(userId: string, adminId: string) {
        return this.updateUser(userId, { isBlocked: false }, adminId);
    }

    /**
     * Thống kê hệ thống với online/offline tracking
     */
    async getStats() {
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

        const [
            userCount,
            projectCount,
            taskCount,
            commentCount,
            onlineUsers,
            blockedUsers,
        ] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.project.count({ where: { deletedAt: null } }),
            this.prisma.task.count({ where: { deletedAt: null } }),
            this.prisma.comment.count(),
            // Online: lastSeenAt within 10 minutes
            this.prisma.user.count({
                where: {
                    deletedAt: null,
                    lastSeenAt: { gte: tenMinutesAgo },
                },
            }),
            this.prisma.user.count({
                where: { deletedAt: null, isBlocked: true },
            }),
        ]);

        return {
            users: userCount,
            projects: projectCount,
            tasks: taskCount,
            comments: commentCount,
            onlineUsers,
            offlineUsers: userCount - onlineUsers,
            blockedUsers,
        };
    }

    /**
     * Get chart data for analytics
     */
    async getChartData() {
        // 1. User Growth (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentUsers = await this.prisma.user.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true },
        });

        // Group by date
        const userGrowthMap = new Map<string, number>();
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0] as string;
            userGrowthMap.set(dateStr, 0);
        }

        recentUsers.forEach(u => {
            const dateStr = u.createdAt.toISOString().split('T')[0] as string;
            if (userGrowthMap.has(dateStr)) {
                userGrowthMap.set(dateStr, (userGrowthMap.get(dateStr) || 0) + 1);
            }
        });

        const userGrowth = Array.from(userGrowthMap.entries()).map(([date, count]) => ({
            date,
            count,
        }));

        // 2. Task Priority Distribution
        const taskStats = await this.prisma.task.groupBy({
            by: ['priority'],
            _count: { priority: true },
            where: { deletedAt: null },
        });

        return {
            userGrowth,
            taskStats: taskStats.map(t => ({
                name: t.priority,
                value: t._count.priority,
            })),
        };
    }

    /**
     * Lấy danh sách tất cả projects (for admin dropdown)
     */
    async getAllProjects() {
        return this.prisma.project.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: {
                        members: true,
                        columns: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Export all users to CSV
     */
    async exportUsers() {
        const users = await this.prisma.user.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                email: true,
                fullName: true,
                isAdmin: true,
                isBlocked: true,
                createdAt: true,
                lastSeenAt: true,
                _count: {
                    select: {
                        ownedProjects: true,
                        memberships: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const fields = ['id', 'email', 'fullName', 'isAdmin', 'isBlocked', 'createdAt', 'lastSeenAt', 'projectsOwned', 'projectsJoined'];
        const json2csv = new Parser({ fields });

        const data = users.map(u => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            isAdmin: u.isAdmin ? 'Yes' : 'No',
            isBlocked: u.isBlocked ? 'Yes' : 'No',
            createdAt: u.createdAt ? u.createdAt.toISOString() : '',
            lastSeenAt: u.lastSeenAt ? u.lastSeenAt.toISOString() : '',
            projectsOwned: u._count.ownedProjects,
            projectsJoined: u._count.memberships,
        }));

        return json2csv.parse(data);
    }

    /**
     * Export activity logs to CSV
     */
    async exportLogs() {
        const logs = await this.prisma.activityLog.findMany({
            take: 1000, // Limit export to last 1000 logs for performance
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { email: true, fullName: true } },
                project: { select: { name: true, slug: true } },
            },
        });

        const fields = ['timestamp', 'user', 'email', 'action', 'project', 'details'];
        const json2csv = new Parser({ fields });

        const data = logs.map(l => ({
            timestamp: l.createdAt.toISOString(),
            user: l.user.fullName,
            email: l.user.email,
            action: l.action,
            project: l.project ? l.project.name : 'System',
            details: l.details ? JSON.stringify(l.details) : '',
        }));

        return json2csv.parse(data);
    }
}
