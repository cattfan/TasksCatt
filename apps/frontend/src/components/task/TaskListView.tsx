'use client';

import { useState } from 'react';
import { Task, Column } from '@/lib/services/project.service';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    ChevronRight,
    ChevronDown,
    Calendar,
    MessageSquare,
    Paperclip,
    Circle,
    Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskListViewProps {
    columns: Column[];
    projectPrefix?: string;
    onTaskClick: (task: Task) => void;
    onNewTask: (columnId: string) => void;
}

const priorityConfig = {
    LOW: { label: 'Thấp', color: 'bg-gray-100 text-gray-700' },
    MEDIUM: { label: 'Trung bình', color: 'bg-blue-100 text-blue-700' },
    HIGH: { label: 'Cao', color: 'bg-amber-100 text-amber-700' },
    CRITICAL: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700' },
};

export function TaskListView({ columns, projectPrefix = 'TASK', onTaskClick, onNewTask }: TaskListViewProps) {
    const [expandedColumns, setExpandedColumns] = useState<Set<string>>(
        new Set(columns.map(c => c.id))
    );

    const toggleColumn = (columnId: string) => {
        setExpandedColumns(prev => {
            const next = new Set(prev);
            if (next.has(columnId)) {
                next.delete(columnId);
            } else {
                next.add(columnId);
            }
            return next;
        });
    };

    const getTaskId = (task: Task) => {
        return `${projectPrefix}-${task.taskNumber || '?'}`;
    };

    return (
        <div className="space-y-2">
            {columns.map((column) => {
                const isExpanded = expandedColumns.has(column.id);
                const tasks = column.tasks || [];

                return (
                    <div key={column.id} className="border rounded-xl overflow-hidden bg-card">
                        {/* Column Header */}
                        <button
                            onClick={() => toggleColumn(column.id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: column.color }}
                            />
                            <span className="font-medium">{column.name}</span>
                            <Badge variant="secondary" className="text-xs">
                                {tasks.length}
                            </Badge>
                        </button>

                        {/* Tasks List */}
                        {isExpanded && (
                            <div className="border-t">
                                {tasks.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        Không có nhiệm vụ nào
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                onClick={() => onTaskClick(task)}
                                                className="flex items-center gap-4 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                                            >
                                                {/* Task ID */}
                                                <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">
                                                    {getTaskId(task)}
                                                </span>

                                                {/* Title */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{task.title}</p>
                                                </div>

                                                {/* Status Badge */}
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0"
                                                    style={{
                                                        borderColor: column.color,
                                                        color: column.color,
                                                    }}
                                                >
                                                    {column.name}
                                                </Badge>

                                                {/* Priority */}
                                                <Badge
                                                    className={cn(
                                                        'shrink-0 text-xs',
                                                        priorityConfig[task.priority as keyof typeof priorityConfig]?.color
                                                    )}
                                                >
                                                    {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority}
                                                </Badge>

                                                {/* Due Date */}
                                                {task.dueDate && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(task.dueDate), 'dd/MM', { locale: vi })}
                                                    </div>
                                                )}

                                                {/* Comments Count */}
                                                {task._count?.comments > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {task._count.comments}
                                                    </div>
                                                )}

                                                {/* Attachments Count */}
                                                {task._count?.attachments > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                                        <Paperclip className="w-3 h-3" />
                                                        {task._count.attachments}
                                                    </div>
                                                )}

                                                {/* Assignees */}
                                                <div className="flex -space-x-2 shrink-0">
                                                    {task.assignees?.slice(0, 3).map((assignee) => (
                                                        <Avatar key={assignee.id} className="w-6 h-6 border-2 border-background">
                                                            <AvatarImage src={assignee.avatarUrl} />
                                                            <AvatarFallback className="text-[10px]">
                                                                {assignee.fullName?.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                    {(task.assignees?.length || 0) > 3 && (
                                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                                                            +{(task.assignees?.length || 0) - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Task Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNewTask(column.id);
                                    }}
                                    className="w-full flex items-center gap-2 p-3 text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors border-t"
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm nhiệm vụ mới
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
