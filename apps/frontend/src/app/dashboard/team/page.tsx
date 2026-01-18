'use client';

import { useEffect, useState } from 'react';
import { projectService, ProjectMember, Project } from '@/lib/services/project.service';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Separator } from '@/components/ui/separator';
import { Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TeamMember extends ProjectMember {
    projectName: string;
    projectSlug: string;
}

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTeamMembers();
    }, []);

    const loadTeamMembers = async () => {
        try {
            const projects = await projectService.getAll();
            const allMembers: TeamMember[] = [];

            projects.forEach((project: Project) => {
                if (project.members) {
                    project.members.forEach((member: ProjectMember) => {
                        allMembers.push({
                            ...member,
                            projectName: project.name,
                            projectSlug: project.slug,
                        });
                    });
                }
            });

            const uniqueMembers = allMembers.reduce((acc, member) => {
                if (!acc.find(m => m.userId === member.userId)) {
                    acc.push(member);
                }
                return acc;
            }, [] as TeamMember[]);

            setMembers(uniqueMembers);
        } catch (error) {
            console.error('Failed to load team members:', error);
            toast.error('Không thể tải danh sách thành viên');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleBadge = (role: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
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

    const filteredMembers = members.filter(member =>
        member.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Nhóm</h1>
                <p className="text-muted-foreground mt-1">Tất cả thành viên trong các dự án</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Tìm kiếm thành viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Team Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-16 h-16 rounded-full" />
                                    <div className="flex-1">
                                        <Skeleton className="h-5 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredMembers.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Không tìm thấy thành viên
                        </h3>
                        <p className="text-muted-foreground">
                            Mời thành viên vào dự án để thấy họ ở đây
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map((member) => (
                        <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className="w-14 h-14">
                                        <AvatarImage
                                            src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
                                        />
                                        <AvatarFallback>
                                            {member.user?.fullName?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground truncate">
                                            {member.user?.fullName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {member.user?.email}
                                        </p>
                                        <Badge variant={getRoleBadge(member.role)} className="mt-2">
                                            {getRoleLabel(member.role)}
                                        </Badge>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Dự án:</p>
                                    <Badge variant="outline" className="text-xs">
                                        {member.projectName}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
