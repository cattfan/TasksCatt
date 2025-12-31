'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { taskService, Task } from '@/lib/services/project.service';

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await taskService.getMyTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPriorityBadge = (priority: string) => {
        const badges: Record<string, { class: string; label: string }> = {
            LOW: { class: 'bg-green-100 text-green-700', label: 'Low' },
            MEDIUM: { class: 'bg-amber-100 text-amber-700', label: 'Medium' },
            HIGH: { class: 'bg-orange-100 text-orange-700', label: 'High' },
            CRITICAL: { class: 'bg-red-100 text-red-700', label: 'Critical' },
        };
        return badges[priority] || badges.MEDIUM;
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || task.priority === filter;
        return matchesSearch && matchesFilter;
    });

    const tasksByStatus = {
        todo: filteredTasks.filter(t => t.column?.name?.toLowerCase().includes('to do') || t.column?.name?.toLowerCase().includes('backlog')),
        inProgress: filteredTasks.filter(t => t.column?.name?.toLowerCase().includes('progress')),
        done: filteredTasks.filter(t => t.column?.name?.toLowerCase().includes('done') || t.column?.name?.toLowerCase().includes('complete')),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                    <p className="text-gray-500 mt-1">All tasks assigned to you across projects</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                    />
                </div>

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                >
                    <option value="all">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Tasks', value: tasks.length, color: 'bg-indigo-500' },
                    { label: 'To Do', value: tasksByStatus.todo.length, color: 'bg-gray-500' },
                    { label: 'In Progress', value: tasksByStatus.inProgress.length, color: 'bg-amber-500' },
                    { label: 'Done', value: tasksByStatus.done.length, color: 'bg-green-500' },
                ].map((stat) => (
                    <div key={stat.label} className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                            <span className="text-gray-500 text-sm">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Tasks List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card p-4 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-6 bg-gray-200 rounded" />
                                <div className="flex-1 h-5 bg-gray-200 rounded" />
                                <div className="w-24 h-6 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-500">Tasks assigned to you will appear here</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredTasks.map((task) => {
                                const badge = getPriorityBadge(task.priority);
                                return (
                                    <tr key={task.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/dashboard/projects/${task.column?.project?.slug || 'unknown'}?task=${task.id}`}
                                                className="font-medium text-gray-900 hover:text-indigo-600"
                                            >
                                                {task.title}
                                            </Link>
                                            {task.description && (
                                                <p className="text-sm text-gray-500 truncate max-w-md">{task.description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {task.column?.project?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                {task.column?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
