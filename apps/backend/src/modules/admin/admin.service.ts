import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserAdminDto } from './dto';

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
     * Thống kê hệ thống
     */
    async getStats() {
        const [userCount, projectCount, taskCount, commentCount] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.project.count({ where: { deletedAt: null } }),
            this.prisma.task.count({ where: { deletedAt: null } }),
            this.prisma.comment.count(),
        ]);

        return {
            users: userCount,
            projects: projectCount,
            tasks: taskCount,
            comments: commentCount,
        };
    }
}
