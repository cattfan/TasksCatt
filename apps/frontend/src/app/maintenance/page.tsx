'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Construction, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function MaintenancePage() {
    const router = useRouter();

    useEffect(() => {
        // Auto-check every 30 seconds if maintenance is over
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/system/status');
                const data = await res.json();
                if (!data.maintenance) {
                    router.push('/login');
                }
            } catch {
                // Ignore errors
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-amber-200 dark:border-amber-800 shadow-2xl">
                <CardContent className="pt-10 pb-8 px-8 text-center">
                    {/* Icon */}
                    <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <Construction className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Hệ thống đang bảo trì
                    </h1>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn.
                        Vui lòng quay lại sau ít phút.
                    </p>

                    {/* Status indicator */}
                    <div className="flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg py-3 px-4 mb-8">
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span>Đang kiểm tra trạng thái hệ thống...</span>
                    </div>

                    {/* Action */}
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => router.push('/login')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Thử đăng nhập lại
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
