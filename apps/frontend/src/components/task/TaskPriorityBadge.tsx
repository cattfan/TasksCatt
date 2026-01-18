'use client';

import { memo } from 'react';

interface TaskPriorityBadgeProps {
    priority: string;
}

const priorityConfig: Record<string, { class: string; label: string }> = {
    LOW: { class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Thấp' },
    MEDIUM: { class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Trung bình' },
    HIGH: { class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Cao' },
    CRITICAL: { class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Khẩn cấp' },
};

function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
    const config = priorityConfig[priority] || priorityConfig.MEDIUM;
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.class}`}>
            {config.label}
        </span>
    );
}

export default memo(TaskPriorityBadge);
