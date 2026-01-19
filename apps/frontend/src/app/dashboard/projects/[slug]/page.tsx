'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectService, taskService, Project, Task, Column } from '@/lib/services/project.service';
import { useProjectSocket } from '@/hooks/useProjectSocket';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';


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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {

    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    MoreHorizontal,
    GripVertical,
    Settings,
    UserPlus,
    Loader2,
    Paperclip,
    Calendar,
    MessageSquare,
    Tag,
    Circle,
    CheckCircle2,
    X,
    Users,
    Inbox,
    PlayCircle,
    Eye,
    CheckCircle,
    ListTodo,
} from 'lucide-react';
import { toast } from 'sonner';
import TaskDetailPanel from '@/components/TaskDetailPanel';

// Helper function to get Lucide icon for column based on name
function getColumnIcon(columnName: string) {
    const name = columnName.toLowerCase();

    // Strip emoji from name first (if any)
    const cleanName = name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

    if (cleanName.includes('backlog') || cleanName.includes('todo') || cleanName.includes('to do') || cleanName.includes('new')) {
        return <Inbox className="w-4 h-4" />;
    }
    if (cleanName.includes('progress') || cleanName.includes('doing') || cleanName.includes('working')) {
        return <PlayCircle className="w-4 h-4" />;
    }
    if (cleanName.includes('review') || cleanName.includes('testing') || cleanName.includes('qa')) {
        return <Eye className="w-4 h-4" />;
    }
    if (cleanName.includes('done') || cleanName.includes('complete') || cleanName.includes('finished')) {
        return <CheckCircle className="w-4 h-4" />;
    }
    return <ListTodo className="w-4 h-4" />; // Default icon
}

// Helper to strip emoji from column name
function stripEmoji(text: string): string {
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
}

// Quick action task card matching Linear/Trello UX
function TaskCardContent({
    task,
    getPriorityBadge,
    columns,
    projectLabels,
    onStatusChange,
    onQuickAction,
    onDateChange,
    onToggleLabel,
}: {
    task: Task & { taskLabels?: { label: any }[] };
    getPriorityBadge: (priority: string) => { class: string; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
    columns?: Column[];
    projectLabels?: any[];
    onStatusChange?: (columnId: string) => void;
    onQuickAction?: (action: string) => void;
    onDateChange?: (date: string) => void;
    onToggleLabel?: (labelId: string) => void;
}) {
    const badge = getPriorityBadge(task.priority);
    const currentColumn = columns?.find(c => c.id === task.columnId);
    const taskLabels = task.taskLabels?.map(tl => tl.label) || [];


    // Status color based on column position
    const getStatusColor = (columnName?: string) => {
        if (!columnName) return 'bg-gray-100 text-gray-600';
        const name = columnName.toLowerCase();
        if (name.includes('done') || name.includes('complete')) return 'bg-green-100 text-green-700';
        if (name.includes('progress') || name.includes('doing')) return 'bg-blue-100 text-blue-700';
        if (name.includes('review')) return 'bg-yellow-100 text-yellow-700';
        return 'bg-gray-100 text-gray-600';
    };

    return (
        <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white group border-border/40 overflow-hidden">
            <CardContent className="p-3">
                {/* Title */}
                <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-2">
                    {task.title}
                </h4>

                {/* Sub-info: Tags/Labels if any */}
                {taskLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {taskLabels.map((label: any) => (
                            <span
                                key={label.id}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{ backgroundColor: `${label.color}20`, color: label.color }}
                            >
                                {label.name}
                            </span>
                        ))}
                    </div>
                )}


                {/* Quick Actions Row */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                    {/* Left: Status & Priority */}
                    <div className="flex items-center gap-1 overflow-hidden min-w-0 flex-1">
                        {columns && onStatusChange ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <button className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md transition-colors hover:opacity-80 min-w-0 shrink ${getStatusColor(currentColumn?.name)}`}>
                                        {currentColumn ? getColumnIcon(currentColumn.name) : <Circle className="w-2 h-2 fill-current" />}
                                        <span className="truncate">{currentColumn ? stripEmoji(currentColumn.name) : 'Status'}</span>
                                        <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-44">
                                    {columns.map((col) => (
                                        <DropdownMenuItem
                                            key={col.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStatusChange(col.id);
                                            }}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <div
                                                className="flex items-center justify-center font-bold"
                                                style={{ color: col.color || '#6b7280' }}
                                            >
                                                {getColumnIcon(col.name)}
                                            </div>
                                            {stripEmoji(col.name)}
                                            {col.id === task.columnId && (
                                                <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}

                        {/* Priority Badge right next to status */}
                        <Badge variant={badge.variant} className="text-[9px] px-1 py-0 h-4.5 min-w-0 shrink truncate">
                            {badge.label}
                        </Badge>
                    </div>

                    {/* Right: Quick Action Icons + Assignees */}
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Quick Action Icons - visible on hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAction?.('comment');
                                }}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Bình luận"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Date Edit */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                                        if (input) {
                                            try {
                                                if ('showPicker' in input) {
                                                    (input as any).showPicker();
                                                } else {
                                                    (input as any).click();
                                                }
                                            } catch (err) {
                                                input.click();
                                            }
                                        }
                                    }}
                                    className={`p-1 rounded hover:bg-muted transition-colors flex items-center gap-0.5 ${task.dueDate ? 'text-indigo-600 bg-indigo-50' : 'text-muted-foreground'}`}
                                    title={task.dueDate ? `Hạn: ${new Date(task.dueDate).toLocaleDateString()}` : "Thêm ngày"}
                                >
                                    <Calendar className="w-3 h-3" />
                                    {task.dueDate && (
                                        <span className="text-[9px] font-medium leading-none">
                                            {new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    )}
                                </button>
                                <input
                                    type="date"
                                    className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                                    value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        if (e.target.value !== undefined) {
                                            onDateChange?.(e.target.value);
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Quản lý nhãn"
                                    >
                                        <Tag className="w-3.5 h-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs">Nhãn công việc</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {projectLabels && projectLabels.length > 0 ? (
                                        projectLabels.map((label) => {
                                            const isChecked = taskLabels.some(tl => tl.id === label.id);
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={label.id}
                                                    checked={isChecked}
                                                    onCheckedChange={() => onToggleLabel?.(label.id)}
                                                    className="text-xs"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: label.color }}
                                                        />
                                                        {label.name}
                                                    </div>
                                                </DropdownMenuCheckboxItem>
                                            );
                                        })
                                    ) : (
                                        <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                                            Chưa có nhãn dự án
                                        </div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Assignees */}
                        {task.assignees && task.assignees.length > 0 && (
                            <div className="flex -space-x-1.5 ml-0.5 shrink-0">
                                {task.assignees.slice(0, 2).map((assignee, i) => (
                                    <Avatar key={assignee.id} className="w-5 h-5 border-2 border-white">
                                        <AvatarImage
                                            src={assignee.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.id}`}
                                            alt={assignee.fullName}
                                        />
                                        <AvatarFallback className="text-[8px]">
                                            {assignee.fullName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {task.assignees.length > 2 && (
                                    <div className="w-5 h-5 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                                        +{task.assignees.length - 2}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
    columns,
    projectLabels,
    onStatusChange,
    onQuickAction,
    onDateChange,
    onToggleLabel,
}: {
    task: Task;
    onClick: () => void;
    getPriorityBadge: (priority: string) => { class: string; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
    columns?: Column[];
    projectLabels?: any[];
    onStatusChange?: (taskId: string, columnId: string) => void;
    onQuickAction?: (taskId: string, action: string) => void;
    onDateChange?: (taskId: string, date: string) => void;
    onToggleLabel?: (taskId: string, labelId: string) => void;
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
                <TaskCardContent
                    task={task}
                    getPriorityBadge={getPriorityBadge}
                    columns={columns}
                    projectLabels={projectLabels}
                    onStatusChange={onStatusChange ? (colId) => onStatusChange(task.id, colId) : undefined}
                    onQuickAction={onQuickAction ? (action) => onQuickAction(task.id, action) : undefined}
                    onDateChange={onDateChange ? (date) => onDateChange(task.id, date) : undefined}
                    onToggleLabel={onToggleLabel ? (labelId) => onToggleLabel(task.id, labelId) : undefined}
                />

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
                        className="flex items-center justify-center"
                        style={{ color: column.color || '#6b7280' }}
                    >
                        {getColumnIcon(column.name)}
                    </div>
                    <h3 className="font-semibold text-foreground">{stripEmoji(column.name)}</h3>
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
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('MEMBER');
    const [isInviting, setIsInviting] = useState(false);


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

    const loadProject = useCallback(async () => {
        try {
            const data = await projectService.getBySlug(slug);
            setProject(data);
        } catch (error) {
            console.error('Failed to load project:', error);
            router.push('/dashboard/projects');
        } finally {
            setIsLoading(false);
        }
    }, [slug, router]);

    // Enable realtime updates via WebSocket
    useProjectSocket(project?.id, loadProject);

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

    const handleToggleLabel = async (taskId: string, labelId: string) => {
        const task = findTaskById(taskId);
        if (!task) return;

        const taskLabels = (task as any).taskLabels?.map((tl: any) => tl.label) || [];
        const hasLabel = taskLabels.some((l: any) => l.id === labelId);

        try {
            if (hasLabel) {
                await taskService.removeLabel(taskId, labelId);
            } else {
                await taskService.addLabel(taskId, labelId);
            }
            loadProject();
        } catch (error) {
            console.error('Failed to toggle label:', error);
            toast.error('Không thể cập nhật nhãn');
        }
    };

    // Quick status change from task card dropdown

    const handleQuickStatusChange = async (taskId: string, columnId: string) => {
        try {
            const targetColumn = project?.columns?.find(c => c.id === columnId);
            const targetPos = targetColumn ? (targetColumn.tasks?.length || 0) : 0;
            await taskService.move(taskId, columnId, targetPos);
            toast.success('Đã di chuyển công việc');
            loadProject();
        } catch (error) {
            console.error('Failed to change task status:', error);
            toast.error('Không thể thay đổi trạng thái');
        }
    };

    // Quick action handler (open detail panel with specific section)
    const handleQuickAction = (taskId: string, action: string) => {
        const task = findTaskById(taskId);
        if (task) {
            setSelectedTask(task);
            if (action === 'tag') {
                toast.info("Mở nhãn: Nhãn dùng để phân loại và lọc công việc");
            } else {
                toast.info(`Mở ${action === 'attach' ? 'đính kèm' : action === 'calendar' ? 'lịch' : action === 'comment' ? 'bình luận' : 'nhãn'}`);
            }
        }
    };

    const handleQuickDateChange = async (taskId: string, date: string) => {
        try {
            // If date is blank, set to null
            if (!date || date.trim() === '') {
                await taskService.update(taskId, { dueDate: null });
                toast.success('Đã xóa ngày hết hạn');
                loadProject();
                return;
            }

            const dateObj = new Date(date);
            // Check if it's a valid date
            if (isNaN(dateObj.getTime())) {
                console.error('Invalid date received:', date);
                return;
            }

            const dueDate = dateObj.toISOString();
            await taskService.update(taskId, { dueDate });
            toast.success('Đã cập nhật ngày hết hạn');
            loadProject();
        } catch (error) {
            console.error('Failed to update due date:', error);
            toast.error('Không thể cập nhật ngày');
        }
    };



    const handleInvite = async () => {
        if (!inviteEmail.trim() || !project) return;

        // Safety check for ID
        const targetId = project.id;
        if (!targetId || typeof targetId !== 'string') {
            console.error('Invalid Project ID:', targetId);
            toast.error('Lỗi dữ liệu dự án. Vui lòng tải lại trang.');
            return;
        }

        setIsInviting(true);
        try {
            console.log(`Inviting ${inviteEmail} (Role: ${inviteRole}) to Project: ${targetId}`);
            await projectService.addMember(targetId, inviteEmail, inviteRole as any);
            toast.success(`Đã mời ${inviteEmail} vào dự án`);
            setIsInviteDialogOpen(false);
            setInviteEmail('');
            loadProject();
        } catch (error: any) {
            console.error('Failed to invite member:', error);
            const msg = error.response?.data?.message || 'Email không tồn tại hoặc đã tham gia dự án.';
            toast.error(`Lỗi khi mời: ${msg}`);
        } finally {
            setIsInviting(false);
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

                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                        <DialogTrigger asChild>
                            <button className="btn-secondary flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Invite
                            </button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Mời thành viên</DialogTitle>
                                <DialogDescription>
                                    Nhập email của người bạn muốn mời vào dự án {project.name}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        placeholder="user@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleInvite();
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Vai trò</label>
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MEMBER">Thành viên</SelectItem>
                                            <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                                        </SelectContent>

                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Hủy</Button>
                                <Button onClick={handleInvite} disabled={isInviting}>
                                    {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Gửi lời mời
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Link href={`/dashboard/projects/${slug}/settings`} className="btn-ghost">
                        <Settings className="w-5 h-5" />
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
                                                columns={project.columns}
                                                projectLabels={(project as any).labels}
                                                onStatusChange={handleQuickStatusChange}
                                                onQuickAction={handleQuickAction}
                                                onDateChange={(date) => handleQuickDateChange(task.id, date)}
                                                onToggleLabel={(labelId: string) => handleToggleLabel(task.id, labelId)}
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
                                        <Plus className="w-5 h-5" />
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
                            <TaskCardContent
                                task={activeTask as any}
                                getPriorityBadge={getPriorityBadge}
                                columns={project.columns}
                                projectLabels={(project as any).labels}
                                onQuickAction={(action) => handleQuickAction(activeTask.id, action)}
                                onDateChange={(date) => handleQuickDateChange(activeTask.id, date)}
                                onToggleLabel={(labelId: string) => handleToggleLabel(activeTask.id, labelId)}
                            />

                        </div>
                    )}
                </DragOverlay>

            </DndContext >
            {/* Task Detail Panel */}
            {
                selectedTask && project && (
                    <TaskDetailPanel
                        task={selectedTask}
                        project={project}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={() => loadProject()}
                    />
                )
            }

        </div >
    );
}
