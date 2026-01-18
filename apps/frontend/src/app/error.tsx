'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <Card className="border-0 shadow-lg max-w-md w-full">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>

                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Có lỗi xảy ra
                    </h1>

                    <p className="text-muted-foreground mb-6">
                        Không thể tải trang này. Vui lòng thử lại.
                    </p>

                    {error?.message && process.env.NODE_ENV === 'development' && (
                        <div className="bg-muted p-3 rounded-lg mb-6 text-left">
                            <p className="text-xs font-mono text-muted-foreground break-all">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Quay lại
                        </Button>
                        <Button className="flex-1" onClick={() => reset()}>
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Thử lại
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
