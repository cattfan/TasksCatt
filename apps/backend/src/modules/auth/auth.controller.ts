import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto, ResetPasswordRequestDto, ResetPasswordDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('/api/auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @ApiOperation({ summary: 'POST /api/auth/register' })
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @ApiOperation({ summary: 'POST /api/auth/login' })
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @ApiOperation({ summary: 'POST /api/auth/forgot-password' })
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ResetPasswordRequestDto) {
        return this.authService.requestPasswordReset(dto);
    }

    @ApiOperation({ summary: 'POST /api/auth/reset-password' })
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @ApiOperation({ summary: 'GET /api/auth/profile' })
    @ApiBearerAuth()
    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    @ApiOperation({ summary: 'POST /api/auth/change-password' })
    @ApiBearerAuth()
    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.id, dto);
    }

    @ApiOperation({ summary: 'POST /api/auth/logout' })
    @ApiBearerAuth()
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout() {
        return { message: 'Đăng xuất thành công' };
    }
}
