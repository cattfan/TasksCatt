'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '@/lib/services/auth.service';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Only run on client side after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Check if user is logged in on mount
    useEffect(() => {
        if (!mounted) return;

        const initAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    try {
                        const userData = await authService.getProfile();
                        setUser(userData);
                    } catch {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('user');
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [mounted]);

    const login = async (email: string, password: string) => {
        const response = await authService.login({ email, password });
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
    };

    const register = async (email: string, password: string, fullName: string) => {
        const response = await authService.register({ email, password, fullName });
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch {
            // Ignore errors on logout
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const refreshUser = async () => {
        try {
            const userData = await authService.getProfile();
            setUser(userData);
        } catch {
            await logout();
        }
    };

    // Show loading until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <AuthContext.Provider
                value={{
                    user: null,
                    isLoading: true,
                    isAuthenticated: false,
                    login,
                    register,
                    logout,
                    refreshUser,
                }}
            >
                {children}
            </AuthContext.Provider>
        );
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
