'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, taskService, Project, Task } from '@/lib/services/project.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    CheckCircle2,
    Clock,
    Plus,
    ArrowRight,
    Briefcase,
    Activity,
    CheckCircle,
    Inbox,
    PlayCircle,
    Eye,
    ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function UserDashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [projectsData, tasksData] = await Promise.all([
                projectService.getAll(),
                taskService.getMyTasks()
            ]);
            setProjects(projectsData);
            setMyTasks(tasksData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Helper to translate priority to Vietnamese
    const getPriorityLabel = (priority: string) => {
        const map: Record<string, string> = {
            'CRITICAL': 'Khẩn cấp',
            'HIGH': 'Cao',
            'MEDIUM': 'Trung bình',
            'LOW': 'Thấp',
        };
        return map[priority] || priority;
    };

    // Check if column is "in progress"
    const isInProgress = (name: string) => {
        const lower = name.toLowerCase();
        return lower.includes('progress') || lower.includes('doing') || lower.includes('đang thực hiện');
    };

    // Check if column is "done"
    const isDone = (name: string) => {
        const lower = name.toLowerCase();
        return lower.includes('done') || lower.includes('complete') || lower.includes('hoàn thành');
    };

    // Helper to get status icon based on column name
    const getColumnStatusIcon = (columnName: string, className: string = "w-4 h-4") => {
        const name = (columnName || '').toLowerCase();
        if (name.includes('hoàn thành') || name.includes('done') || name.includes('xong')) {
            return <CheckCircle className={cn(className, "text-green-500")} />;
        }
        if (name.includes('đang thực hiện') || name.includes('progress') || name.includes('đang làm')) {
            return <PlayCircle className={cn(className, "text-blue-500")} />;
        }
        if (name.includes('đang xem xét') || name.includes('review')) {
            return <Eye className={cn(className, "text-purple-500")} />;
        }
        if (name.includes('chờ xử lý') || name.includes('backlog') || name.includes('cần làm')) {
            return <Inbox className={cn(className, "text-slate-500")} />;
        }
        return <ListTodo className={cn(className, "text-muted-foreground")} />;
    };

    const stats = [
        {
            label: 'Nhiệm vụ được giao',
            value: myTasks.length,
            icon: Briefcase,
            iconBg: 'bg-indigo-500/10',
            iconColor: 'text-indigo-600',
            description: 'Tổng số nhiệm vụ bạn đang phụ trách'
        },
        {
            label: 'Đang thực hiện',
            value: myTasks.filter(t => t.column?.name && isInProgress(t.column.name)).length,
            icon: Activity,
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-600',
            description: 'Công việc đang diễn ra'
        },
        {
            label: 'Đã hoàn thành',
            value: myTasks.filter(t => t.column?.name && isDone(t.column.name)).length,
            icon: CheckCircle,
            iconBg: 'bg-green-500/10',
            iconColor: 'text-green-600',
            description: 'Nhiệm vụ bạn đã kết thúc'
        },
        {
            label: 'Đã quá hạn',
            value: myTasks.filter(t => {
                if (!t.dueDate) return false;
                const done = t.column?.name && isDone(t.column.name);
                return !done && new Date(t.dueDate) < new Date();
            }).length,
            icon: Clock,
            iconBg: 'bg-red-500/10',
            iconColor: 'text-red-600',
            description: 'Cần ưu tiên xử lý ngay'
        },
    ];

    const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
        'Design': { border: 'border-l-pink-500', bg: 'bg-pink-50/50 dark:bg-pink-950/20', text: 'text-pink-600' },
        'Development': { border: 'border-l-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-950/20', text: 'text-blue-600' },
        'Marketing': { border: 'border-l-green-500', bg: 'bg-green-50/50 dark:bg-green-950/20', text: 'text-green-600' },
        'Research': { border: 'border-l-purple-500', bg: 'bg-purple-50/50 dark:bg-purple-950/20', text: 'text-purple-600' },
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Tổng quan</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Chào mừng trở lại, {user?.fullName}! Chúc bạn một ngày làm việc hiệu quả.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Link href="/dashboard/projects/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Dự án mới
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)
                ) : (
                    stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.label} className="border-border/40 shadow-sm overflow-hidden group hover:border-primary/30 transition-all duration-300">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                        </div>
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", stat.iconBg)}>
                                            <Icon className={cn("w-5 h-5", stat.iconColor)} />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-3 line-clamp-1">{stat.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Tasks */}
                <Card className="lg:col-span-2 border-border/40 shadow-sm rounded-2xl flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Nhiệm vụ của bạn</CardTitle>
                            <CardDescription>Các công việc quan trọng cần chú ý</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/5">
                            <Link href="/dashboard/tasks">
                                Xem tất cả
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                            </div>
                        ) : myTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-6 h-6 opacity-20" />
                                </div>
                                <p>Tuyệt vời! Bạn không có nhiệm vụ nào cần xử lý ngay.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {myTasks.slice(0, 5).map((task) => (
                                    <Link
                                        key={task.id}
                                        href={`/dashboard/projects/${task.column?.project?.slug}?taskId=${task.id}`}
                                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-bold">
                                                    {getPriorityLabel(task.priority)}
                                                </Badge>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                                    <span>{task.column?.project?.name}</span>
                                                    {getColumnStatusIcon(task.column?.name || '', "w-3 h-3")}
                                                    <span>{task.column?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {task.dueDate && (
                                            <div className="text-right flex-shrink-0">
                                                <p className={cn(
                                                    "text-xs font-medium",
                                                    new Date(task.dueDate) < new Date() ? "text-red-500" : "text-muted-foreground"
                                                )}>
                                                    {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: vi })}
                                                </p>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Projects Sidebar */}
                <Card className="border-border/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold">Dự án gần đây</CardTitle>
                        <CardDescription>Các không gian làm việc của bạn</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <p className="text-sm text-muted-foreground mb-4">Bạn chưa tham gia dự án nào.</p>
                                <Button asChild variant="outline" size="sm" className="w-full rounded-xl">
                                    <Link href="/dashboard/projects/new">Tạo dự án mới</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {projects.slice(0, 4).map((project, index) => {
                                    const categories = ['Design', 'Development', 'Marketing', 'Research'];
                                    const category = categories[index % categories.length];
                                    const colors = categoryColors[category];

                                    return (
                                        <Link
                                            key={project.id}
                                            href={`/dashboard/projects/${project.slug}`}
                                            className="block group"
                                        >
                                            <div className={cn(
                                                "p-4 rounded-xl border border-transparent transition-all group-hover:border-primary/20",
                                                colors.bg
                                            )}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", colors.text)}>
                                                        {category}
                                                    </span>
                                                    <div className="flex -space-x-2">
                                                        {[1, 2, 3].slice(0, project._count?.members || 1).map((_, i) => (
                                                            <Avatar key={i} className="w-6 h-6 border-2 border-background">
                                                                <AvatarImage
                                                                    src={`https://api.dicebear.com/9.x/big-ears/svg?seed=${project.id}-${i}`}
                                                                />
                                                                <AvatarFallback>M</AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                    </div>
                                                </div>
                                                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                    {project.name}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                    {project.description || `${project._count?.columns || 0} cột · ${project._count?.members || 1} thành viên`}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                                <Button variant="outline" className="w-full text-xs rounded-xl" asChild>
                                    <Link href="/dashboard/projects">Xem tất cả dự án</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
