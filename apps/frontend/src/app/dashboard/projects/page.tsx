'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { projectService, Project } from '@/lib/services/project.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Plus,
    Search,
    Filter,
    FolderKanban,
    Clock,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProjectsPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState<{ name: string; description: string; slug?: string; prefix?: string }>({ name: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProjects();
    }, [user?.avatarUrl]);

    const loadProjects = async () => {
        try {
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects:', error);
            toast.error('Không thể tải danh sách dự án');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsCreating(true);

        try {
            const project = await projectService.create(newProject);
            setProjects([project, ...projects]);
            setShowCreateModal(false);
            setNewProject({ name: '', description: '' });
            toast.success('Tạo dự án thành công!');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Không thể tạo dự án';
            setError(message);
            toast.error(message);
        } finally {
            setIsCreating(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
        'Design': { border: 'border-l-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600' },
        'Development': { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600' },
        'Marketing': { border: 'border-l-green-500', bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600' },
        'Research': { border: 'border-l-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600' },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dự án</h1>
                    <p className="text-muted-foreground mt-1">Quản lý và theo dõi tất cả dự án</p>
                </div>
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Dự án mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tạo dự án mới</DialogTitle>
                            <DialogDescription>
                                Điền thông tin để tạo dự án mới
                            </DialogDescription>
                        </DialogHeader>

                        {error && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="projectName" className="text-sm font-medium text-foreground">
                                    Tên dự án *
                                </label>
                                <Input
                                    id="projectName"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    required
                                    minLength={3}
                                    placeholder="Nhập tên dự án"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="projectDesc" className="text-sm font-medium text-foreground">
                                    Mô tả
                                </label>
                                <Textarea
                                    id="projectDesc"
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    rows={3}
                                    placeholder="Mô tả ngắn về dự án"
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        'Tạo dự án'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Tìm kiếm dự án..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Lọc
                </Button>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <Skeleton className="h-5 w-20 mb-4" />
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full mb-4" />
                                <div className="flex justify-between">
                                    <div className="flex gap-2">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <FolderKanban className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {searchQuery ? 'Không tìm thấy dự án' : 'Chưa có dự án nào'}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {searchQuery ? 'Thử từ khóa khác' : 'Tạo dự án đầu tiên để bắt đầu'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Dự án mới
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => {
                        return (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.slug}`}
                                className="block"
                            >
                                <Card className="border-0 shadow-sm border-l-4 border-l-primary/50 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer bg-card">
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
                                            {project.name}
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[40px]">
                                            {project.description || 'Không có mô tả'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {project.members?.slice(0, 3).map((member) => (
                                                    <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                                                        <AvatarImage
                                                            src={member.user?.avatarUrl || `https://api.dicebear.com/9.x/big-ears/svg?seed=${member.userId}`}
                                                        />
                                                        <AvatarFallback>{member.user?.fullName?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                ))}
                                                {(project._count?.members || 1) > 3 && (
                                                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                        +{(project._count?.members || 1) - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
