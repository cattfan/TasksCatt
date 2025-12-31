import api from '@/lib/api';

export interface User {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    isAdmin: boolean;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    fullName: string;
}

export const authService = {
    async login(dto: LoginDto): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/login', dto);
        return data;
    },

    async register(dto: RegisterDto): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/register', dto);
        return data;
    },

    async getProfile(): Promise<User> {
        const { data } = await api.get<User>('/auth/profile');
        return data;
    },

    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await api.post('/auth/change-password', { currentPassword, newPassword });
    },

    async forgotPassword(email: string): Promise<void> {
        await api.post('/auth/forgot-password', { email });
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
        await api.post('/auth/reset-password', { token, newPassword });
    },
};

export default authService;
