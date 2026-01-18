'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectService, Project, ProjectMember } from '@/lib/services/project.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Settings,
    Users,
    AlertTriangle,
    ChevronRight,
    Loader2,
    Trash2,
    UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('MEMBER');

    useEffect(() => {
        loadProject();
    }, [slug]);

    const loadProject = async () => {
        try {
            const data = await projectService.getBySlug(slug);
            setProject(data);
            setFormData({
                name: data.name,
                description: data.description || '',
            });
        } catch (error) {
            console.error('Failed to load project:', error);
            toast.error('Không thể tải dự án');
            router.push('/dashboard/projects');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;

        setIsSaving(true);

        try {
            await projectService.update(project.id, formData);
            toast.success('Cập nhật dự án thành công!');
            loadProject();
        } catch {
            toast.error('Không thể cập nhật dự án');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !inviteEmail) return;

        setIsSaving(true);

        try {
            await projectService.addMember(project.id, inviteEmail, inviteRole);
            toast.success('Đã mời thành viên!');
            setInviteEmail('');
            loadProject();
        } catch {
            toast.error('Không thể mời thành viên');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!project || !confirm('Bạn có chắc muốn xóa thành viên này?')) return;

        try {
            await projectService.removeMember(project.id, memberId);
            toast.success('Đã xóa thành viên');
            loadProject();
        } catch {
            toast.error('Không thể xóa thành viên');
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;

        const confirmed = confirm(`Bạn có chắc muốn xóa "${project.name}"? Hành động này không thể hoàn tác.`);
        if (!confirmed) return;

        try {
            await projectService.delete(project.id);
            toast.success('Đã xóa dự án');
            router.push('/dashboard/projects');
        } catch {
            toast.error('Không thể xóa dự án');
        }
    };

    const getRoleBadge = (role: string): 'default' | 'secondary' | 'success' => {
        const variants: Record<string, 'default' | 'secondary' | 'success'> = {
            OWNER: 'default',
            ADMIN: 'secondary',
            MEMBER: 'success',
            VIEWER: 'secondary',
        };
        return variants[role] || 'secondary';
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            OWNER: 'Chủ sở hữu',
            ADMIN: 'Quản trị',
            MEMBER: 'Thành viên',
            VIEWER: 'Xem',
        };
        return labels[role] || role;
    };

    const tabs = [
        { id: 'general', label: 'Chung', icon: Settings },
        { id: 'members', label: 'Thành viên', icon: Users },
        { id: 'danger', label: 'Nguy hiểm', icon: AlertTriangle },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 w-full overflow-hidden">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard/projects" className="hover:text-primary transition-colors">
                    Dự án
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link href={`/dashboard/projects/${slug}`} className="hover:text-primary transition-colors">
                    {project.name}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">Cài đặt</span>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-foreground">Cài đặt dự án</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý cài đặt và thành viên dự án
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                                activeTab === tab.id
                                    ? tab.id === 'danger'
                                        ? "border-destructive text-destructive"
                                        : "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <form onSubmit={handleUpdateProject} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-foreground">
                                    Tên dự án
                                </label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium text-foreground">
                                    Mô tả
                                </label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                />
                            </div>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    'Lưu thay đổi'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
                <div className="space-y-6">
                    {/* Invite Form */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5" />
                                Mời thành viên
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
                                <Input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="Địa chỉ email"
                                    required
                                    className="flex-1"
                                />
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger className="w-full sm:w-[150px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MEMBER">Thành viên</SelectItem>
                                        <SelectItem value="ADMIN">Quản trị</SelectItem>
                                        <SelectItem value="VIEWER">Xem</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                                    Mời
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Members List */}
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Thành viên</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vai trò</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ngày tham gia</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {project.members?.map((member: ProjectMember) => (
                                        <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage
                                                            src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
                                                        />
                                                        <AvatarFallback>
                                                            {member.user?.fullName?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-foreground">{member.user?.fullName}</p>
                                                        <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getRoleBadge(member.role)}>
                                                    {getRoleLabel(member.role)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {member.role !== 'OWNER' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleRemoveMember(member.id)}
                                                    >
                                                        Xóa
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
                <Card className="border-destructive/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-destructive/10 rounded-xl">
                                <Trash2 className="w-6 h-6 text-destructive" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-foreground">Xóa dự án</h3>
                                <p className="text-muted-foreground mt-1 mb-4">
                                    Khi bạn xóa dự án, tất cả công việc, cột và bình luận sẽ bị xóa vĩnh viễn. Không thể hoàn tác.
                                </p>
                                <Button variant="destructive" onClick={handleDeleteProject}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Xóa dự án này
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
