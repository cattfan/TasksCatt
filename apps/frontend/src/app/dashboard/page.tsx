'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, Project } from '@/lib/services/project.service';

export default function DashboardPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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

        loadProjects();
    }, []);

    const stats = [
        {
            label: 'Total Active',
            value: projects.filter(p => p._count?.columns).length,
            change: '+12%',
            changeType: 'positive',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'bg-green-500'
        },
        {
            label: 'Completed',
            value: 0,
            change: '+5%',
            changeType: 'positive',
            icon: 'M5 13l4 4L19 7',
            color: 'bg-indigo-500'
        },
        {
            label: 'Delayed',
            value: 0,
            change: '-2%',
            changeType: 'negative',
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'bg-amber-500'
        },
    ];

    const categoryColors: Record<string, string> = {
        'Design': 'border-l-pink-500 bg-pink-50',
        'Development': 'border-l-blue-500 bg-blue-50',
        'Marketing': 'border-l-green-500 bg-green-50',
        'Research': 'border-l-purple-500 bg-purple-50',
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
                    <p className="text-gray-500 mt-1">Welcome back, {user?.fullName?.split(' ')[0]}!</p>
                </div>
                <Link
                    href="/dashboard/projects/new"
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Project
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                </svg>
                            </div>
                            <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-gray-500 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Projects Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                    <Link href="/dashboard/projects" className="text-indigo-500 hover:text-indigo-600 text-sm font-medium">
                        View all →
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card p-6 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                        <p className="text-gray-500 mb-6">Create your first project to get started</p>
                        <Link href="/dashboard/projects/new" className="btn-primary inline-flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Project
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.slice(0, 6).map((project, index) => {
                            const categories = ['Design', 'Development', 'Marketing', 'Research'];
                            const category = categories[index % categories.length];

                            return (
                                <Link
                                    key={project.id}
                                    href={`/dashboard/projects/${project.slug}`}
                                    className={`card card-hover p-6 border-l-4 ${categoryColors[category] || 'border-l-gray-400'}`}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2.5 py-1 text-xs font-medium bg-white rounded-md border border-gray-200">
                                            {category}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                                        {project.name}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                        {project.description || 'No description provided'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].slice(0, project._count?.members || 1).map((_, i) => (
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
                                        <span className="text-xs text-gray-400">2h ago</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
