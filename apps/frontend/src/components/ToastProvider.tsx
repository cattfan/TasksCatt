'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

/**
 * Toast Provider Component
 * Listens for app-toast events and displays notifications
 */
export default function ToastProvider() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        const handleToast = (event: CustomEvent<{ message: string; type: 'success' | 'error' | 'info' }>) => {
            const id = Math.random().toString(36).substr(2, 9);
            const toast: Toast = {
                id,
                message: event.detail.message,
                type: event.detail.type,
            };

            setToasts(prev => [...prev, toast]);

            // Auto remove after 5 seconds
            setTimeout(() => removeToast(id), 5000);
        };

        window.addEventListener('app-toast', handleToast as EventListener);
        return () => window.removeEventListener('app-toast', handleToast as EventListener);
    }, [removeToast]);

    const getToastStyles = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'info':
            default:
                return 'bg-gray-800 text-white';
        }
    };

    const getIcon = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5" />;
            case 'error':
                return <XCircle className="w-5 h-5" />;
            default:
                return <Info className="w-5 h-5" />;
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${getToastStyles(toast.type)}`}
                    role="alert"
                >
                    {getIcon(toast.type)}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-2 opacity-70 hover:opacity-100 transition cursor-pointer"
                        aria-label="Đóng"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

