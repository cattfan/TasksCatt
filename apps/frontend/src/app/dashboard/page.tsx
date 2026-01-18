'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, Project } from '@/lib/services/project.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    Plus,
    FolderKanban,
    ArrowRight,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const data = await projectService.getAll();
                setProjects(data);
            } catch (error) {
                console.error('Failed to load projects:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProjects();
    }, []);

    const stats = [
        {
            label: 'Đang hoạt động',
            value: projects.filter(p => p._count?.columns).length,
            change: '+12%',
            isPositive: true,
            icon: CheckCircle2,
            color: 'bg-green-500',
            iconBg: 'bg-green-500/10',
            iconColor: 'text-green-500',
        },
        {
            label: 'Hoàn thành',
            value: 0,
            change: '+5%',
            isPositive: true,
            icon: CheckCircle2,
            color: 'bg-primary',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
        },
        {
            label: 'Trễ deadline',
            value: 0,
            change: '-2%',
            isPositive: false,
            icon: Clock,
            color: 'bg-amber-500',
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-500',
        },
    ];

    const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
        'Design': { border: 'border-l-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600' },
        'Development': { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600' },
        'Marketing': { border: 'border-l-green-500', bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600' },
        'Research': { border: 'border-l-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600' },
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dự án của tôi</h1>
                    <p className="text-muted-foreground mt-1">
                        Chào mừng trở lại, {user?.fullName?.split(' ')[0]}!
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/projects/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Dự án mới
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label} className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.iconBg)}>
                                        <Icon className={cn("w-6 h-6", stat.iconColor)} />
                                    </div>
                                    <Badge
                                        variant={stat.isPositive ? "success" : "destructive"}
                                        className="font-medium"
                                    >
                                        {stat.isPositive ? (
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3 mr-1" />
                                        )}
                                        {stat.change}
                                    </Badge>
                                </div>
                                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-muted-foreground mt-1">{stat.label}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Projects Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">Dự án gần đây</h2>
                    <Button variant="ghost" asChild className="text-primary">
                        <Link href="/dashboard/projects">
                            Xem tất cả
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="border-0 shadow-sm">
                                <CardContent className="p-6">
                                    <Skeleton className="h-5 w-20 mb-4" />
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full mb-4" />
                                    <div className="flex gap-2">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <FolderKanban className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Chưa có dự án nào
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Tạo dự án đầu tiên để bắt đầu
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/projects/new">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Dự án mới
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.slice(0, 6).map((project, index) => {
                            const categories = ['Design', 'Development', 'Marketing', 'Research'];
                            const category = categories[index % categories.length];
                            const colors = categoryColors[category];

                            return (
                                <Link
                                    key={project.id}
                                    href={`/dashboard/projects/${project.slug}`}
                                    className="block"
                                >
                                    <Card className={cn(
                                        "border-0 shadow-sm border-l-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                                        colors.border,
                                        colors.bg
                                    )}>
                                        <CardContent className="p-6">
                                            <Badge variant="outline" className={cn("mb-3", colors.text)}>
                                                {category}
                                            </Badge>
                                            <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
                                                {project.name}
                                            </h3>
                                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                                {project.description || 'Không có mô tả'}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].slice(0, project._count?.members || 1).map((_, i) => (
                                                        <Avatar key={i} className="w-8 h-8 border-2 border-background">
                                                            <AvatarImage
                                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.id}-${i}`}
                                                            />
                                                            <AvatarFallback>M</AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                    {(project._count?.members || 1) > 3 && (
                                                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                            +{(project._count?.members || 1) - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">2h trước</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
