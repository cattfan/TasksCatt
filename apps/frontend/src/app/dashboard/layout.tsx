'use client';

import { useEffect, ReactNode, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DarkModeToggle } from '@/contexts/ThemeContext';
import { useSocket } from '@/hooks/useSocket';
import { notificationService, Notification } from '@/lib/services/notification.service';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    LayoutDashboard,
    FolderKanban,
    ClipboardList,
    Users,
    Settings,
    ShieldCheck,
    LogOut,
    Menu,
    ChevronLeft,
    Bell,
    Search,
    Loader2,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DashboardLayoutProps {
    children: ReactNode;
}

// Navigation items - filtered by user role
const getNavItems = (isAdmin: boolean) => {
    if (isAdmin) {
        // Admin sees specialized dashboard
        return [
            { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        ];
    }
    // Regular users see project-related items
    return [
        { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { href: '/dashboard/projects', label: 'Dự án', icon: FolderKanban },
        { href: '/dashboard/tasks', label: 'Công việc', icon: ClipboardList },
        { href: '/dashboard/team', label: 'Nhóm', icon: Users },
    ];
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { getSocket } = useSocket();

    // Fetch notifications
    const loadNotifications = useCallback(async () => {
        try {
            const response = await notificationService.getNotifications(1, 10);
            setNotifications(response.data);
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadNotifications();
        }
    }, [isAuthenticated, loadNotifications]);

    // Listen for real-time notifications
    useEffect(() => {
        let socket = getSocket();
        let retryInterval: NodeJS.Timeout | null = null;

        const handleNewNotification = (data: { notification: Notification }) => {
            console.log('[Layout] Received new_notification event:', data);
            setNotifications(prev => [data.notification, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);

            // Show toast notification
            console.log('[Layout] Dispatching toast event...');
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: {
                    message: `${data.notification.title}: ${data.notification.message}`,
                    type: 'info',
                },
            }));
            console.log('[Layout] Toast event dispatched');
        };

        const setupListener = () => {
            socket = getSocket();
            if (socket?.connected) {
                socket.on('new_notification', handleNewNotification);
                if (retryInterval) {
                    clearInterval(retryInterval);
                    retryInterval = null;
                }
                return true;
            }
            return false;
        };

        // Try immediately
        if (!setupListener()) {
            // If socket not ready, retry every second for up to 10 seconds
            let attempts = 0;
            retryInterval = setInterval(() => {
                attempts++;
                if (setupListener() || attempts >= 10) {
                    if (retryInterval) clearInterval(retryInterval);
                }
            }, 1000);
        }

        return () => {
            if (retryInterval) clearInterval(retryInterval);
            if (socket) {
                socket.off('new_notification', handleNewNotification);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-muted-foreground">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

    return (
        <div className="min-h-screen bg-background flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-card border-r flex flex-col transition-all duration-300",
                    sidebarOpen ? "w-64" : "w-[70px]"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b">
                    {sidebarOpen ? (
                        <span className="text-xl font-bold text-foreground">TasksCatt</span>
                    ) : (
                        <span className="text-xl font-bold text-foreground">TC</span>
                    )}
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="px-3 space-y-1">
                        {getNavItems(user?.isAdmin || false).map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            if (!sidebarOpen) {
                                return (
                                    <Tooltip key={item.href} delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center justify-center w-11 h-11 rounded-lg transition-colors cursor-pointer",
                                                    active
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                )}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                                        active
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Settings - only for non-admin users */}
                        {!user?.isAdmin && sidebarOpen && (
                            <Link
                                href="/dashboard/settings"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                                    pathname.startsWith('/dashboard/settings')
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Settings className="w-5 h-5" />
                                <span className="font-medium">Cài đặt</span>
                            </Link>
                        )}
                        {!user?.isAdmin && !sidebarOpen && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/dashboard/settings"
                                        className={cn(
                                            "flex items-center justify-center w-11 h-11 rounded-lg transition-colors cursor-pointer",
                                            pathname.startsWith('/dashboard/settings')
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <Settings className="w-5 h-5" />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">Cài đặt</TooltipContent>
                            </Tooltip>
                        )}
                    </nav>


                </ScrollArea>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col transition-all duration-300 overflow-hidden",
                sidebarOpen ? "ml-64" : "ml-[70px]"
            )}>
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 bg-card border-b flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="cursor-pointer"
                        >
                            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>

                        {/* Search */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg w-80">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative cursor-pointer">
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <DropdownMenuLabel className="flex items-center justify-between">
                                    <span>Thông báo {unreadCount > 0 && `(${unreadCount})`}</span>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs text-primary hover:underline cursor-pointer"
                                        >
                                            Đánh dấu tất cả đã đọc
                                        </button>
                                    )}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p>Không có thông báo mới</p>
                                            <p className="text-xs mt-1">Các hoạt động mới sẽ hiển thị ở đây</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-0",
                                                    !notification.isRead && "bg-primary/5"
                                                )}
                                                onClick={() => {
                                                    if (!notification.isRead) {
                                                        handleMarkAsRead(notification.id);
                                                    }
                                                    // Navigate to task if data available
                                                    const data = notification.data as { projectSlug?: string; taskId?: string } | null;
                                                    if (data?.projectSlug) {
                                                        const url = data.taskId
                                                            ? `/dashboard/projects/${data.projectSlug}?taskId=${data.taskId}`
                                                            : `/dashboard/projects/${data.projectSlug}`;
                                                        router.push(url);
                                                    }
                                                }}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "text-sm",
                                                        !notification.isRead && "font-medium"
                                                    )}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                                            addSuffix: true,
                                                            locale: vi,
                                                        })}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/notifications" className="w-full justify-center text-primary cursor-pointer">
                                        Xem tất cả thông báo
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>


                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-auto flex items-center gap-3 rounded-full cursor-pointer px-2 pl-3 hover:bg-accent/50">
                                    <div className="hidden md:flex flex-col items-end mr-1">
                                        <span className="text-sm font-medium leading-none">{user?.fullName}</span>
                                        <span className="text-xs text-muted-foreground leading-none mt-1">{user?.email}</span>
                                    </div>
                                    <Avatar className="h-9 w-9 border border-border">
                                        <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/9.x/big-ears/svg?seed=${user?.email}`} />
                                        <AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user?.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href="/dashboard/settings">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Cài đặt
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header >

                {/* Page Content */}
                < div className="flex-1 p-6 overflow-y-auto overflow-x-hidden w-full max-w-full" >
                    {children}
                </div >
            </main >
        </div >
    );
}
