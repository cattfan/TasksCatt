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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('/api/users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @ApiOperation({ summary: 'GET /api/users' })
    @Get()
    async findAll() {
        return this.usersService.findAll();
    }

    @ApiOperation({ summary: 'GET /api/users/search' })
    @Get('search')
    async search(@Query('q') query: string) {
        return this.usersService.search(query || '');
    }

    @ApiOperation({ summary: 'GET /api/users/me' })
    @Get('me')
    async getMe(@Request() req: any) {
        return this.usersService.findById(req.user.id);
    }

    @ApiOperation({ summary: 'GET /api/users/:id' })
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @ApiOperation({ summary: 'PATCH /api/users/me' })
    @Patch('me')
    async updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
        return this.usersService.update(req.user.id, dto);
    }

    @ApiOperation({ summary: 'DELETE /api/users/me' })
    @Delete('me')
    async deleteMe(@Request() req: any) {
        await this.usersService.delete(req.user.id);
        return { message: 'Tài khoản đã được xóa' };
    }
}
