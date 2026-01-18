'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DarkModeToggle } from '@/contexts/ThemeContext';
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
    CheckCircle2,
    Bell,
    Search,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: ReactNode;
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/projects', label: 'Dự án', icon: FolderKanban },
    { href: '/dashboard/tasks', label: 'Công việc', icon: ClipboardList },
    { href: '/dashboard/team', label: 'Nhóm', icon: Users },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-card border-r flex flex-col transition-all duration-300",
                    sidebarOpen ? "w-64" : "w-[70px]"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-4 border-b">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
                        <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                    </div>
                    {sidebarOpen && (
                        <span className="text-xl font-bold text-foreground">TasksCatt</span>
                    )}
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="px-3 space-y-1">
                        {navItems.map((item) => {
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
                    </nav>
                </ScrollArea>

                {/* Bottom Section */}
                <div className="p-3 border-t space-y-2">
                    {/* Settings */}
                    {sidebarOpen ? (
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
                    ) : (
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

                    {/* Admin Panel */}
                    {user?.isAdmin && sidebarOpen && (
                        <Link
                            href="/dashboard/admin"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                                pathname.startsWith('/dashboard/admin')
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <ShieldCheck className="w-5 h-5" />
                            <span className="font-medium">Admin</span>
                        </Link>
                    )}

                    <Separator className="my-2" />

                    {/* User Profile */}
                    <div className={cn(
                        "flex items-center gap-3 p-2 rounded-lg bg-muted/50",
                        !sidebarOpen && "justify-center p-2"
                    )}>
                        <Avatar className="w-9 h-9 flex-shrink-0">
                            <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                            <AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    {sidebarOpen && (
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Đăng xuất
                        </Button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col transition-all duration-300 overflow-hidden",
                sidebarOpen ? "ml-64" : "ml-[70px]"
            )}>
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 bg-card/80 backdrop-blur-sm border-b flex items-center justify-between px-6">
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
                        <Button variant="ghost" size="icon" className="relative cursor-pointer">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                        </Button>

                        {/* Theme Toggle */}
                        <DarkModeToggle />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full cursor-pointer">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
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
                </header>

                {/* Page Content */}
                <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden w-full max-w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
