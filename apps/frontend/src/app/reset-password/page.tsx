'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Lock,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu không khớp');
            return;
        }

        if (password.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        if (!token) {
            setError('Token không hợp lệ');
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword(token, password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="border-0 shadow-lg max-w-md">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground mb-2">Link không hợp lệ</h1>
                    <p className="text-muted-foreground mb-6">
                        Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                    </p>
                    <Button asChild>
                        <Link href="/forgot-password">Yêu cầu link mới</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="border-0 shadow-lg max-w-md">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground mb-2">Đặt lại mật khẩu thành công!</h1>
                    <p className="text-muted-foreground mb-6">
                        Bạn có thể đăng nhập với mật khẩu mới.
                    </p>
                    <Button asChild>
                        <Link href="/login">Đăng nhập</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                        <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">TasksCatt</span>
                </Link>
            </div>

            {/* Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">Đặt mật khẩu mới</CardTitle>
                    <CardDescription>
                        Nhập mật khẩu mới cho tài khoản của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">
                                Mật khẩu mới
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="pl-10"
                                    placeholder="Tối thiểu 8 ký tự"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="pl-10"
                                    placeholder="Nhập lại mật khẩu"
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Đặt lại mật khẩu'
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại đăng nhập
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
