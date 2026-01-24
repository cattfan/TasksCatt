import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ActivityLogService } from '../admin/activity-log.service';
import { SystemConfigService } from '../admin/system-config.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
    let authService: AuthService;
    let prismaService: PrismaService;
    let jwtService: JwtService;

    const mockPrismaService = {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    };

    const mockJwtService = {
        sign: vi.fn(() => 'mock-token'),
        signAsync: vi.fn(),
        verify: vi.fn(),
    };

    const mockActivityLogService = {
        log: vi.fn(),
    };

    const mockSystemConfigService = {
        getConfig: vi.fn().mockResolvedValue('true'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ActivityLogService, useValue: mockActivityLogService },
                { provide: SystemConfigService, useValue: mockSystemConfigService },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        prismaService = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);

        // Reset mocks
        vi.clearAllMocks();
    });

    describe('validateUser', () => {
        it('should return user if found', async () => {
            const mockUser = { id: '1', email: 'test@example.com' };
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await authService.validateUser('1');

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: '1', deletedAt: null },
            });
        });

        it('should return null if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await authService.validateUser('1');

            expect(result).toBeNull();
        });
    });

    describe('register', () => {
        it('should create a new user successfully', async () => {
            const registerDto = {
                email: 'new@example.com',
                password: 'Password123!',
                fullName: 'New User',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.user.create.mockResolvedValue({
                id: '1',
                ...registerDto,
                passwordHash: 'hashed',
                isActive: true,
                createdAt: new Date(),
                avatarUrl: 'http://avatar',
                isAdmin: false,
            });
            mockSystemConfigService.getConfig.mockResolvedValue('true');

            const result = await authService.register(registerDto);

            expect(result).toHaveProperty('accessToken');
            expect(mockPrismaService.user.create).toHaveBeenCalled();
        });

        it('should throw ConflictException if email already exists', async () => {
            const registerDto = {
                email: 'existing@example.com',
                password: 'Password123!',
                fullName: 'Existing User',
            };

            mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@example.com' });
            mockSystemConfigService.getConfig.mockResolvedValue('true');

            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should return tokens for valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('password123', 12);
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                passwordHash: hashedPassword,
                fullName: 'Test User',
                isActive: true,
                role: 'USER',
                isAdmin: false,
                isBlocked: false,
                deletedAt: null,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockSystemConfigService.getConfig.mockResolvedValue('false'); // maintenance mode off

            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(result).toHaveProperty('accessToken');
        });

        it('should throw UnauthorizedException for invalid credentials', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(
                authService.login({
                    email: 'wrong@example.com',
                    password: 'wrongpassword',
                }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});
