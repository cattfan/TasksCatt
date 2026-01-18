'use client';

import { useState, useEffect } from 'react';
import { taskService, Task, Project } from '@/lib/services/project.service';
import { commentService, Comment } from '@/lib/services/comment.service';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    X,
    Pencil,
    Trash2,
    Send,
    Calendar,
    User,
    Flag,
    MessageSquare,
    Loader2,
    Tag,
    ListChecks,
    Plus,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Label {
    id: string;
    name: string;
    color: string;
}

interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    position: number;
}

interface TaskDetailPanelProps {
    task: Task & { taskLabels?: { label: Label }[]; subtasks?: Subtask[] };
    project: Project & { labels?: Label[] };
    onClose: () => void;
    onUpdate: () => void;
}

export default function TaskDetailPanel({ task, project, onClose, onUpdate }: TaskDetailPanelProps) {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [newSubtask, setNewSubtask] = useState('');
    const [showAddSubtask, setShowAddSubtask] = useState(false);

    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);

    const [formData, setFormData] = useState({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        columnId: task.columnId,
        assigneeIds: task.assignees?.map(a => a.id) || [],
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });

    const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
    const [taskLabels, setTaskLabels] = useState<Label[]>(
        task.taskLabels?.map(tl => tl.label) || []
    );

    useEffect(() => {
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            columnId: task.columnId,
            assigneeIds: task.assignees?.map(a => a.id) || [],
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        });
        setSubtasks(task.subtasks || []);
        setTaskLabels(task.taskLabels?.map(tl => tl.label) || []);
    }, [task]);

    useEffect(() => {
        loadComments();
    }, [task.id]);

    const loadComments = async () => {
        try {
            const data = await commentService.getByTask(task.id);
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoadingComments(false);
        }
    };

    const updateTaskField = async (field: string, value: any) => {
        // Skip if value hasn't changed (basic check)
        if (field !== 'assigneeIds' && task[field as keyof Task] === value && field !== 'columnId') return;

        // Deep check for arrays
        if (field === 'assigneeIds') {
            const currentIds = task.assignees?.map(a => a.id) || [];
            if (JSON.stringify(currentIds.sort()) === JSON.stringify(value.sort())) return;
        }

        setIsSaving(true);
        try {
            const updateData: any = { [field]: value };

            // Special handling for some fields
            if (field === 'dueDate' && value === '') updateData[field] = null;

            await taskService.update(task.id, updateData);

            // Special handling for column change (move task)
            if (field === 'columnId' && value !== task.columnId) {
                const targetColumn = project.columns?.find(c => c.id === value);
                const targetPos = targetColumn ? (targetColumn.tasks?.length || 0) : 0;
                await taskService.move(task.id, value, targetPos);
            }

            toast.success('Đã cập nhật công việc');
            onUpdate();
        } catch (error) {
            console.error(`Failed to update task ${field}:`, error);
            toast.error('Không thể cập nhật công việc');
            // Revert local state on error
            setFormData(prev => ({
                ...prev,
                [field]: field === 'assigneeIds'
                    ? (task.assignees?.map(a => a.id) || [])
                    : (task[field as keyof Task] || '')
            }));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleAssignee = (userId: string) => {
        const currentIds = formData.assigneeIds || [];
        const newIds = currentIds.includes(userId)
            ? currentIds.filter(id => id !== userId)
            : [...currentIds, userId];

        setFormData({ ...formData, assigneeIds: newIds });
        updateTaskField('assigneeIds', newIds);
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc muốn xóa công việc này?')) return;
        try {
            await taskService.delete(task.id);
            toast.success('Đã xóa công việc');
            onUpdate();
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error('Không thể xóa công việc');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await commentService.create({ taskId: task.id, content: newComment });
            setNewComment('');
            toast.success('Đã thêm bình luận');
            loadComments();
        } catch (error) {
            console.error('Failed to add comment:', error);
            toast.error('Không thể thêm bình luận');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Xóa bình luận này?')) return;
        try {
            await commentService.delete(commentId);
            toast.success('Đã xóa bình luận');
            loadComments();
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtask.trim()) return;
        try {
            // TODO: Call API when backend is ready
            const newItem: Subtask = {
                id: Date.now().toString(),
                title: newSubtask,
                completed: false,
                position: subtasks.length,
            };
            setSubtasks([...subtasks, newItem]);
            setNewSubtask('');
            setShowAddSubtask(false);
            toast.success('Đã thêm subtask');
        } catch (error) {
            toast.error('Không thể thêm subtask');
        }
    };

    const handleToggleSubtask = async (subtaskId: string) => {
        setSubtasks(subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        ));
    };

    const handleDeleteSubtask = async (subtaskId: string) => {
        setSubtasks(subtasks.filter(st => st.id !== subtaskId));
        toast.success('Đã xóa subtask');
    };

    const getPriorityBadge = (priority: string): { variant: 'default' | 'success' | 'warning' | 'destructive'; label: string } => {
        const badges = {
            LOW: { variant: 'success' as const, label: 'Thấp' },
            MEDIUM: { variant: 'warning' as const, label: 'Trung bình' },
            HIGH: { variant: 'destructive' as const, label: 'Cao' },
            CRITICAL: { variant: 'destructive' as const, label: 'Khẩn cấp' },
        };
        return badges[priority as keyof typeof badges] || badges.MEDIUM;
    };

    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-background h-full overflow-hidden flex flex-col shadow-xl animate-in slide-in-from-right"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                    <span className="text-sm text-muted-foreground font-mono">
                        TC-{task.id.slice(0, 6).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        {/* Title Section */}
                        <div className="space-y-1">
                            {editingTitle ? (
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    onBlur={() => {
                                        setEditingTitle(false);
                                        updateTaskField('title', formData.title);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setEditingTitle(false);
                                            updateTaskField('title', formData.title);
                                        }
                                        if (e.key === 'Escape') {
                                            setEditingTitle(false);
                                            setFormData({ ...formData, title: task.title });
                                        }
                                    }}
                                    autoFocus
                                    className="text-xl font-bold h-auto py-1 px-2 border-primary"
                                />
                            ) : (
                                <h2
                                    className="text-xl font-bold text-foreground cursor-pointer hover:bg-accent/50 p-1 rounded-md transition-colors"
                                    onClick={() => setEditingTitle(true)}
                                >
                                    {task.title}
                                </h2>
                            )}
                        </div>

                        {/* Status & Priority Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Flag className="w-3 h-3" />
                                    Trạng thái
                                </label>
                                <Select
                                    value={formData.columnId}
                                    onValueChange={(value) => {
                                        setFormData({ ...formData, columnId: value });
                                        updateTaskField('columnId', value);
                                    }}
                                >
                                    <SelectTrigger className="h-9 border-none bg-accent/40 hover:bg-accent/60 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {project.columns?.map((col: any) => (
                                            <SelectItem key={col.id} value={col.id}>
                                                {col.name.replace(/[📋🔄👀✅]/g, '').trim()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Flag className="w-3 h-3" />
                                    Độ ưu tiên
                                </label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => {
                                        setFormData({ ...formData, priority: value as Task['priority'] });
                                        updateTaskField('priority', value);
                                    }}
                                >
                                    <SelectTrigger className={cn(
                                        "h-9 border-none transition-colors",
                                        formData.priority === 'LOW' && "bg-success/10 text-success hover:bg-success/20",
                                        formData.priority === 'MEDIUM' && "bg-warning/10 text-warning hover:bg-warning/20",
                                        formData.priority === 'HIGH' && "bg-destructive/10 text-destructive hover:bg-destructive/20",
                                        formData.priority === 'CRITICAL' && "bg-destructive/20 text-destructive font-bold hover:bg-destructive/30"
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Thấp</SelectItem>
                                        <SelectItem value="MEDIUM">Trung bình</SelectItem>
                                        <SelectItem value="HIGH">Cao</SelectItem>
                                        <SelectItem value="CRITICAL">Khẩn cấp</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Assignee & Due Date Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Người thực hiện
                                </label>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-9 w-full justify-start border-none bg-accent/40 hover:bg-accent/60 transition-colors px-3 font-normal">
                                            {formData.assigneeIds && formData.assigneeIds.length > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-2">
                                                        {formData.assigneeIds.map(id => {
                                                            const member = project.members?.find(m => m.userId === id);
                                                            return (
                                                                <Avatar key={id} className="w-5 h-5 border-2 border-background ring-1 ring-border">
                                                                    <AvatarImage src={member?.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} />
                                                                    <AvatarFallback className="text-[10px]">{member?.user?.fullName?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                            );
                                                        })}
                                                    </div>
                                                    <span className="text-sm">
                                                        {formData.assigneeIds.length} người
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <User className="w-4 h-4 dashed border rounded-full p-0.5" />
                                                    <span className="text-sm">Chưa giao</span>
                                                </div>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="start">
                                        {project.members?.map((member) => (
                                            <DropdownMenuCheckboxItem
                                                key={member.userId}
                                                checked={formData.assigneeIds?.includes(member.userId)}
                                                onCheckedChange={() => toggleAssignee(member.userId)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-5 h-5">
                                                        <AvatarImage
                                                            src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
                                                        />
                                                        <AvatarFallback>
                                                            {member.user?.fullName?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{member.user?.fullName}</span>
                                                </div>
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Hạn chót
                                </label>
                                <Input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => {
                                        setFormData({ ...formData, dueDate: e.target.value });
                                        updateTaskField('dueDate', e.target.value);
                                    }}
                                    className="h-9 border-none bg-accent/40 hover:bg-accent/60 transition-colors cursor-pointer text-sm"
                                />
                            </div>
                        </div>

                        {/* Labels Section */}
                        {taskLabels.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Tag className="w-3 h-3" />
                                    Nhãn
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {taskLabels.map((label) => (
                                        <Badge
                                            key={label.id}
                                            style={{ backgroundColor: label.color + '20', color: label.color, borderColor: label.color }}
                                            variant="outline"
                                            className="px-2 py-0 h-6 text-xs"
                                        >
                                            {label.name}
                                        </Badge>
                                    ))}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full border border-dashed">
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Description Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Tag className="w-3 h-3 invisible" /> {/* Spacer */}
                                Mô tả
                            </label>
                            {editingDescription ? (
                                <div className="space-y-2">
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Thêm mô tả chi tiết..."
                                        rows={5}
                                        autoFocus
                                        className="text-sm resize-none bg-accent/20 focus:bg-background transition-all"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setEditingDescription(false);
                                                updateTaskField('description', formData.description);
                                            }}
                                            disabled={isSaving}
                                        >
                                            Lưu
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditingDescription(false);
                                                setFormData({ ...formData, description: task.description || '' });
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="text-sm text-foreground whitespace-pre-wrap hover:bg-accent/30 p-3 rounded-xl cursor-pointer min-h-[100px] transition-colors bg-accent/10"
                                    onClick={() => setEditingDescription(true)}
                                >
                                    {task.description || <span className="text-muted-foreground italic">Nhấn để thêm mô tả...</span>}
                                </div>
                            )}
                        </div>

                        {/* Subtasks Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <ListChecks className="w-3 h-3" />
                                    Subtasks ({completedSubtasks}/{subtasks.length})
                                </label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddSubtask(true)}
                                    className="h-7 text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Thêm
                                </Button>
                            </div>

                            {/* Progress Bar */}
                            {subtasks.length > 0 && (
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-500 ease-out"
                                        style={{ width: `${subtaskProgress}%` }}
                                    />
                                </div>
                            )}

                            {/* Subtask List */}
                            <div className="space-y-1">
                                {subtasks.map((subtask) => (
                                    <div
                                        key={subtask.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 group transition-colors"
                                    >
                                        <Checkbox
                                            checked={subtask.completed}
                                            onCheckedChange={() => handleToggleSubtask(subtask.id)}
                                            className="w-4 h-4"
                                        />
                                        <span className={cn(
                                            "flex-1 text-sm transition-all",
                                            subtask.completed && "line-through text-muted-foreground opacity-70"
                                        )}>
                                            {subtask.title}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteSubtask(subtask.id)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}

                                {/* Add Subtask Form */}
                                {showAddSubtask && (
                                    <div className="flex items-center gap-2 p-2 bg-accent/20 rounded-lg mt-2">
                                        <Input
                                            value={newSubtask}
                                            onChange={(e) => setNewSubtask(e.target.value)}
                                            placeholder="Nhập subtask..."
                                            className="h-8 text-sm focus-visible:ring-1"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddSubtask();
                                                if (e.key === 'Escape') {
                                                    setShowAddSubtask(false);
                                                    setNewSubtask('');
                                                }
                                            }}
                                        />
                                        <Button size="sm" className="h-8 w-8 p-0" onClick={handleAddSubtask}>
                                            <Check className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Comments Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Bình luận ({comments.length})
                            </h3>

                            {/* Comment List */}
                            <div className="space-y-4">
                                {isLoadingComments ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Chưa có bình luận
                                    </p>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="w-8 h-8 flex-shrink-0">
                                                <AvatarImage
                                                    src={comment.author?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.id}`}
                                                />
                                                <AvatarFallback>
                                                    {comment.author?.fullName?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-medium text-foreground">
                                                        {comment.author?.fullName}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                        {comment.author?.id === user?.id && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Comment */}
                            <div className="flex gap-3">
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage
                                        src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                    />
                                    <AvatarFallback>
                                        {user?.fullName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Thêm bình luận..."
                                        className="flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddComment();
                                        }}
                                    />
                                    <Button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        size="icon"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div >
        </div >
    );
}
