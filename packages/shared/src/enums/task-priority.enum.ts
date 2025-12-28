/**
 * Task Priority Enum
 * Defines the urgency level of a task
 */
export enum TaskPriority {
    /** Low priority - no rush */
    LOW = 'LOW',
    /** Medium priority - standard tasks */
    MEDIUM = 'MEDIUM',
    /** High priority - needs attention soon */
    HIGH = 'HIGH',
    /** Critical - urgent, blocking issues */
    CRITICAL = 'CRITICAL',
}

/**
 * Priority display configuration
 */
export const TaskPriorityConfig: Record<
    TaskPriority,
    { label: string; color: string; bgColor: string }
> = {
    [TaskPriority.LOW]: {
        label: 'Low',
        color: '#22C55E',
        bgColor: '#DCFCE7',
    },
    [TaskPriority.MEDIUM]: {
        label: 'Medium',
        color: '#EAB308',
        bgColor: '#FEF9C3',
    },
    [TaskPriority.HIGH]: {
        label: 'High',
        color: '#F97316',
        bgColor: '#FFEDD5',
    },
    [TaskPriority.CRITICAL]: {
        label: 'Critical',
        color: '#EF4444',
        bgColor: '#FEE2E2',
    },
};
