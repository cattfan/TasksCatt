'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectService, Project } from '@/lib/services/project.service';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

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

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsCreating(true);

        try {
            const project = await projectService.create(newProject);
            setProjects([project, ...projects]);
            setShowCreateModal(false);
            setNewProject({ name: '', description: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create project');
        } finally {
            setIsCreating(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categoryColors: Record<string, { border: string; badge: string }> = {
        'Design': { border: 'border-l-pink-500', badge: 'bg-pink-100 text-pink-700' },
        'Development': { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700' },
        'Marketing': { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700' },
        'Research': { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700' },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-500 mt-1">Manage and track all your projects</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Project
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <button className="btn-secondary flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter
                </button>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                            <div className="flex justify-between">
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchQuery ? 'No projects found' : 'No projects yet'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
                    </p>
                    {!searchQuery && (
                        <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Project
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project, index) => {
                        const categories = ['Design', 'Development', 'Marketing', 'Research'];
                        const category = categories[index % categories.length];
                        const colors = categoryColors[category];

                        return (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.slug}`}
                                className={`card card-hover p-6 border-l-4 ${colors.border}`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${colors.badge}`}>
                                        {category}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                                    {project.name}
                                </h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                    {project.description || 'No description provided'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].slice(0, Math.min(3, project._count?.members || 1)).map((_, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.id}-${i}`}
                                                    alt=""
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        ))}
                                        {(project._count?.members || 1) > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                                +{(project._count?.members || 1) - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs">2h ago</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Create new project</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Project name *
                                </label>
                                <input
                                    type="text"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    required
                                    minLength={3}
                                    className="input-field"
                                    placeholder="Enter project name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    rows={3}
                                    className="input-field resize-none"
                                    placeholder="Add a brief description"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 btn-primary"
                                >
                                    {isCreating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
