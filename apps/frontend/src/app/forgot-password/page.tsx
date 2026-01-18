'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.forgotPassword(email);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu');
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Kiểm tra email</h1>
                            <p className="text-muted-foreground mb-6">
                                Chúng tôi đã gửi link đặt lại mật khẩu đến<br />
                                <span className="font-medium text-foreground">{email}</span>
                            </p>
                            <p className="text-sm text-muted-foreground mb-6">
                                Không nhận được email? Kiểm tra thư mục spam hoặc thử lại.
                            </p>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/login">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Quay lại Đăng nhập
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
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
                        <CardTitle className="text-2xl">Quên mật khẩu?</CardTitle>
                        <CardDescription>
                            Đừng lo, chúng tôi sẽ gửi hướng dẫn đặt lại.
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
                                <label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Địa chỉ email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10"
                                        placeholder="Nhập email của bạn"
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Đang gửi...
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
                                Quay lại Đăng nhập
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
