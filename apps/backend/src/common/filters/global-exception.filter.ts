import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Standard API Error Response Format
 */
interface ApiErrorResponse {
    status: number;
    code: string;
    message: string;
    details?: any[];
    path: string;
    timestamp: string;
    requestId?: string;
}

/**
 * Global Exception Filter
 * Provides consistent error response format across all endpoints
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'An unexpected error occurred';
        let details: any[] | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as any;
                message = resp.message || message;
                details = Array.isArray(resp.message) ? resp.message : undefined;
            }

            // Map HTTP status to error codes
            code = this.mapStatusToCode(status);
        } else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(`Unexpected error: ${exception.message}`, exception.stack);
        }

        const errorResponse: ApiErrorResponse = {
            status,
            code,
            message: Array.isArray(message) ? message[0] : message,
            details,
            path: request.url,
            timestamp: new Date().toISOString(),
            requestId: request.headers['x-request-id'] as string,
        };

        // Log error for monitoring
        if (status >= 500) {
            this.logger.error(`[${code}] ${message}`, exception instanceof Error ? exception.stack : '');
        } else {
            this.logger.warn(`[${code}] ${message}`);
        }

        response.status(status).json(errorResponse);
    }

    private mapStatusToCode(status: number): string {
        const statusCodeMap: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'VALIDATION_ERROR',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_ERROR',
            502: 'BAD_GATEWAY',
            503: 'SERVICE_UNAVAILABLE',
        };
        return statusCodeMap[status] || 'UNKNOWN_ERROR';
    }
}
