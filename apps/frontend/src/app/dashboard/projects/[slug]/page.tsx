'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectService, taskService, Project, Task, Column } from '@/lib/services/project.service';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    KeyboardSensor,
    useSensors,
    useSensor,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
} from '@dnd-kit/core';

import {
    useSortable,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    Plus,
    Trash2,
    ChevronRight,
    MoreHorizontal,
    GripVertical,
    Settings,
    UserPlus,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// Separate component for task card content (reused in DragOverlay)
function TaskCardContent({
    task,
    getPriorityBadge,
}: {
    task: Task;
    getPriorityBadge: (priority: string) => { class: string; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
}) {
    const badge = getPriorityBadge(task.priority);
    return (
        <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-white">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                    </Badge>
                </div>
                <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-2">
                    {task.title}
                </h4>
                {task.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                    </p>
                )}
                <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                            <MoreHorizontal className="w-4 h-4" />
                        </span>
                    </div>
                    {task.assignees && task.assignees.length > 0 && (
                        <Avatar className="w-6 h-6">
                            <AvatarImage
                                src={task.assignees[0].avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignees[0].id}`}
                                alt={task.assignees[0].fullName}
                            />
                            <AvatarFallback>{task.assignees[0].fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}

                </div>
            </CardContent>
        </Card>
    );
}

// Sortable wrapper for task cards
function SortableTaskCard({
    task,
    onClick,
    getPriorityBadge,
}: {
    task: Task;
    onClick: () => void;
    getPriorityBadge: (priority: string) => { class: string; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: { type: 'task', task },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleClick = (e: React.MouseEvent) => {
        // Only trigger onClick if not dragging
        if (!isDragging) {
            onClick();
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <div onClick={handleClick}>
                <TaskCardContent task={task} getPriorityBadge={getPriorityBadge} />
            </div>
        </div>
    );
}

// Droppable column wrapper for drop targets
function DroppableColumn({
    column,
    children,
    onAddTask,
    onDeleteColumn,
    showAddTask,
    newTaskTitle,
    setNewTaskTitle,
    setShowAddTask,
    handleAddTask,
}: {
    column: Column;
    children: React.ReactNode;
    onAddTask: () => void;
    onDeleteColumn: () => void;
    showAddTask: boolean;
    newTaskTitle: string;
    setNewTaskTitle: (value: string) => void;
    setShowAddTask: (value: string | null) => void;
    handleAddTask: (columnId: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
        data: { type: 'column', column },
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex-shrink-0 w-80 flex flex-col rounded-xl transition-colors ${isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/50'
                }`}
        >
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color || '#6b7280' }}
                    />
                    <h3 className="font-semibold text-foreground">{column.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                        {column.tasks?.length || 0}
                    </Badge>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onAddTask}
                        className="h-8 w-8"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDeleteColumn}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Tasks Area */}
            <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto scrollbar-thin min-h-[100px]">
                {/* Add Task Form */}
                {showAddTask && (
                    <Card className="p-4">
                        <Input
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Nhập tiêu đề công việc..."
                            className="mb-2"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTask(column.id);
                                if (e.key === 'Escape') setShowAddTask(null);
                            }}
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={() => handleAddTask(column.id)}
                            >
                                Thêm
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowAddTask(null)}
                            >
                                Hủy
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Task Cards */}
                {children}
            </div>
        </div>
    );
}

// Sortable column wrapper for column reordering
function SortableColumn({
    column,
    children,
}: {
    column: Column;
    children: React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `column-${column.id}`,
        data: { type: 'column', column },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex-shrink-0"
        >
            {/* Drag Handle for Column */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 cursor-grab active:cursor-grabbing z-10 p-1 rounded hover:bg-accent/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            {children}
        </div>
    );
}

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
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [activeColumn, setActiveColumn] = useState<Column | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
            toast.success('Đã thêm cột mới');
        } catch (error) {
            console.error('Failed to add column:', error);
            toast.error('Không thể thêm cột');
        }
    };

    const handleDeleteColumn = async (columnId: string) => {
        if (!project) return;
        const column = project.columns?.find(c => c.id === columnId);
        if (!column) return;

        const taskCount = column.tasks?.length || 0;
        const confirmMessage = taskCount > 0
            ? `Cột "${column.name}" có ${taskCount} công việc. Bạn có chắc muốn xóa?`
            : `Bạn có chắc muốn xóa cột "${column.name}"?`;

        if (!confirm(confirmMessage)) return;

        try {
            await projectService.deleteColumn(project.id, columnId);
            toast.success('Đã xóa cột');
            loadProject();
        } catch (error) {
            console.error('Failed to delete column:', error);
            toast.error('Không thể xóa cột');
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
        const badges: Record<string, { class: string; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            LOW: { class: 'badge-low', label: 'Low', variant: 'secondary' },
            MEDIUM: { class: 'badge-medium', label: 'Medium', variant: 'default' },
            HIGH: { class: 'badge-high', label: 'High', variant: 'destructive' },
            CRITICAL: { class: 'badge-critical', label: 'Critical', variant: 'destructive' },
        };
        return badges[priority] || badges.MEDIUM;
    };

    const findTaskById = (id: string): Task | null => {
        for (const column of project?.columns || []) {
            const task = column.tasks?.find(t => t.id === id);
            if (task) return task;
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeId = active.id as string;

        // Check if dragging a column
        if (activeId.startsWith('column-')) {
            const columnId = activeId.replace('column-', '');
            const column = project?.columns?.find(c => c.id === columnId);
            if (column) {
                setActiveColumn(column);
                setActiveTask(null);
            }
        } else {
            // Dragging a task
            const task = findTaskById(activeId);
            if (task) {
                setActiveTask(task);
                setActiveColumn(null);
            }
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || !project) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Skip if dragging columns
        if (activeId.startsWith('column-')) return;

        const activeTask = findTaskById(activeId);
        if (!activeTask) return;

        // Find source and destination columns
        const activeColumn = project.columns?.find(c => c.id === activeTask.columnId);

        // Check if over a column directly
        let overColumn = project.columns?.find(c => c.id === overId);

        // Or over a task in a column
        if (!overColumn) {
            const overTask = findTaskById(overId);
            if (overTask) {
                overColumn = project.columns?.find(c => c.id === overTask.columnId);
            }
        }

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

        // Move task to new column (optimistic update while dragging)
        setProject(prev => {
            if (!prev?.columns) return prev;

            const activeColumnIndex = prev.columns.findIndex(c => c.id === activeColumn.id);
            const overColumnIndex = prev.columns.findIndex(c => c.id === overColumn!.id);

            const newColumns = [...prev.columns];

            // Remove from active column
            newColumns[activeColumnIndex] = {
                ...newColumns[activeColumnIndex],
                tasks: newColumns[activeColumnIndex].tasks?.filter(t => t.id !== activeId) || []
            };

            // Add to over column
            const overTaskIndex = overId === overColumn!.id
                ? (newColumns[overColumnIndex].tasks?.length || 0)
                : (newColumns[overColumnIndex].tasks?.findIndex(t => t.id === overId) || 0);

            const updatedTask = { ...activeTask, columnId: overColumn!.id };
            const overTasks = [...(newColumns[overColumnIndex].tasks || [])];
            overTasks.splice(overTaskIndex, 0, updatedTask);

            newColumns[overColumnIndex] = {
                ...newColumns[overColumnIndex],
                tasks: overTasks
            };

            return { ...prev, columns: newColumns };
        });
    };


    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setActiveColumn(null);

        if (!over || !project) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Handle column reordering
        if (activeId.startsWith('column-') && overId.startsWith('column-')) {
            const activeColumnId = activeId.replace('column-', '');
            const overColumnId = overId.replace('column-', '');

            if (activeColumnId !== overColumnId) {
                const columns = project.columns || [];
                const activeIndex = columns.findIndex(c => c.id === activeColumnId);
                const overIndex = columns.findIndex(c => c.id === overColumnId);

                if (activeIndex !== -1 && overIndex !== -1) {
                    const newColumns = arrayMove(columns, activeIndex, overIndex);
                    // Optimistic update
                    setProject({ ...project, columns: newColumns });

                    try {
                        await projectService.reorderColumns(project.id, newColumns.map(c => c.id));
                        toast.success('Đã sắp xếp lại cột');
                    } catch (error) {
                        console.error('Failed to reorder columns:', error);
                        toast.error('Không thể sắp xếp lại cột');
                        loadProject(); // Revert on error
                    }
                }
            }
            return;
        }

        // Handle task dragging
        const task = findTaskById(activeId);
        if (!task) return;

        let targetColumnId: string | null = null;
        let targetPosition = 0;

        // Check if dropped on a column
        const targetColumn = project.columns?.find(c => c.id === overId);
        if (targetColumn) {
            targetColumnId = targetColumn.id;
            targetPosition = targetColumn.tasks?.length || 0;
        } else {
            // Check if dropped on another task
            const overTask = findTaskById(overId);
            if (overTask) {
                targetColumnId = overTask.columnId;
                const column = project.columns?.find(c => c.id === targetColumnId);
                if (column) {
                    const taskIndex = column.tasks?.findIndex(t => t.id === overId) || 0;
                    targetPosition = taskIndex;
                }
            } else {
                return;
            }
        }

        if (targetColumnId && (targetColumnId !== task.columnId || targetPosition !== task.position)) {
            try {
                await taskService.move(activeId, targetColumnId, targetPosition);
                loadProject();
            } catch (error) {
                console.error('Failed to move task:', error);
                toast.error('Không thể di chuyển công việc');
            }
        }
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

            {/* Kanban Board with Drag and Drop */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >

                <div className="flex-1 overflow-x-auto pb-4">
                    <SortableContext
                        items={project.columns?.map(c => `column-${c.id}`) || []}
                        strategy={horizontalListSortingStrategy}
                    >
                        <div className="flex gap-6 h-full">
                            {/* Columns */}
                            {project.columns?.map((column) => (

                                <DroppableColumn
                                    key={column.id}
                                    column={column}
                                    onAddTask={() => setShowAddTask(column.id)}
                                    onDeleteColumn={() => handleDeleteColumn(column.id)}
                                    showAddTask={showAddTask === column.id}
                                    newTaskTitle={newTaskTitle}
                                    setNewTaskTitle={setNewTaskTitle}
                                    setShowAddTask={setShowAddTask}
                                    handleAddTask={handleAddTask}
                                >
                                    <SortableContext
                                        items={column.tasks?.map(t => t.id) || []}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {column.tasks?.map((task) => (
                                            <SortableTaskCard
                                                key={task.id}
                                                task={task}
                                                onClick={() => setSelectedTask(task)}
                                                getPriorityBadge={getPriorityBadge}
                                            />
                                        ))}
                                    </SortableContext>
                                </DroppableColumn>
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
                    </SortableContext>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTask && (
                        <div className="rotate-3 scale-105">
                            <TaskCardContent task={activeTask} getPriorityBadge={getPriorityBadge} />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
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
