import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole } from '@prisma/client';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Tạo comment mới (UC27)
     * Role: MEMBER+
     */
    async create(userId: string, dto: CreateCommentDto) {
        // Verify task exists and get projectId
        const task = await this.prisma.task.findUnique({
            where: { id: dto.taskId, deletedAt: null },
            include: {
                column: {
                    select: { projectId: true },
                },
            },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        // Check membership (MEMBER+ can comment)
        await this.checkProjectRole(
            task.column.projectId,
            userId,
            [MemberRole.MEMBER, MemberRole.ADMIN, MemberRole.OWNER],
        );

        return this.prisma.comment.create({
            data: {
                taskId: dto.taskId,
                authorId: userId,
                content: dto.content,
            },
            include: {
                author: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
        });
    }

    /**
     * Lấy comments của task
     */
    async findByTask(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId, deletedAt: null },
            include: {
                column: {
                    select: { projectId: true },
                },
            },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        // Check membership (MEMBER+ can view)
        await this.checkProjectRole(
            task.column.projectId,
            userId,
            [MemberRole.MEMBER, MemberRole.ADMIN, MemberRole.OWNER],
        );

        return this.prisma.comment.findMany({
            where: { taskId },
            include: {
                author: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Cập nhật comment (UC28)
     * Role: Chỉ owner của comment
     */
    async update(commentId: string, userId: string, dto: UpdateCommentDto) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('Comment không tồn tại');
        }

        // Only author can edit their comment
        if (comment.authorId !== userId) {
            throw new ForbiddenException('Bạn chỉ có thể sửa comment của mình');
        }

        return this.prisma.comment.update({
            where: { id: commentId },
            data: { content: dto.content },
            include: {
                author: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
        });
    }

    /**
     * Xóa comment (UC29)
     * Role: ADMIN+ hoặc owner của comment
     */
    async delete(commentId: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                task: {
                    include: {
                        column: {
                            select: { projectId: true },
                        },
                    },
                },
            },
        });

        if (!comment) {
            throw new NotFoundException('Comment không tồn tại');
        }

        const projectId = comment.task.column.projectId;

        // Check if user is comment author
        if (comment.authorId === userId) {
            return this.prisma.comment.delete({ where: { id: commentId } });
        }

        // Otherwise, check if user is ADMIN+ in project
        await this.checkProjectRole(
            projectId,
            userId,
            [MemberRole.ADMIN, MemberRole.OWNER],
        );

        return this.prisma.comment.delete({ where: { id: commentId } });
    }

    /**
     * Helper: Check user's role in project
     */
    private async checkProjectRole(
        projectId: string,
        userId: string,
        allowedRoles: MemberRole[],
    ) {
        const member = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId },
            },
        });

        if (!member) {
            throw new ForbiddenException('Bạn không phải thành viên của dự án này');
        }

        if (!allowedRoles.includes(member.role)) {
            throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
        }

        return member;
    }
}
