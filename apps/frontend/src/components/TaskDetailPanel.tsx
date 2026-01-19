'use client';

import { useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { projectService, taskService, Task, Project, Label, Subtask } from '@/lib/services/project.service';
import { commentService, Comment } from '@/lib/services/comment.service';
import { attachmentService, Attachment } from '@/lib/services/attachment.service';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';


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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';


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
    Inbox,
    PlayCircle,
    Eye,
    CheckCircle,
    ListTodo,
    Paperclip,
    Image as ImageIcon,
    FileIcon,
    Download,
} from 'lucide-react';



// Helper function to get Lucide icon for column based on name (Synchronized with page.tsx)
function getColumnIcon(columnName: string) {
    const name = columnName.toLowerCase();
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
    return <ListTodo className="w-4 h-4" />;
}

// Helper to strip emoji from column name
function stripEmoji(text: string): string {
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
}

interface TaskDetailPanelProps {
    task: Task;
    project: Project;
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

    const [isCreatingLabel, setIsCreatingLabel] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#3b82f6');

    const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Mentions state
    const [mentionSearch, setMentionSearch] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        try {
            const uploads = Array.from(files).map(file =>
                attachmentService.upload(file, task.id)
            );
            const results = await Promise.all(uploads);
            setPendingAttachments(prev => [...prev, ...results]);
            toast.success(`Đã tải lên ${results.length} tệp`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tải lên tệp');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const files: File[] = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
                    files.push(file);
                }
            }
        }

        if (files.length > 0) {
            e.preventDefault();
            setIsUploading(true);
            try {
                const uploads = files.map(file => attachmentService.upload(file, task.id));
                const results = await Promise.all(uploads);
                setPendingAttachments(prev => [...prev, ...results]);
                toast.success('Đã tải lên ảnh từ clipboard');
            } catch (error) {
                toast.error('Không thể tải lên ảnh');
            } finally {
                setIsUploading(false);
            }
        }
    };



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
            // Special handling for column change (move task) - only call move, not update
            if (field === 'columnId' && value !== task.columnId) {
                const targetColumn = project.columns?.find(c => c.id === value);
                const targetPos = targetColumn ? (targetColumn.tasks?.length || 0) : 0;
                await taskService.move(task.id, value, targetPos);
                toast.success('Đã di chuyển công việc');
                onUpdate();
                return;
            }

            const updateData: any = { [field]: value };

            // Special handling for some fields
            if (field === 'dueDate' && value === '') updateData[field] = null;

            await taskService.update(task.id, updateData);

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

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const pos = e.target.selectionStart || 0;
        setNewComment(val);
        setCursorPosition(pos);

        // Simple mention detection: find last @ before cursor
        const textBeforeCursor = val.substring(0, pos);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ')) {
            const query = textBeforeCursor.substring(lastAt + 1);
            if (!query.includes(' ')) {
                setMentionSearch(query);
                setShowMentions(true);
                return;
            }
        }
        setShowMentions(false);
    };

    const insertMention = (member: any) => {
        const textBeforeAt = newComment.substring(0, newComment.lastIndexOf('@', cursorPosition - 1));
        const textAfterCursor = newComment.substring(cursorPosition);
        const name = member.user?.fullName || member.user?.email || 'user';
        const updatedComment = `${textBeforeAt}@${name} ${textAfterCursor}`;

        setNewComment(updatedComment);
        setShowMentions(false);
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
        if (!newComment.trim() && pendingAttachments.length === 0) return;
        try {
            // If content is empty but has attachments, send a space to satisfy backend @IsNotEmpty
            const content = newComment.trim() || " ";
            const comment = await commentService.create({ taskId: task.id, content });


            // Link pending attachments to this comment
            if (pendingAttachments.length > 0) {
                await Promise.all(
                    pendingAttachments.map(attr =>
                        attachmentService.link(attr.id, { commentId: comment.id })
                    )
                );
            }

            setNewComment('');
            setPendingAttachments([]);
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
                                                <div className="flex items-center gap-2">
                                                    <div style={{ color: col.color || '#6b7280' }}>
                                                        {getColumnIcon(col.name)}
                                                    </div>
                                                    {stripEmoji(col.name)}
                                                </div>
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

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full border border-dashed">
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuLabel className="text-xs">Nhãn dự án</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <div className="max-h-48 overflow-y-auto">
                                            {project.labels && project.labels.length > 0 ? (
                                                project.labels.map((label) => {
                                                    const isChecked = taskLabels.some(tl => tl.id === label.id);
                                                    return (
                                                        <DropdownMenuCheckboxItem
                                                            key={label.id}
                                                            checked={isChecked}
                                                            onCheckedChange={async () => {
                                                                try {
                                                                    if (isChecked) {
                                                                        await taskService.removeLabel(task.id, label.id);
                                                                        setTaskLabels(prev => prev.filter(l => l.id !== label.id));
                                                                    } else {
                                                                        await taskService.addLabel(task.id, label.id);
                                                                        setTaskLabels(prev => [...prev, label]);
                                                                    }
                                                                    onUpdate();
                                                                } catch (error) {
                                                                    toast.error('Không thể cập nhật nhãn');
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                                                                {label.name}
                                                            </div>
                                                        </DropdownMenuCheckboxItem>
                                                    );
                                                })
                                            ) : (
                                                <div className="px-2 py-3 text-xs text-muted-foreground italic text-center">
                                                    Chưa có nhãn dự án
                                                </div>
                                            )}
                                        </div>

                                        <DropdownMenuSeparator />
                                        <div className="p-2">
                                            {isCreatingLabel ? (
                                                <div className="space-y-2">
                                                    <Input
                                                        size={1}
                                                        value={newLabelName}
                                                        onChange={(e) => setNewLabelName(e.target.value)}
                                                        placeholder="Tên nhãn..."
                                                        className="h-7 text-xs"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="flex flex-wrap gap-1">
                                                        {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'].map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setNewLabelColor(color);
                                                                }}
                                                                className={`w-4 h-4 rounded-full border ${newLabelColor === color ? 'ring-1 ring-offset-1 ring-primary' : ''}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            className="h-6 text-[10px] flex-1"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!newLabelName.trim()) return;
                                                                try {
                                                                    const label = await projectService.createLabel(project.id, {
                                                                        name: newLabelName,
                                                                        color: newLabelColor
                                                                    });
                                                                    // Automatically add to task
                                                                    await taskService.addLabel(task.id, label.id);
                                                                    setTaskLabels(prev => [...prev, label]);
                                                                    setNewLabelName('');
                                                                    setIsCreatingLabel(false);
                                                                    onUpdate();
                                                                    toast.success('Đã tạo và gắn nhãn');
                                                                } catch (error) {
                                                                    toast.error('Không thể tạo nhãn');
                                                                }
                                                            }}
                                                        >
                                                            Tạo
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 text-[10px]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsCreatingLabel(false);
                                                            }}
                                                        >
                                                            Hủy
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full h-7 justify-start text-[10px] font-medium"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsCreatingLabel(true);
                                                    }}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Tạo nhãn mới
                                                </Button>
                                            )}
                                        </div>
                                    </DropdownMenuContent>

                                </DropdownMenu>
                            </div>
                        </div>


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
                                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                                    {comment.content}
                                                </p>

                                                {/* Comment Attachments */}
                                                {comment.attachments && comment.attachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {comment.attachments.map((attr) => {
                                                            const isImage = attr.mimeType?.startsWith('image/');
                                                            const fullUrl = `${API_URL}${attr.fileUrl}`;
                                                            return (

                                                                <div key={attr.id} className="group relative">
                                                                    {isImage ? (
                                                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                                                                            <img
                                                                                src={fullUrl}
                                                                                alt={attr.fileName}
                                                                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                                                                                onClick={() => window.open(fullUrl, '_blank')}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div
                                                                            className="flex items-center gap-2 p-2 bg-accent/30 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition truncate max-w-[200px]"
                                                                            onClick={() => window.open(fullUrl, '_blank')}
                                                                        >
                                                                            <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                            <span className="text-xs truncate">{attr.fileName}</span>
                                                                        </div>
                                                                    )}
                                                                    <a
                                                                        href={fullUrl}
                                                                        download={attr.fileName}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="absolute -top-1 -right-1 bg-background border border-border rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                                                    >
                                                                        <Download className="w-3 h-3" />
                                                                    </a>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Add Comment - Fixed at bottom */}
                <div className="p-4 border-t bg-background flex-shrink-0">

                    <div className="flex gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage
                                src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                            />
                            <AvatarFallback>
                                {user?.fullName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <div className="flex gap-2 relative">
                                <div className="flex-1 relative">
                                    {showMentions && (
                                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                            <div className="p-2 border-b bg-muted/30">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nhắc đến thành viên</span>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {project.members?.filter(m =>
                                                    m.user?.fullName?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
                                                    m.user?.email?.toLowerCase().includes(mentionSearch.toLowerCase())
                                                ).map(member => (
                                                    <button
                                                        key={member.id}
                                                        className="w-full flex items-center gap-2 p-2 hover:bg-accent transition-colors text-left"
                                                        onClick={() => insertMention(member)}
                                                    >
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarImage src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`} />
                                                            <AvatarFallback>{member.user?.fullName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium truncate">{member.user?.fullName}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate">{member.user?.email}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                                {project.members?.filter(m =>
                                                    m.user?.fullName?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
                                                    m.user?.email?.toLowerCase().includes(mentionSearch.toLowerCase())
                                                ).length === 0 && (
                                                        <div className="p-4 text-center text-xs text-muted-foreground italic">Không tìm thấy thành viên</div>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                    <Input
                                        value={newComment}
                                        onChange={handleCommentChange}
                                        onPaste={handlePaste}
                                        placeholder="Thêm bình luận hoặc dán ảnh..."
                                        className="pr-10 focus-visible:ring-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                                                e.preventDefault();
                                                handleAddComment();
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Paperclip className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e.target.files)}
                                    />
                                </div>
                                <Button
                                    onClick={handleAddComment}
                                    disabled={(!newComment.trim() && pendingAttachments.length === 0) || isUploading}
                                    size="icon"
                                    className="shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Pending Attachments Preview */}
                            {pendingAttachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {pendingAttachments.map((attr) => {
                                        const isImage = attr.mimeType?.startsWith('image/');
                                        const fullUrl = `${API_URL}${attr.fileUrl}`;
                                        return (

                                            <div key={attr.id} className="group relative">
                                                {isImage ? (
                                                    <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                                                        <img
                                                            src={fullUrl}
                                                            alt={attr.fileName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/30 rounded-md border border-border max-w-full">
                                                        <FileIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        <span className="text-[10px] truncate max-w-[100px]">{attr.fileName}</span>
                                                    </div>

                                                )}
                                                <button
                                                    className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 shadow-sm hover:bg-destructive hover:text-destructive-foreground transition"
                                                    onClick={async () => {
                                                        await attachmentService.delete(attr.id);
                                                        setPendingAttachments(prev => prev.filter(a => a.id !== attr.id));
                                                    }}
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
