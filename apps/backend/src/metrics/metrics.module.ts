import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';

// Custom metrics providers
const taskCreatedCounter = makeCounterProvider({
    name: 'taskscatt_tasks_created_total',
    help: 'Total number of tasks created',
    labelNames: ['project_id'],
});

const taskCompletedCounter = makeCounterProvider({
    name: 'taskscatt_tasks_completed_total',
    help: 'Total number of tasks completed',
    labelNames: ['project_id'],
});

const httpRequestDuration = makeHistogramProvider({
    name: 'taskscatt_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

const activeWebsocketConnections = makeGaugeProvider({
    name: 'taskscatt_websocket_connections_active',
    help: 'Number of active WebSocket connections',
});

const databaseQueryDuration = makeHistogramProvider({
    name: 'taskscatt_database_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'model'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

const userRegistrationsCounter = makeCounterProvider({
    name: 'taskscatt_user_registrations_total',
    help: 'Total number of user registrations',
});

const loginAttemptsCounter = makeCounterProvider({
    name: 'taskscatt_login_attempts_total',
    help: 'Total number of login attempts',
    labelNames: ['status'],
});

@Module({
    imports: [
        PrometheusModule.register({
            path: '/metrics',
            defaultMetrics: {
                enabled: true,
                config: {
                    prefix: 'taskscatt_',
                },
            },
        }),
    ],
    providers: [
        taskCreatedCounter,
        taskCompletedCounter,
        httpRequestDuration,
        activeWebsocketConnections,
        databaseQueryDuration,
        userRegistrationsCounter,
        loginAttemptsCounter,
    ],
    exports: [
        taskCreatedCounter,
        taskCompletedCounter,
        httpRequestDuration,
        activeWebsocketConnections,
        databaseQueryDuration,
        userRegistrationsCounter,
        loginAttemptsCounter,
    ],
})
export class MetricsModule { }
