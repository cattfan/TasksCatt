import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(
        @InjectMetric('taskscatt_http_request_duration_seconds')
        private readonly httpDuration: Histogram<string>,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, path } = request;
        const startTime = Date.now();

        // Log incoming request
        this.logger.info(`Incoming request: ${method} ${url}`, {
            context: 'HTTP',
            method,
            url,
            path,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
        });

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse();
                    const statusCode = response.statusCode;
                    const duration = (Date.now() - startTime) / 1000;

                    // Record metrics
                    this.httpDuration.observe(
                        { method, route: path, status_code: statusCode.toString() },
                        duration,
                    );

                    // Log response
                    this.logger.info(`Request completed: ${method} ${url}`, {
                        context: 'HTTP',
                        method,
                        url,
                        statusCode,
                        duration: `${duration.toFixed(3)}s`,
                    });
                },
                error: (error) => {
                    const duration = (Date.now() - startTime) / 1000;
                    const statusCode = error.status || 500;

                    // Record metrics for errors too
                    this.httpDuration.observe(
                        { method, route: path, status_code: statusCode.toString() },
                        duration,
                    );

                    // Log error
                    this.logger.error(`Request failed: ${method} ${url}`, {
                        context: 'HTTP',
                        method,
                        url,
                        statusCode,
                        duration: `${duration.toFixed(3)}s`,
                        error: error.message,
                        stack: error.stack,
                    });
                },
            }),
        );
    }
}
