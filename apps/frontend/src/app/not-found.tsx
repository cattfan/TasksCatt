import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
            <Card className="border-0 shadow-lg max-w-md w-full">
                <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileQuestion className="w-10 h-10 text-muted-foreground" />
                    </div>

                    <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>

                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        Không tìm thấy trang
                    </h2>

                    <p className="text-muted-foreground mb-8">
                        Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" className="flex-1" asChild>
                            <Link href="javascript:history.back()">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Link>
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
    );
}
