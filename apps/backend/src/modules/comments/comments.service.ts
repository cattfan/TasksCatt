import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole } from '@prisma/client';
import { CreateCommentDto, UpdateCommentDto } from './dto';

import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Tạo comment mới (UC27)
     * Role: MEMBER+
     */
    async create(userId: string, dto: CreateCommentDto) {
        // Verify task exists and get projectId and slug
        const task = await this.prisma.task.findUnique({
            where: { id: dto.taskId, deletedAt: null },
            include: {
                column: {
                    include: {
                        project: {
                            select: { id: true, slug: true },
                        },
                    },
                },
            },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        // Check membership (MEMBER+ can comment)
        await this.checkProjectRole(
            task.column.project.id,
            userId,
            [MemberRole.MEMBER, MemberRole.ADMIN, MemberRole.OWNER],
        );

        const comment = await this.prisma.comment.create({
            data: {
                taskId: dto.taskId,
                authorId: userId,
                content: dto.content,
            },
            include: {
                author: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
                attachments: true,
                task: {
                    select: { title: true },
                },
            },
        });

        // Detect mentions by checking project members list
        // This handles Unicode names with spaces correctly (e.g. "@Lê Thị Hương")
        const projectMembers = await this.prisma.projectMember.findMany({
            where: { projectId: task.column.project.id },
            include: { user: true }
        });

        for (const member of projectMembers) {
            const user = member.user;
            if (user.id === userId) continue; // Don't notify self

            // Check if user is mentioned by Name or Email
            const mentionName = `@${user.fullName}`;
            const mentionEmail = `@${user.email}`;

            if (dto.content.includes(mentionName) || dto.content.includes(mentionEmail)) {
                console.log(`[CommentsService] Mention detected for user: ${user.fullName}`);

                // Send in-app notification
                this.notificationsService.notifyMention(
                    user.id,
                    comment.author.fullName,
                    comment.task.title,
                    dto.taskId,
                    task.column.project.slug,
                ).catch(err => console.error('Failed to create mention notification:', err));

                // Send email notification if enabled
                if (user.emailNotifications) {
                    this.mailService.sendMentionEmail(
                        user.email,
                        comment.author.fullName,
                        comment.task.title,
                        dto.content
                    ).catch(err => console.error('Failed to send mention email:', err));
                }
            }
        }

        return comment;
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
                attachments: true,
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
