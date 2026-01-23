import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
        signAsync: vi.fn(),
        verifyAsync: vi.fn(),
    };

    const mockConfigService = {
        get: vi.fn((key: string) => {
            const config: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRES_IN: '1h',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_REFRESH_EXPIRES_IN: '7d',
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        prismaService = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);

        // Reset mocks
        vi.clearAllMocks();
    });

    describe('validateUser', () => {
        it('should return user if credentials are valid', async () => {
            const hashedPassword = await bcrypt.hash('password123', 12);
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: hashedPassword,
                fullName: 'Test User',
                isActive: true,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await authService.validateUser('test@example.com', 'password123');

            expect(result).toBeDefined();
            expect(result.email).toBe('test@example.com');
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
        });

        it('should return null if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await authService.validateUser('notfound@example.com', 'password');

            expect(result).toBeNull();
        });

        it('should return null if password is incorrect', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 12);
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: true,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await authService.validateUser('test@example.com', 'wrongpassword');

            expect(result).toBeNull();
        });

        it('should return null if user is inactive', async () => {
            const hashedPassword = await bcrypt.hash('password123', 12);
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: false,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await authService.validateUser('test@example.com', 'password123');

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

            mockPrismaService.user.findFirst.mockResolvedValue(null);
            mockPrismaService.user.create.mockResolvedValue({
                id: '1',
                ...registerDto,
                password: 'hashed',
                isActive: true,
                createdAt: new Date(),
            });
            mockJwtService.signAsync.mockResolvedValue('mock-token');

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

            mockPrismaService.user.findFirst.mockResolvedValue({ id: '1', email: 'existing@example.com' });

            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should return tokens for valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('password123', 12);
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: hashedPassword,
                fullName: 'Test User',
                isActive: true,
                role: 'USER',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockJwtService.signAsync.mockResolvedValue('mock-token');

            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
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

    describe('Password hashing', () => {
        it('should hash password correctly', async () => {
            const password = 'Test123!';
            const hash = await bcrypt.hash(password, 12);

            expect(await bcrypt.compare(password, hash)).toBe(true);
            expect(await bcrypt.compare('wrongpassword', hash)).toBe(false);
        });

        it('should generate different hashes for same password', async () => {
            const password = 'Test123!';
            const hash1 = await bcrypt.hash(password, 12);
            const hash2 = await bcrypt.hash(password, 12);

            expect(hash1).not.toBe(hash2);
            expect(await bcrypt.compare(password, hash1)).toBe(true);
            expect(await bcrypt.compare(password, hash2)).toBe(true);
        });
    });
});
