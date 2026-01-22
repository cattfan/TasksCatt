'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectService, Project, ProjectMember } from '@/lib/services/project.service';
import { useAuth } from '@/contexts/AuthContext';

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
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProjectSettingsPage() {
    const { user } = useAuth();

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
        if (!project) return;

        // Don't allow removing yourself if you are the owner
        const memberToRemove = project.members?.find(m => m.id === memberId);
        if (memberToRemove?.role === 'OWNER') {
            toast.error('Không thể xóa chủ sở hữu');
            return;
        }

        try {
            await projectService.removeMember(project.id, memberId);
            toast.success('Đã xóa thành viên');
            loadProject();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Không thể xóa thành viên';
            toast.error(message);
        }
    };


    const handleUpdateMemberRole = async (memberId: string, role: string) => {
        if (!project) return;

        try {
            await projectService.updateMemberRole(project.id, memberId, role);
            toast.success('Đã cập nhật vai trò');
            loadProject();
        } catch {
            toast.error('Không thể cập nhật vai trò');
        }
    };


    const handleLeaveProject = async () => {
        if (!project || !currentUserMember) return;

        const confirmed = confirm('Bạn có chắc muốn rời khỏi dự án này?');
        if (!confirmed) return;

        try {
            await projectService.removeMember(project.id, currentUserMember.id);
            toast.success('Đã rời khỏi dự án');
            router.push('/dashboard/projects');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể rời dự án');
        }
    };

    const handleDeleteProject = async () => {

        if (!project) return;
        if (currentUserMember?.role !== 'OWNER') {
            toast.error('Chỉ chủ sở hữu mới có quyền xóa dự án');
            return;
        }

        try {
            await projectService.delete(project.id);
            toast.success(`Đã xóa dự án "${project.name}"`);
            router.refresh(); // Force refresh cached data
            router.push('/dashboard/projects');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Không thể xóa dự án';
            toast.error(message);
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

    const currentUserMember = project?.members?.find(m => m.userId === user?.id);
    const isOwnerOrAdmin = currentUserMember?.role === 'OWNER' || currentUserMember?.role === 'ADMIN';
    const isOwner = currentUserMember?.role === 'OWNER';

    const tabs = [
        { id: 'general', label: 'Chung', icon: Settings, visible: isOwnerOrAdmin },
        { id: 'members', label: 'Thành viên', icon: Users, visible: true },
        { id: 'danger', label: 'Nguy hiểm', icon: AlertTriangle, visible: true },
    ].filter(tab => tab.visible);


    // Initial tab check
    useEffect(() => {
        if (project && tabs.length > 0) {
            const currentTabExists = tabs.some(t => t.id === activeTab);
            if (!currentTabExists) {
                setActiveTab(tabs[0].id);
            }
        }
    }, [project, currentUserMember?.role]);


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
                    {isOwnerOrAdmin && (
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
                    )}

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
                                                            src={member.user?.avatarUrl || `https://api.dicebear.com/9.x/big-ears/svg?seed=${member.userId}`}
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
                                                {member.role !== 'OWNER' && (currentUserMember?.role === 'OWNER' || currentUserMember?.role === 'ADMIN') ? (
                                                    <Select
                                                        defaultValue={member.role}
                                                        onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                                                    >
                                                        <SelectTrigger className="w-[130px] h-8 text-xs font-medium">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="MEMBER">Thành viên</SelectItem>
                                                            <SelectItem value="ADMIN">Quản trị</SelectItem>
                                                            <SelectItem value="VIEWER">Xem</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge variant={getRoleBadge(member.role)}>
                                                        {getRoleLabel(member.role)}
                                                    </Badge>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {member.userId !== user?.id && member.role !== 'OWNER' && isOwnerOrAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive h-8 px-2"
                                                        onClick={() => {
                                                            if (confirm(`Bạn có chắc muốn xóa "${member.user?.fullName}" khỏi dự án?`)) {
                                                                handleRemoveMember(member.id);
                                                            }
                                                        }}
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
                <div className="space-y-6">
                    {isOwner ? (
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
                    ) : (
                        <Card className="border-destructive/50 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-destructive/10 rounded-xl">
                                        <X className="w-6 h-6 text-destructive" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-foreground">Rời dự án</h3>
                                        <p className="text-muted-foreground mt-1 mb-4">
                                            Bạn sẽ không còn quyền truy cập vào dự án này sau khi rời đi. Bạn cần được mời lại để tham gia.
                                        </p>
                                        <Button variant="destructive" onClick={handleLeaveProject}>
                                            <X className="w-4 h-4 mr-2" />
                                            Rời khỏi dự án
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

        </div>
    );
}
