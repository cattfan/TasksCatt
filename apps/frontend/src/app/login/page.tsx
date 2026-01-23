'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            toast.success('Đăng nhập thành công!');
            router.push('/dashboard');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Email hoặc mật khẩu không đúng';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                            <CheckCircle2 className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">TasksCatt</span>
                    </div>
                </div>

                {/* Card */}
                <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl text-center">Chào mừng trở lại</CardTitle>
                        <CardDescription className="text-center">
                            Đăng nhập để tiếp tục quản lý dự án
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="you@example.com"
                                        className="pl-10 h-11"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-foreground">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 h-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 font-medium"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang đăng nhập...
                                    </>
                                ) : (
                                    'Đăng nhập'
                                )}
                            </Button>
                        </form>



                        {/* Register Link */}
                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            Chưa có tài khoản?{' '}
                            <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                Đăng ký ngay
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
