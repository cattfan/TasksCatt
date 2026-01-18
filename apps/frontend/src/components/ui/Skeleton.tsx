/**
 * Reusable skeleton components for loading states
 */

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
    );
}

export function TaskCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-4/5 mb-3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4" />
            <div className="flex items-center justify-between">
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded-full" />
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full" />
            </div>
        </div>
    );
}

export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse`} />
    );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600" />
            <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
            </div>
        </div>
    );
}
