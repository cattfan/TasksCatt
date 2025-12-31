import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userEmail?: string;
}

/**
 * WebSocket Gateway cho real-time notifications (UC32)
 * 
 * Events:
 * - join_project: User joins a project room
 * - leave_project: User leaves a project room
 * 
 * Server Events (broadcast):
 * - task_created, task_updated, task_moved, task_deleted
 * - comment_added
 * - member_added, member_removed
 * - column_created, column_updated, column_deleted, columns_reordered
 */
@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/',
})
export class EventsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private logger = new Logger('EventsGateway');
    private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    afterInit() {
        this.logger.log('🔌 WebSocket Gateway initialized');
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            // Extract token from handshake
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without auth token`);
                client.disconnect();
                return;
            }

            // Verify JWT
            const payload = this.jwtService.verify(token);
            const userId = payload.sub as string;
            const userEmail = payload.email as string;
            client.userId = userId;
            client.userEmail = userEmail;

            // Track connected user
            if (!this.connectedUsers.has(client.userId)) {
                this.connectedUsers.set(client.userId, new Set());
            }
            const userSockets = this.connectedUsers.get(client.userId);
            if (userSockets) {
                userSockets.add(client.id);
            }

            this.logger.log(`✅ User ${client.userEmail} connected (${client.id})`);

            // Auto-join user to their project rooms
            await this.autoJoinProjects(client);

        } catch (error) {
            this.logger.warn(`Client ${client.id} auth failed: ${error}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        if (client.userId) {
            const userSockets = this.connectedUsers.get(client.userId);
            if (userSockets) {
                userSockets.delete(client.id);
                if (userSockets.size === 0) {
                    this.connectedUsers.delete(client.userId);
                }
            }
            this.logger.log(`❌ User ${client.userEmail} disconnected (${client.id})`);
        }
    }

    /**
     * Auto-join user to all their project rooms
     */
    private async autoJoinProjects(client: AuthenticatedSocket) {
        if (!client.userId) return;

        const memberships = await this.prisma.projectMember.findMany({
            where: { userId: client.userId },
            select: { projectId: true },
        });

        for (const { projectId } of memberships) {
            client.join(`project:${projectId}`);
        }

        this.logger.log(`User ${client.userEmail} joined ${memberships.length} project rooms`);
    }

    /**
     * Client manually joins a project room
     */
    @SubscribeMessage('join_project')
    handleJoinProject(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { projectId: string },
    ) {
        client.join(`project:${data.projectId}`);
        this.logger.log(`User ${client.userEmail} joined project:${data.projectId}`);
        return { success: true };
    }

    /**
     * Client leaves a project room
     */
    @SubscribeMessage('leave_project')
    handleLeaveProject(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { projectId: string },
    ) {
        client.leave(`project:${data.projectId}`);
        this.logger.log(`User ${client.userEmail} left project:${data.projectId}`);
        return { success: true };
    }

    // ==================================================
    // Server-side methods to broadcast events
    // ==================================================

    /**
     * Broadcast to all members of a project
     */
    broadcastToProject(projectId: string, event: string, data: Record<string, unknown>) {
        this.server.to(`project:${projectId}`).emit(event, {
            ...data,
            projectId,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast task created event
     */
    emitTaskCreated(projectId: string, task: Record<string, unknown>, createdBy: { id: string; fullName: string }) {
        this.broadcastToProject(projectId, 'task_created', { task, createdBy });
    }

    /**
     * Broadcast task updated event
     */
    emitTaskUpdated(projectId: string, task: Record<string, unknown>, updatedBy: { id: string; fullName: string }) {
        this.broadcastToProject(projectId, 'task_updated', { task, updatedBy });
    }

    /**
     * Broadcast task moved event (drag & drop)
     */
    emitTaskMoved(
        projectId: string,
        taskId: string,
        fromColumnId: string,
        toColumnId: string,
        newPosition: number,
        movedBy: { id: string; fullName: string },
    ) {
        this.broadcastToProject(projectId, 'task_moved', {
            taskId,
            fromColumnId,
            toColumnId,
            newPosition,
            movedBy,
        });
    }

    /**
     * Broadcast task deleted event
     */
    emitTaskDeleted(projectId: string, taskId: string, deletedBy: { id: string; fullName: string }) {
        this.broadcastToProject(projectId, 'task_deleted', { taskId, deletedBy });
    }

    /**
     * Broadcast comment added event
     */
    emitCommentAdded(projectId: string, comment: Record<string, unknown>, taskId: string) {
        this.broadcastToProject(projectId, 'comment_added', { comment, taskId });
    }

    /**
     * Broadcast member events
     */
    emitMemberAdded(projectId: string, member: Record<string, unknown>) {
        this.broadcastToProject(projectId, 'member_added', { member });
    }

    emitMemberRemoved(projectId: string, userId: string, removedBy: { id: string; fullName: string }) {
        this.broadcastToProject(projectId, 'member_removed', { userId, removedBy });
    }

    /**
     * Broadcast column events
     */
    emitColumnCreated(projectId: string, column: Record<string, unknown>) {
        this.broadcastToProject(projectId, 'column_created', { column });
    }

    emitColumnUpdated(projectId: string, column: Record<string, unknown>) {
        this.broadcastToProject(projectId, 'column_updated', { column });
    }

    emitColumnDeleted(projectId: string, columnId: string) {
        this.broadcastToProject(projectId, 'column_deleted', { columnId });
    }

    emitColumnsReordered(projectId: string, columnIds: string[]) {
        this.broadcastToProject(projectId, 'columns_reordered', { columnIds });
    }

    /**
     * Send notification to specific user
     */
    notifyUser(userId: string, event: string, data: Record<string, unknown>) {
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
            for (const socketId of userSockets) {
                this.server.to(socketId).emit(event, {
                    ...data,
                    timestamp: new Date().toISOString(),
                });
            }
        }
    }

    /**
     * Get online status of users
     */
    isUserOnline(userId: string): boolean {
        return this.connectedUsers.has(userId);
    }

    getOnlineUsersInProject(projectId: string): string[] {
        const room = this.server.sockets.adapter.rooms.get(`project:${projectId}`);
        if (!room) return [];

        const onlineUserIds: string[] = [];
        for (const socketId of room) {
            const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
            if (socket?.userId && !onlineUserIds.includes(socket.userId)) {
                onlineUserIds.push(socket.userId);
            }
        }
        return onlineUserIds;
    }
}
