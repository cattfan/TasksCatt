import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { NotificationType } from '@prisma/client';
import { CreateNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway,
    ) { }

    /**
     * Create a new notification and emit via WebSocket
     */
    async create(dto: CreateNotificationDto) {
        console.log('[NotificationsService] Creating notification for user:', dto.userId, dto.title);

        const notification = await this.prisma.notification.create({
            data: {
                userId: dto.userId,
                type: dto.type,
                title: dto.title,
                message: dto.message,
                data: dto.data ?? undefined,
            },
        });

        console.log('[NotificationsService] Notification created:', notification.id);

        // Emit real-time notification to the user
        console.log('[NotificationsService] Emitting WebSocket event to user:', dto.userId);
        this.eventsGateway.notifyUser(dto.userId, 'new_notification', {
            notification,
        });

        return notification;
    }

    /**
     * Get all notifications for a user
     */
    async findByUser(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where: { userId } }),
        ]);

        return {
            data: notifications,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get unread notification count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    /**
     * Helper to create task-related notifications
     */
    async notifyTaskUpdate(
        userId: string,
        taskTitle: string,
        updatedBy: string,
        taskId: string,
        projectSlug: string,
    ) {
        return this.create({
            userId,
            type: NotificationType.TASK_UPDATED,
            title: 'Task được cập nhật',
            message: `${updatedBy} đã cập nhật task "${taskTitle}"`,
            data: { taskId, projectSlug },
        });
    }

    async notifyTaskAssigned(
        userId: string,
        taskTitle: string,
        assignedBy: string,
        taskId: string,
        projectSlug: string,
    ) {
        return this.create({
            userId,
            type: NotificationType.TASK_ASSIGNED,
            title: 'Nhiệm vụ mới',
            message: `Bạn nhận được nhiệm vụ mới từ ${assignedBy}: "${taskTitle}"`,
            data: { taskId, projectSlug },
        });
    }

    async notifyMention(
        userId: string,
        mentionedBy: string,
        taskTitle: string,
        taskId: string,
        projectSlug: string,
    ) {
        return this.create({
            userId,
            type: NotificationType.MENTION,
            title: 'Bạn được nhắc đến',
            message: `${mentionedBy} đã nhắc đến bạn trong task "${taskTitle}"`,
            data: { taskId, projectSlug },
        });
    }

    async notifyProjectInvite(
        userId: string,
        projectName: string,
        invitedBy: string,
        projectSlug: string,
    ) {
        return this.create({
            userId,
            type: NotificationType.PROJECT_INVITE,
            title: 'Lời mời tham gia dự án',
            message: `${invitedBy} đã mời bạn tham gia dự án "${projectName}"`,
            data: { projectSlug },
        });
    }
}
