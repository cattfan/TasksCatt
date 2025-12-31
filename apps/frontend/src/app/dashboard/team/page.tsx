'use client';

import { useEffect, useState } from 'react';
import { projectService, ProjectMember } from '@/lib/services/project.service';

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

            projects.forEach((project: any) => {
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

            // Remove duplicates by user ID, keeping the first occurrence
            const uniqueMembers = allMembers.reduce((acc, member) => {
                if (!acc.find(m => m.userId === member.userId)) {
                    acc.push(member);
                }
                return acc;
            }, [] as TeamMember[]);

            setMembers(uniqueMembers);
        } catch (error) {
            console.error('Failed to load team members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            OWNER: 'bg-purple-100 text-purple-700',
            ADMIN: 'bg-indigo-100 text-indigo-700',
            MEMBER: 'bg-green-100 text-green-700',
            VIEWER: 'bg-gray-100 text-gray-700',
        };
        return colors[role] || colors.MEMBER;
    };

    const filteredMembers = members.filter(member =>
        member.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Team</h1>
                <p className="text-gray-500 mt-1">All team members across your projects</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                />
            </div>

            {/* Team Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                                <div className="flex-1">
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members found</h3>
                    <p className="text-gray-500">Invite people to your projects to see them here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map((member) => (
                        <div key={member.id} className="card p-6 card-hover">
                            <div className="flex items-start gap-4">
                                <img
                                    src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
                                    alt={member.user?.fullName}
                                    className="w-16 h-16 rounded-full bg-gray-200"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{member.user?.fullName}</h3>
                                    <p className="text-sm text-gray-500 truncate">{member.user?.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">Projects:</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                        {member.projectName}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
