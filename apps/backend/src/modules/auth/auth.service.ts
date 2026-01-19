import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto, ChangePasswordDto, ResetPasswordRequestDto, ResetPasswordDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * Đăng ký tài khoản mới (UC1)
     */
    async register(dto: RegisterDto): Promise<AuthResponseDto> {
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
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dto.email}`,
            },
        });

        const accessToken = this.generateToken(user.id, user.email);

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

        const accessToken = this.generateToken(user.id, user.email);

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
