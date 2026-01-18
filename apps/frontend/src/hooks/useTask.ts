/**
 * Task custom hooks
 * Separates business logic from UI components
 */

import { useState, useCallback, useEffect } from 'react';
import { taskService, Task } from '@/lib/services/project.service';
import { commentService, Comment } from '@/lib/services/comment.service';

interface UseTaskFormData {
    title: string;
    description: string;
    priority: Task['priority'];
    assigneeIds: string[];
    dueDate: string;
}

/**
 * Hook for managing task form state
 */
export function useTaskForm(task: Task) {
    const [formData, setFormData] = useState<UseTaskFormData>({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assigneeIds: task.assignees?.map(a => a.id) || [],
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });

    const updateField = useCallback(<K extends keyof UseTaskFormData>(
        field: K,
        value: UseTaskFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            assigneeIds: task.assignees?.map(a => a.id) || [],
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        });
    }, [task]);

    return { formData, updateField, resetForm };
}

/**
 * Hook for task CRUD operations
 */
export function useTaskOperations(taskId: string, onSuccess?: () => void) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const updateTask = useCallback(async (data: {
        title?: string;
        description?: string;
        priority?: Task['priority'];
        assigneeIds?: string[];
        dueDate?: string;
    }) => {
        setIsSaving(true);
        try {
            await taskService.update(taskId, data);
            onSuccess?.();
            return true;
        } catch (error) {
            console.error('Failed to update task:', error);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [taskId, onSuccess]);

    const deleteTask = useCallback(async () => {
        if (!confirm('Bạn có chắc muốn xóa task này?')) return false;

        setIsDeleting(true);
        try {
            await taskService.delete(taskId);
            onSuccess?.();
            return true;
        } catch (error) {
            console.error('Failed to delete task:', error);
            return false;
        } finally {
            setIsDeleting(false);
        }
    }, [taskId, onSuccess]);

    return { updateTask, deleteTask, isSaving, isDeleting };
}

/**
 * Hook for managing task comments
 */
export function useTaskComments(taskId: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await commentService.getByTask(taskId);
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [taskId]);

    const addComment = useCallback(async (content: string) => {
        await commentService.create({ taskId, content });
        await loadComments();
    }, [taskId, loadComments]);

    const deleteComment = useCallback(async (commentId: string) => {
        await commentService.delete(commentId);
        await loadComments();
    }, [loadComments]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    return { comments, isLoading, addComment, deleteComment, refresh: loadComments };
}
