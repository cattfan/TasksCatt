'use client';

import { Suspense, ReactNode } from 'react';

interface SuspenseBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Default loading fallback
 */
function DefaultFallback() {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</span>
            </div>
        </div>
    );
}

/**
 * Suspense Boundary wrapper component
 * Provides consistent loading state for async components
 */
export default function SuspenseBoundary({ children, fallback }: SuspenseBoundaryProps) {
    return (
        <Suspense fallback={fallback || <DefaultFallback />}>
            {children}
        </Suspense>
    );
}

/**
 * Full page loading state
 */
export function PageLoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600 dark:text-gray-400">Đang tải trang...</span>
            </div>
        </div>
    );
}

/**
 * Card loading state
 */
export function CardLoadingFallback() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
    );
}
