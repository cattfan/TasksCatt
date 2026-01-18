'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

/**
 * Custom hook for Socket.io connection
 * Handles authentication, connection lifecycle, and reconnection
 */
export function useSocket() {
    const socketRef = useRef<Socket | null>(null);

    const getSocket = useCallback(() => {
        if (socketRef.current?.connected) {
            return socketRef.current;
        }

        // Get token from localStorage
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('accessToken')
            : null;

        if (!token) {
            console.warn('[Socket] No auth token found');
            return null;
        }

        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socketRef.current.on('connect', () => {
                console.log('[Socket] Connected:', socketRef.current?.id);
            });

            socketRef.current.on('disconnect', (reason) => {
                console.log('[Socket] Disconnected:', reason);
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('[Socket] Connection error:', error.message);
            });
        }

        return socketRef.current;
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, []);

    useEffect(() => {
        // Connect on mount
        getSocket();

        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, [getSocket, disconnect]);

    return { getSocket, disconnect };
}
