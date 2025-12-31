'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectService, Project, ProjectMember } from '@/lib/services/project.service';

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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
            router.push('/dashboard/projects');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;

        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await projectService.update(project.id, formData);
            setMessage({ type: 'success', text: 'Project updated successfully!' });
            loadProject();
        } catch {
            setMessage({ type: 'error', text: 'Failed to update project' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !inviteEmail) return;

        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await projectService.addMember(project.id, inviteEmail, inviteRole);
            setMessage({ type: 'success', text: 'Member invited successfully!' });
            setInviteEmail('');
            loadProject();
        } catch {
            setMessage({ type: 'error', text: 'Failed to invite member' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!project || !confirm('Are you sure you want to remove this member?')) return;

        try {
            await projectService.removeMember(project.id, memberId);
            loadProject();
        } catch {
            setMessage({ type: 'error', text: 'Failed to remove member' });
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;

        const confirmed = confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            await projectService.delete(project.id);
            router.push('/dashboard/projects');
        } catch {
            setMessage({ type: 'error', text: 'Failed to delete project' });
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

    const tabs = [
        { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
        { id: 'members', label: 'Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'danger', label: 'Danger Zone', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/dashboard/projects" className="hover:text-indigo-500">Projects</Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <Link href={`/dashboard/projects/${slug}`} className="hover:text-indigo-500">{project.name}</Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900">Settings</span>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
                <p className="text-gray-500 mt-1">Manage your project settings and team members</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                                ? tab.id === 'danger' ? 'border-red-500 text-red-600' : 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                        </svg>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-xl text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="card p-6">
                    <form onSubmit={handleUpdateProject} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="input-field resize-none"
                            />
                        </div>
                        <button type="submit" disabled={isSaving} className="btn-primary">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
                <div className="space-y-6">
                    {/* Invite Form */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h3>
                        <form onSubmit={handleInviteMember} className="flex gap-3">
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Email address"
                                required
                                className="input-field flex-1"
                            />
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="input-field w-40"
                            >
                                <option value="MEMBER">Member</option>
                                <option value="ADMIN">Admin</option>
                                <option value="VIEWER">Viewer</option>
                            </select>
                            <button type="submit" disabled={isSaving} className="btn-primary">
                                Invite
                            </button>
                        </form>
                    </div>

                    {/* Members List */}
                    <div className="card overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {project.members?.map((member: ProjectMember) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
                                                    alt={member.user?.fullName}
                                                    className="w-10 h-10 rounded-full bg-gray-200"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900">{member.user?.fullName}</p>
                                                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(member.joinedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {member.role !== 'OWNER' && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
                <div className="card p-6 border-red-200">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                            <p className="text-gray-500 mt-1 mb-4">
                                Once you delete a project, there is no going back. All tasks, columns, and comments will be permanently deleted.
                            </p>
                            <button
                                onClick={handleDeleteProject}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition"
                            >
                                Delete this project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
