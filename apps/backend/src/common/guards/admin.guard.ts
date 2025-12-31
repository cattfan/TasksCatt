import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard to check if user is a system admin
 * Used for admin panel endpoints (UC34, UC35)
 */
@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Bạn cần đăng nhập');
        }

        // Fetch full user from database to check isAdmin
        const fullUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { isAdmin: true, isBlocked: true },
        });

        if (!fullUser) {
            throw new ForbiddenException('User không tồn tại');
        }

        if (fullUser.isBlocked) {
            throw new ForbiddenException('Tài khoản của bạn đã bị khóa');
        }

        if (!fullUser.isAdmin) {
            throw new ForbiddenException('Bạn cần quyền quản trị viên');
        }

        return true;
    }
}
