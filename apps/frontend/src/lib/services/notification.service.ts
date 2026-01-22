import api from '@/lib/api';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    data: Notification[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const notificationService = {
    async getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
        const { data } = await api.get<NotificationsResponse>('/notifications', {
            params: { page, limit },
        });
        return data;
    },

    async getUnreadCount(): Promise<number> {
        const { data } = await api.get<{ count: number }>('/notifications/unread-count');
        return data.count;
    },

    async markAsRead(notificationId: string): Promise<void> {
        await api.patch(`/notifications/${notificationId}/read`);
    },

    async markAllAsRead(): Promise<void> {
        await api.patch('/notifications/read-all');
    },
};

export default notificationService;
