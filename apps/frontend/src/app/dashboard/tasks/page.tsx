'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { taskService, Task } from '@/lib/services/project.service';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, ClipboardList, ListTodo, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await taskService.getMyTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            toast.error('Không thể tải danh sách công việc');
        } finally {
            setIsLoading(false);
        }
    };

    const getPriorityBadge = (priority: string): { variant: 'default' | 'success' | 'warning' | 'destructive'; label: string } => {
        const badges = {
            LOW: { variant: 'success' as const, label: 'Thấp' },
            MEDIUM: { variant: 'warning' as const, label: 'Trung bình' },
            HIGH: { variant: 'destructive' as const, label: 'Cao' },
            CRITICAL: { variant: 'destructive' as const, label: 'Khẩn cấp' },
        };
        return badges[priority as keyof typeof badges] || badges.MEDIUM;
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || task.priority === filter;
        return matchesSearch && matchesFilter;
    });

    const tasksByStatus = {
        todo: filteredTasks.filter(t => t.column?.name?.toLowerCase().includes('to do') || t.column?.name?.toLowerCase().includes('backlog')),
        inProgress: filteredTasks.filter(t => t.column?.name?.toLowerCase().includes('progress')),
        done: filteredTasks.filter(t => t.column?.name?.toLowerCase().includes('done') || t.column?.name?.toLowerCase().includes('complete')),
    };

    const stats = [
        { label: 'Tổng công việc', value: tasks.length, icon: ClipboardList, color: 'text-primary' },
        { label: 'Chờ làm', value: tasksByStatus.todo.length, icon: ListTodo, color: 'text-slate-500' },
        { label: 'Đang làm', value: tasksByStatus.inProgress.length, icon: Clock, color: 'text-amber-500' },
        { label: 'Hoàn thành', value: tasksByStatus.done.length, icon: CheckCircle2, color: 'text-green-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Công việc của tôi</h1>
                <p className="text-muted-foreground mt-1">Tất cả công việc được giao cho bạn</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Tìm kiếm công việc..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Độ ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="CRITICAL">Khẩn cấp</SelectItem>
                        <SelectItem value="HIGH">Cao</SelectItem>
                        <SelectItem value="MEDIUM">Trung bình</SelectItem>
                        <SelectItem value="LOW">Thấp</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label} className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Icon className={cn("w-5 h-5", stat.color)} />
                                    <span className="text-muted-foreground text-sm">{stat.label}</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Tasks List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-16 h-6" />
                                    <Skeleton className="flex-1 h-5" />
                                    <Skeleton className="w-24 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Không tìm thấy công việc
                        </h3>
                        <p className="text-muted-foreground">
                            Công việc được giao cho bạn sẽ xuất hiện ở đây
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-0 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Công việc</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dự án</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Trạng thái</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Độ ưu tiên</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Hạn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredTasks.map((task) => {
                                    const badge = getPriorityBadge(task.priority);
                                    return (
                                        <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/dashboard/projects/${task.column?.project?.slug || 'unknown'}?task=${task.id}`}
                                                    className="font-medium text-foreground hover:text-primary transition-colors"
                                                >
                                                    {task.title}
                                                </Link>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground truncate max-w-md">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {task.column?.project?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline">
                                                    {task.column?.name || 'Unknown'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={badge.variant}>
                                                    {badge.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
