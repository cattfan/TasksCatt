import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract project ID from request params or body
 */
export const ProjectId = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        // Try params first (e.g., /projects/:id)
        if (request.params?.id) return request.params.id;
        if (request.params?.projectId) return request.params.projectId;

        // Then try body
        if (request.body?.projectId) return request.body.projectId;

        return undefined;
    },
);

/**
 * Get current user from request (set by JwtAuthGuard)
 */
export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return data ? user?.[data] : user;
    },
);
