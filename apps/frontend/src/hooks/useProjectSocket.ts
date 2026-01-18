'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

interface ProjectSocketEvents {
    task_created: { task: Record<string, unknown>; createdBy: { id: string; fullName: string } };
    task_updated: { task: Record<string, unknown>; updatedBy: { id: string; fullName: string } };
    task_deleted: { taskId: string; deletedBy: { id: string; fullName: string } };
    task_moved: { taskId: string; fromColumnId: string; toColumnId: string; movedBy: { id: string; fullName: string } };
    column_created: { column: Record<string, unknown> };
    column_deleted: { columnId: string };
    member_added: { member: Record<string, unknown> };
    member_removed: { userId: string };
}

/**
 * Hook for subscribing to project-specific realtime events
 * @param projectId - Project ID to subscribe to
 * @param onProjectChange - Callback when any project data changes (trigger reload)
 */
export function useProjectSocket(
    projectId: string | undefined,
    onProjectChange: () => void
) {
    const { getSocket } = useSocket();

    const handleEvent = useCallback((eventName: string, data: unknown) => {
        console.log(`[ProjectSocket] ${eventName}:`, data);
        // Trigger project reload on any change
        onProjectChange();
    }, [onProjectChange]);

    useEffect(() => {
        if (!projectId) return;

        const socket = getSocket();
        if (!socket) return;

        // Join project room
        socket.emit('join_project', { projectId });
        console.log(`[ProjectSocket] Joined project:${projectId}`);

        // Subscribe to all task events
        const events: (keyof ProjectSocketEvents)[] = [
            'task_created',
            'task_updated',
            'task_deleted',
            'task_moved',
            'column_created',
            'column_deleted',
            'member_added',
            'member_removed',
        ];

        events.forEach(event => {
            socket.on(event, (data) => handleEvent(event, data));
        });

        // Cleanup
        return () => {
            events.forEach(event => {
                socket.off(event);
            });
            socket.emit('leave_project', { projectId });
            console.log(`[ProjectSocket] Left project:${projectId}`);
        };
    }, [projectId, getSocket, handleEvent]);
}
