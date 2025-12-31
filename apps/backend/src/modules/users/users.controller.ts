import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    /**
     * GET /api/users
     * Lấy danh sách users
     */
    @Get()
    async findAll() {
        return this.usersService.findAll();
    }

    /**
     * GET /api/users/search?q=keyword
     * Tìm kiếm users
     */
    @Get('search')
    async search(@Query('q') query: string) {
        return this.usersService.search(query || '');
    }

    /**
     * GET /api/users/me
     * Lấy thông tin user hiện tại
     */
    @Get('me')
    async getMe(@Request() req: any) {
        return this.usersService.findById(req.user.id);
    }

    /**
     * GET /api/users/:id
     * Lấy thông tin user theo ID
     */
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    /**
     * PATCH /api/users/me
     * Cập nhật thông tin user hiện tại
     */
    @Patch('me')
    async updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
        return this.usersService.update(req.user.id, dto);
    }

    /**
     * DELETE /api/users/me
     * Xóa tài khoản (soft delete)
     */
    @Delete('me')
    async deleteMe(@Request() req: any) {
        await this.usersService.delete(req.user.id);
        return { message: 'Tài khoản đã được xóa' };
    }
}
