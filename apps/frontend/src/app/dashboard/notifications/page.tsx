'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, Notification } from '@/lib/services/notification.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, Check, CheckCheck, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

export default function NotificationsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(1);

    const loadNotifications = useCallback(async (pageNum: number, append = false) => {
        try {
            setLoading(true);
            const response = await notificationService.getNotifications(pageNum, 20);
            if (append) {
                setNotifications(prev => [...prev, ...response.data]);
            } else {
                setNotifications(response.data);
            }
            setTotalPages(response.meta.totalPages);
            setHasMore(pageNum < response.meta.totalPages);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            loadNotifications(1);
        }
    }, [user, loadNotifications]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadNotifications(nextPage, true);
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }
        const data = notification.data as { projectSlug?: string; taskId?: string } | null;
        if (data?.projectSlug) {
            const url = data.taskId
                ? `/dashboard/projects/${data.projectSlug}?taskId=${data.taskId}`
                : `/dashboard/projects/${data.projectSlug}`;
            router.push(url);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TASK_ASSIGNED':
                return '📋';
            case 'TASK_UPDATED':
                return '✏️';
            case 'TASK_COMMENT':
                return '💬';
            case 'MENTION':
                return '@';
            case 'PROJECT_INVITE':
                return '👥';
            default:
                return '🔔';
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Thông báo</h1>
                        <p className="text-muted-foreground">
                            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
                        </p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={handleMarkAllAsRead}>
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Đánh dấu tất cả đã đọc
                    </Button>
                )}
            </div>

            {/* Notifications List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Danh sách thông báo
                    </CardTitle>
                    <CardDescription>
                        Tất cả thông báo của bạn sẽ hiển thị ở đây
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <Bell className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Không có thông báo</p>
                            <p className="text-sm">Các hoạt động mới sẽ hiển thị ở đây</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                                        !notification.isRead && "bg-primary/5"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className={cn(
                                                    "text-sm",
                                                    !notification.isRead && "font-semibold"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <Badge variant="default" className="flex-shrink-0">
                                                    Mới
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>
                                                {formatDistanceToNow(new Date(notification.createdAt), {
                                                    addSuffix: true,
                                                    locale: vi,
                                                })}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {format(new Date(notification.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                            </span>
                                        </div>
                                    </div>
                                    {!notification.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="flex-shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.id);
                                            }}
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Load More */}
                    {hasMore && notifications.length > 0 && (
                        <div className="p-4 text-center border-t">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tải...
                                    </>
                                ) : (
                                    'Tải thêm'
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
