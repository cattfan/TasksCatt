'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { CheckCircle2, User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password strength calculation
    const getPasswordStrength = () => {
        if (!password) return { level: 0, text: '', color: '' };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 2) return { level: score, text: 'Yếu', color: 'bg-red-500' };
        if (score <= 3) return { level: score, text: 'Trung bình', color: 'bg-amber-500' };
        return { level: score, text: 'Mạnh', color: 'bg-green-500' };
    };

    const strength = getPasswordStrength();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (password.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }



        setIsLoading(true);

        try {
            await register(email, password, fullName);
            toast.success('Đăng ký thành công!');
            router.push('/dashboard');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Đăng ký thất bại';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 py-12">
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
                        <CardTitle className="text-2xl text-center">Tạo tài khoản</CardTitle>
                        <CardDescription className="text-center">
                            Bắt đầu quản lý dự án ngay hôm nay
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
                            {/* Full Name */}
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                                    Họ và tên
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        placeholder="Nguyễn Văn A"
                                        className="pl-10 h-11"
                                    />
                                </div>
                            </div>

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
                                        minLength={8}
                                        placeholder="Tối thiểu 8 ký tự"
                                        className="pl-10 pr-10 h-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {/* Password Strength Meter */}
                                {password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : 'bg-muted'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Độ mạnh mật khẩu: <span className="font-medium">{strength.text}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                    Xác nhận mật khẩu
                                </label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Nhập lại mật khẩu"
                                        className="pl-10 pr-10 h-11"
                                    />
                                    {confirmPassword && password === confirmPassword && (
                                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                    )}
                                </div>
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
                                        Đang tạo tài khoản...
                                    </>
                                ) : (
                                    'Tạo tài khoản'
                                )}
                            </Button>
                        </form>

                        {/* Login Link */}
                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            Đã có tài khoản?{' '}
                            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                Đăng nhập
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
