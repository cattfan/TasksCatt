'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Users, CheckCircle2, XCircle, FolderKanban, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface User {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    isAdmin: boolean;
    isBlocked: boolean;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    totalProjects: number;
}

export default function AdminPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (user?.isAdmin) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/stats'),
            ]);
            setUsers(usersRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            toast.error('Không thể tải dữ liệu admin');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleBlock = async (userId: string, block: boolean) => {
        try {
            await api.patch(`/admin/users/${userId}`, { isBlocked: block });
            toast.success(block ? 'Đã khóa người dùng' : 'Đã mở khóa người dùng');
            loadData();
        } catch (error) {
            console.error('Failed to update user:', error);
            toast.error('Không thể cập nhật người dùng');
        }
    };

    const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
        try {
            await api.patch(`/admin/users/${userId}`, { isAdmin });
            toast.success(isAdmin ? 'Đã cấp quyền Admin' : 'Đã thu hồi quyền Admin');
            loadData();
        } catch (error) {
            console.error('Failed to update user:', error);
            toast.error('Không thể cập nhật quyền');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'blocked') return matchesSearch && u.isBlocked;
        if (filter === 'admin') return matchesSearch && u.isAdmin;
        return matchesSearch;
    });

    // Access denied
    if (!user?.isAdmin) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Truy cập bị từ chối</h2>
                    <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
                </div>
            </div>
        );
    }

    const statItems = stats ? [
        { label: 'Tổng người dùng', value: stats.totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Đang hoạt động', value: stats.activeUsers, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Đã khóa', value: stats.blockedUsers, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Tổng dự án', value: stats.totalProjects, icon: FolderKanban, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Quản trị hệ thống</h1>
                <p className="text-muted-foreground mt-1">Quản lý người dùng và cài đặt hệ thống</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {statItems.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.label} className="border-0 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                                            <Icon className={cn("w-6 h-6", stat.color)} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-muted-foreground mt-1">{stat.label}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Lọc" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="admin">Chỉ Admin</SelectItem>
                        <SelectItem value="blocked">Chỉ đã khóa</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            {isLoading ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <Skeleton className="flex-1 h-4" />
                                <Skeleton className="w-20 h-8" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-0 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Người dùng</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Trạng thái</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vai trò</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ngày tham gia</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} />
                                                    <AvatarFallback>{u.fullName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-foreground">{u.fullName}</p>
                                                    <p className="text-sm text-muted-foreground">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={u.isBlocked ? 'destructive' : 'success'}>
                                                {u.isBlocked ? 'Đã khóa' : 'Hoạt động'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={u.isAdmin ? 'default' : 'secondary'}>
                                                {u.isAdmin ? 'Admin' : 'User'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {u.id !== user?.id && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleAdmin(u.id, !u.isAdmin)}
                                                    >
                                                        {u.isAdmin ? 'Thu hồi Admin' : 'Cấp Admin'}
                                                    </Button>
                                                    <Button
                                                        variant={u.isBlocked ? 'outline' : 'destructive'}
                                                        size="sm"
                                                        onClick={() => handleToggleBlock(u.id, !u.isBlocked)}
                                                    >
                                                        {u.isBlocked ? 'Mở khóa' : 'Khóa'}
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
