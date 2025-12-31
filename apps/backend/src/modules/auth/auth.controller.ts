import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto, ResetPasswordRequestDto, ResetPasswordDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * POST /api/auth/register (UC1)
     */
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    /**
     * POST /api/auth/login (UC2)
     */
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    /**
     * POST /api/auth/forgot-password (UC3)
     */
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ResetPasswordRequestDto) {
        return this.authService.requestPasswordReset(dto);
    }

    /**
     * POST /api/auth/reset-password (UC3)
     */
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    /**
     * GET /api/auth/profile (UC5)
     */
    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    /**
     * POST /api/auth/change-password (UC7)
     */
    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.id, dto);
    }

    /**
     * POST /api/auth/logout (UC4)
     * Stateless JWT - client should just delete the token
     */
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout() {
        return { message: 'Đăng xuất thành công' };
    }
}
