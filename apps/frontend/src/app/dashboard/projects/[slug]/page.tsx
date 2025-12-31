'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectService, taskService, Project, Task } from '@/lib/services/project.service';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [showAddTask, setShowAddTask] = useState<string | null>(null);
    const [newColumnName, setNewColumnName] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState('');

    useEffect(() => {
        loadProject();
    }, [slug]);

    const loadProject = async () => {
        try {
            const data = await projectService.getBySlug(slug);
            setProject(data);
        } catch (error) {
            console.error('Failed to load project:', error);
            router.push('/dashboard/projects');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddColumn = async () => {
        if (!newColumnName.trim() || !project) return;
        try {
            await projectService.addColumn(project.id, newColumnName);
            setNewColumnName('');
            setShowAddColumn(false);
            loadProject();
        } catch (error) {
            console.error('Failed to add column:', error);
        }
    };

    const handleAddTask = async (columnId: string) => {
        if (!newTaskTitle.trim()) return;
        try {
            await taskService.create({
                title: newTaskTitle,
                columnId,
            });
            setNewTaskTitle('');
            setShowAddTask(null);
            loadProject();
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    };

    const getPriorityBadge = (priority: string) => {
        const badges: Record<string, { class: string; label: string }> = {
            LOW: { class: 'badge-low', label: 'Low' },
            MEDIUM: { class: 'badge-medium', label: 'Medium' },
            HIGH: { class: 'badge-high', label: 'High' },
            CRITICAL: { class: 'badge-critical', label: 'Critical' },
        };
        return badges[priority] || badges.MEDIUM;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500">Loading project...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Link href="/dashboard/projects" className="hover:text-indigo-500">Projects</Link>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-900">{project.name}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Members */}
                    <div className="flex -space-x-2 mr-2">
                        {project.members?.slice(0, 4).map((member, i) => (
                            <div key={member.id} className="w-9 h-9 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                                <img
                                    src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
                                    alt={member.user?.fullName}
                                    className="w-full h-full"
                                />
                            </div>
                        ))}
                        {(project.members?.length || 0) > 4 && (
                            <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-sm font-medium text-gray-600">
                                +{(project.members?.length || 0) - 4}
                            </div>
                        )}
                    </div>

                    <button className="btn-secondary flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Invite
                    </button>

                    <Link href={`/dashboard/projects/${slug}/settings`} className="btn-ghost">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 h-full">
                    {/* Columns */}
                    {project.columns?.map((column) => (
                        <div
                            key={column.id}
                            className="flex-shrink-0 w-80 flex flex-col bg-gray-100 rounded-xl"
                        >
                            {/* Column Header */}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: column.color || '#6b7280' }}
                                    />
                                    <h3 className="font-semibold text-gray-900">{column.name}</h3>
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                                        {column.tasks?.length || 0}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowAddTask(column.id)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>

                            {/* Tasks */}
                            <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto scrollbar-thin">
                                {/* Add Task Form */}
                                {showAddTask === column.id && (
                                    <div className="kanban-task">
                                        <input
                                            type="text"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder="Enter task title..."
                                            className="w-full text-sm border-none focus:outline-none mb-2"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddTask(column.id);
                                                if (e.key === 'Escape') setShowAddTask(null);
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAddTask(column.id)}
                                                className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600"
                                            >
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setShowAddTask(null)}
                                                className="px-3 py-1.5 text-gray-500 text-xs font-medium hover:bg-gray-100 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Task Cards */}
                                {column.tasks?.map((task) => {
                                    const badge = getPriorityBadge(task.priority);
                                    return (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className="kanban-task"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded border ${badge.class}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                                                {task.title}
                                            </h4>
                                            {task.description && (
                                                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between text-gray-400">
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                        2
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                        1
                                                    </span>
                                                </div>
                                                {task.assignee && (
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                                        <img
                                                            src={task.assignee.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee.id}`}
                                                            alt={task.assignee.fullName}
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Add Column */}
                    <div className="flex-shrink-0 w-80">
                        {showAddColumn ? (
                            <div className="bg-gray-100 rounded-xl p-4">
                                <input
                                    type="text"
                                    value={newColumnName}
                                    onChange={(e) => setNewColumnName(e.target.value)}
                                    placeholder="Enter column name..."
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddColumn();
                                        if (e.key === 'Escape') setShowAddColumn(false);
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddColumn}
                                        className="flex-1 px-3 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600"
                                    >
                                        Add Column
                                    </button>
                                    <button
                                        onClick={() => setShowAddColumn(false)}
                                        className="px-3 py-2 text-gray-500 text-sm font-medium hover:bg-gray-200 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddColumn(true)}
                                className="w-full h-12 flex items-center justify-center gap-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Column
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Task Detail Panel */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
                    <div className="w-full max-w-lg bg-white h-full overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-sm text-gray-500">TC-{selectedTask.id.slice(0, 3).toUpperCase()}</span>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedTask.title}</h2>

                            {/* Meta */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                                    <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                                        {selectedTask.column?.name || 'To Do'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Priority</label>
                                    <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getPriorityBadge(selectedTask.priority).class}`}>
                                        {getPriorityBadge(selectedTask.priority).label}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                                <p className="text-gray-700">
                                    {selectedTask.description || 'No description provided'}
                                </p>
                            </div>

                            {/* Subtasks */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-500">Subtasks</label>
                                    <span className="text-sm text-gray-400">0/0</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-0"></div>
                                </div>
                            </div>

                            {/* Comments */}
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Comments</label>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600">
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
