'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to monitoring service
        console.error('Global error:', error);
    }, [error]);

    return (
        <html lang="vi">
            <body>
                <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
                    <Card className="border-0 shadow-lg max-w-md w-full">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            </div>

                            <h1 className="text-2xl font-bold text-foreground mb-2">
                                Đã xảy ra lỗi
                            </h1>

                            <p className="text-muted-foreground mb-6">
                                Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại hoặc quay về trang chủ.
                            </p>

                            {error?.digest && (
                                <p className="text-xs text-muted-foreground mb-6 font-mono">
                                    Mã lỗi: {error.digest}
                                </p>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => reset()}
                                >
                                    <RefreshCcw className="w-4 h-4 mr-2" />
                                    Thử lại
                                </Button>
                                <Button className="flex-1" asChild>
                                    <Link href="/">
                                        <Home className="w-4 h-4 mr-2" />
                                        Trang chủ
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </body>
        </html>
    );
}
