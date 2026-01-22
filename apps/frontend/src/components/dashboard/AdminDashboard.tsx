'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { SystemSettings } from '@/components/dashboard/SystemSettings';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    Users,
    CheckCircle2,
    XCircle,
    FolderKanban,
    ShieldAlert,
    UserCheck,
    UserX,
    Activity,
    RefreshCw,
    UserPlus,
    LogIn,
    LogOut,
    Trash2,
    Edit,
    MessageSquare,
    Plus,
    Move,
    UserMinus,
    Settings,
    Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface User {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    isAdmin: boolean;
    isBlocked: boolean;
    createdAt: string;
    lastSeenAt?: string;
}

interface Stats {
    users: number;
    projects: number;
    tasks: number;
    comments: number;
    onlineUsers: number;
    offlineUsers: number;
    blockedUsers: number;
}

interface ActivityLog {
    id: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    createdAt: string;
    user: {
        id: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
    };
    project?: {
        id: string;
        name: string;
        slug: string;
    };
}

interface Project {
    id: string;
    name: string;
    slug: string;
    _count: {
        members: number;
        columns: number;
    };
}

export function AdminDashboard() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('activity');

    const loadData = useCallback(async () => {
        try {
            const [usersRes, statsRes, logsRes, projectsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/stats'),
                api.get('/admin/logs?limit=30'),
                api.get('/admin/projects'),
            ]);
            setUsers(usersRes.data);
            setStats(statsRes.data);
            setLogs(logsRes.data);
            setProjects(projectsRes.data);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            // Don't toast error aggressively on initial load if auth is shaky, but here it's inside AdminDashboard so auth should be fine.
            toast.error('Không thể tải dữ liệu admin');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadProjectLogs = useCallback(async (projectId: string) => {
        try {
            const endpoint = projectId === 'all'
                ? '/admin/logs?limit=30'
                : projectId === 'system'
                    ? '/admin/logs/system?limit=30'
                    : `/admin/logs/project/${projectId}?limit=30`;
            const res = await api.get(endpoint);
            setLogs(res.data);
        } catch (error) {
            console.error('Failed to load project logs:', error);
        }
    }, []);

    useEffect(() => {
        if (user?.isAdmin) {
            loadData();
        }
    }, [user, loadData]);

    useEffect(() => {
        if (selectedProjectId) {
            loadProjectLogs(selectedProjectId);
        }
    }, [selectedProjectId, loadProjectLogs]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
        toast.success('Đã cập nhật dữ liệu');
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

    const handleExport = async (type: 'users' | 'logs') => {
        try {
            const res = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type === 'users' ? 'users' : 'activity_logs'}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Đã xuất file thành công');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Lỗi khi xuất dữ liệu');
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

    const getActionIcon = (action: string) => {
        const icons: Record<string, React.ReactNode> = {
            USER_REGISTERED: <UserPlus className="w-4 h-4 text-green-500" />,
            USER_LOGIN: <LogIn className="w-4 h-4 text-blue-500" />,
            USER_LOGOUT: <LogOut className="w-4 h-4 text-gray-500" />,
            USER_BLOCKED: <UserX className="w-4 h-4 text-red-500" />,
            USER_UNBLOCKED: <UserCheck className="w-4 h-4 text-green-500" />,
            PROJECT_CREATED: <FolderKanban className="w-4 h-4 text-purple-500" />,
            PROJECT_DELETED: <Trash2 className="w-4 h-4 text-red-500" />,
            TASK_CREATED: <Plus className="w-4 h-4 text-green-500" />,
            TASK_UPDATED: <Edit className="w-4 h-4 text-blue-500" />,
            TASK_MOVED: <Move className="w-4 h-4 text-amber-500" />,
            TASK_DELETED: <Trash2 className="w-4 h-4 text-red-500" />,
            TASK_COMPLETED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
            COMMENT_ADDED: <MessageSquare className="w-4 h-4 text-blue-500" />,
            MEMBER_ADDED: <UserPlus className="w-4 h-4 text-green-500" />,
            MEMBER_REMOVED: <UserMinus className="w-4 h-4 text-red-500" />,
        };
        return icons[action] || <Activity className="w-4 h-4 text-gray-500" />;
    };

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            USER_REGISTERED: 'đã đăng ký tài khoản',
            USER_LOGIN: 'đã đăng nhập',
            USER_LOGOUT: 'đã đăng xuất',
            USER_BLOCKED: 'bị khóa tài khoản',
            USER_UNBLOCKED: 'được mở khóa tài khoản',
            PROJECT_CREATED: 'tạo dự án mới',
            PROJECT_DELETED: 'xóa dự án',
            TASK_CREATED: 'tạo công việc mới',
            TASK_UPDATED: 'cập nhật công việc',
            TASK_MOVED: 'di chuyển công việc',
            TASK_DELETED: 'xóa công việc',
            TASK_COMPLETED: 'hoàn thành công việc',
            COMMENT_ADDED: 'thêm bình luận',
            MEMBER_ADDED: 'thêm thành viên',
            MEMBER_REMOVED: 'xóa thành viên',
        };
        return labels[action] || action;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Quản trị hệ thống</h1>
                    <p className="text-muted-foreground">
                        Theo dõi hoạt động và quản lý người dùng
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="border-border/40 shadow-sm rounded-2xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-indigo-500/10">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.users || 0}</p>
                                <p className="text-sm text-muted-foreground">Tổng người dùng</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/40 shadow-sm rounded-2xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <UserCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.onlineUsers || 0}</p>
                                <p className="text-sm text-muted-foreground">Đang online</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/40 shadow-sm rounded-2xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gray-500/10">
                                <UserX className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.offlineUsers || 0}</p>
                                <p className="text-sm text-muted-foreground">Offline</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AnalyticsCharts />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="activity" className="gap-2">
                        <Activity className="w-4 h-4" />
                        Hoạt động
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="gap-2">
                        <FolderKanban className="w-4 h-4" />
                        Theo dự án
                    </TabsTrigger>
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="w-4 h-4" />
                        Quản lý người dùng
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Cấu hình
                    </TabsTrigger>
                </TabsList>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                    <Card className="border-border/40 shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Hoạt động gần đây
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleExport('logs')}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Xuất CSV
                                </Button>
                            </div>
                            <CardDescription className="-mt-4">
                                Tất cả hoạt động trong hệ thống
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {logs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Chưa có hoạt động nào được ghi nhận</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="p-2 rounded-lg bg-muted">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-5 h-5">
                                                        <AvatarImage src={log.user.avatarUrl} />
                                                        <AvatarFallback className="text-[10px]">
                                                            {log.user.fullName?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-sm">
                                                        {log.user.fullName}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {getActionLabel(log.action)}
                                                    </span>
                                                </div>
                                                {log.project && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        {log.project.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(log.createdAt), {
                                                    addSuffix: true,
                                                    locale: vi,
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-4">
                    <Card className="border-border/40 shadow-sm rounded-2xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FolderKanban className="w-5 h-5" />
                                        Hoạt động theo dự án
                                    </CardTitle>
                                    <CardDescription>
                                        Xem log theo từng dự án cụ thể
                                    </CardDescription>
                                </div>
                                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                    <SelectTrigger className="w-[250px]">
                                        <SelectValue placeholder="Chọn dự án" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả hoạt động</SelectItem>
                                        <SelectItem value="system">Chỉ hệ thống</SelectItem>
                                        {projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name} ({project._count.members} thành viên)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {logs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Không có hoạt động nào cho lựa chọn này</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="p-2 rounded-lg bg-muted">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-5 h-5">
                                                        <AvatarImage src={log.user.avatarUrl} />
                                                        <AvatarFallback className="text-[10px]">
                                                            {log.user.fullName?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-sm">
                                                        {log.user.fullName}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {getActionLabel(log.action)}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(log.createdAt), {
                                                    addSuffix: true,
                                                    locale: vi,
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card className="border-border/40 shadow-sm rounded-2xl">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Quản lý người dùng
                                    </CardTitle>
                                    <CardDescription>
                                        {filteredUsers.length} người dùng
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm người dùng..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 w-[200px]"
                                        />
                                    </div>
                                    <Select value={filter} onValueChange={setFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="admin">Chỉ Admin</SelectItem>
                                            <SelectItem value="blocked">Đã khóa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" onClick={() => handleExport('users')} title="Xuất danh sách">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {filteredUsers.map((u) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                                    >
                                        <Avatar>
                                            <AvatarImage src={u.avatarUrl} />
                                            <AvatarFallback>
                                                {u.fullName?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium truncate">{u.fullName}</p>
                                                {u.isAdmin && (
                                                    <Badge variant="default" className="text-xs">
                                                        Quản trị
                                                    </Badge>
                                                )}
                                                {u.isBlocked && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Đã khóa
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {u.email}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant={u.isAdmin ? "secondary" : "outline"}
                                                onClick={() => handleToggleAdmin(u.id, !u.isAdmin)}
                                                disabled={u.id === user?.id}
                                            >
                                                <ShieldAlert className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={u.isBlocked ? "default" : "destructive"}
                                                onClick={() => handleToggleBlock(u.id, !u.isBlocked)}
                                                disabled={u.id === user?.id}
                                            >
                                                {u.isBlocked ? (
                                                    <CheckCircle2 className="w-4 h-4" />
                                                ) : (
                                                    <XCircle className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                    <SystemSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
