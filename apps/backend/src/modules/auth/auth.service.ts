import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto, ChangePasswordDto, ResetPasswordRequestDto, ResetPasswordDto } from './dto';
import { ActivityLogService } from '../admin/activity-log.service';
import { SystemConfigService } from '../admin/system-config.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private activityLogService: ActivityLogService,
        private systemConfigService: SystemConfigService,
    ) { }

    /**
     * Đăng ký tài khoản mới (UC1)
     */
    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        // Check if registration is allowed
        const allowRegistration = await this.systemConfigService.getConfig('ALLOW_REGISTRATION', 'true');
        if (allowRegistration === 'false') {
            throw new ForbiddenException('Đăng ký tài khoản mới đang tạm thời bị vô hiệu hóa.');
        }

        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email đã được sử dụng');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                fullName: dto.fullName,
                avatarUrl: `https://api.dicebear.com/9.x/big-ears/svg?seed=${dto.email}`,
            },
        });

        const accessToken = this.generateToken(user.id, user.email);

        // Log user registration
        await this.activityLogService.log({
            userId: user.id,
            action: 'USER_REGISTERED',
            targetType: 'User',
            targetId: user.id,
            details: { email: user.email, fullName: user.fullName },
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
                isAdmin: user.isAdmin,
                emailNotifications: user.emailNotifications,
                taskUpdateNotifications: user.taskUpdateNotifications,
                commentReplyNotifications: user.commentReplyNotifications,
                projectInviteNotifications: user.projectInviteNotifications,
            },
        };
    }

    /**
     * Đăng nhập (UC2)
     */
    async login(dto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        if (user.deletedAt) {
            throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
        }

        if (user.isBlocked) {
            throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
        }

        // Check maintenance mode - only allow admin to login
        const maintenanceMode = await this.systemConfigService.getConfig('MAINTENANCE_MODE', 'false');
        if (maintenanceMode === 'true' && !user.isAdmin) {
            throw new ForbiddenException('Hệ thống đang bảo trì. Vui lòng quay lại sau.');
        }

        const accessToken = this.generateToken(user.id, user.email);

        // Log user login
        await this.activityLogService.log({
            userId: user.id,
            action: 'USER_LOGIN',
            targetType: 'User',
            targetId: user.id,
            details: { email: user.email },
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
                isAdmin: user.isAdmin,
                emailNotifications: user.emailNotifications,
                taskUpdateNotifications: user.taskUpdateNotifications,
                commentReplyNotifications: user.commentReplyNotifications,
                projectInviteNotifications: user.projectInviteNotifications,
            },
        };
    }

    /**
     * Lấy thông tin profile (UC5)
     */
    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                isAdmin: true,
                createdAt: true,
                emailNotifications: true,
                taskUpdateNotifications: true,
                commentReplyNotifications: true,
                projectInviteNotifications: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User không tồn tại');
        }

        return user;
    }

    /**
     * Đổi mật khẩu (UC7)
     */
    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('User không tồn tại');
        }

        const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);

        if (!isCurrentPasswordValid) {
            throw new BadRequestException('Mật khẩu hiện tại không đúng');
        }

        const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });

        return { message: 'Đổi mật khẩu thành công' };
    }

    /**
     * Yêu cầu reset password (UC3) - Mock version
     */
    async requestPasswordReset(dto: ResetPasswordRequestDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            console.log(`[Mock] Reset password requested for non-existent email: ${dto.email}`);
            return { message: 'Nếu email tồn tại, bạn sẽ nhận được link reset password' };
        }

        // Generate mock token (in production, this would be sent via email)
        const token = this.jwtService.sign(
            { sub: user.id, type: 'reset' },
            { expiresIn: '1h' },
        );

        console.log(`[Mock] Password reset token for ${dto.email}: ${token}`);

        return { message: 'Nếu email tồn tại, bạn sẽ nhận được link reset password' };
    }

    /**
     * Reset password với token (UC3)
     */
    async resetPassword(dto: ResetPasswordDto) {
        try {
            const payload = this.jwtService.verify(dto.token);

            if (payload.type !== 'reset') {
                throw new BadRequestException('Token không hợp lệ');
            }

            const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

            await this.prisma.user.update({
                where: { id: payload.sub },
                data: { passwordHash: newPasswordHash },
            });

            return { message: 'Đặt lại mật khẩu thành công' };
        } catch {
            throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
        }
    }

    /**
     * Validate user từ JWT payload
     */
    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
        });

        return user;
    }

    /**
     * Tạo JWT token
     */
    private generateToken(userId: string, email: string): string {
        const payload = { sub: userId, email };
        return this.jwtService.sign(payload);
    }
}
