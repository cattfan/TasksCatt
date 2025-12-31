import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    /**
     * Lấy danh sách users (không bao gồm đã xóa)
     */
    async findAll() {
        return this.prisma.user.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Tìm user theo ID
     */
    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id, deletedAt: null },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        return user;
    }

    /**
     * Tìm user theo email
     */
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                createdAt: true,
            },
        });
    }

    /**
     * Cập nhật thông tin user
     */
    async update(id: string, dto: UpdateUserDto) {
        // Kiểm tra user tồn tại
        await this.findById(id);

        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    /**
     * Soft delete user
     */
    async delete(id: string) {
        await this.findById(id);

        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Tìm kiếm users theo tên hoặc email
     */
    async search(query: string) {
        return this.prisma.user.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { fullName: { contains: query } },
                    { email: { contains: query } },
                ],
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
            },
            take: 10,
        });
    }
}
