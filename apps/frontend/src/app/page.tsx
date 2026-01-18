import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    ArrowRight,
    Kanban,
    Users,
    Zap,
    BarChart3,
    MessageSquare,
    Shield,
    Star,
    Github,
    Twitter,
} from 'lucide-react';

const features = [
    {
        icon: Kanban,
        title: 'Bảng Kanban',
        description: 'Trực quan hóa workflow với bảng kanban kéo thả. Tùy chỉnh cột và sắp xếp công việc theo cách của bạn.',
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    {
        icon: Users,
        title: 'Làm việc nhóm',
        description: 'Mời thành viên, giao nhiệm vụ và cộng tác thời gian thực với cập nhật tức thì.',
        color: 'text-green-500',
        bg: 'bg-green-500/10',
    },
    {
        icon: Zap,
        title: 'Đồng bộ realtime',
        description: 'Thay đổi được đồng bộ ngay lập tức trên mọi thiết bị. Không bỏ lỡ cập nhật từ đội.',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
    },
    {
        icon: BarChart3,
        title: 'Theo dõi tiến độ',
        description: 'Theo dõi tiến độ với chỉ số trực quan, hạn chót và mức độ ưu tiên cho mọi công việc.',
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
    },
    {
        icon: MessageSquare,
        title: 'Bình luận & thảo luận',
        description: 'Trao đổi trực tiếp trên công việc với bình luận, đề cập và tệp đính kèm.',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
    },
    {
        icon: Shield,
        title: 'Bảo mật & riêng tư',
        description: 'Bảo mật cấp doanh nghiệp với phân quyền theo vai trò để giữ dữ liệu an toàn.',
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
    },
];

const stats = [
    { label: 'Người dùng', value: '10,000+' },
    { label: 'Dự án', value: '50,000+' },
    { label: 'Công việc hoàn thành', value: '1M+' },
    { label: 'Đánh giá', value: '4.9/5' },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 bg-background/80 backdrop-blur-lg border-b z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                            <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">TasksCatt</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                        >
                            Đăng nhập
                        </Link>
                        <Button asChild>
                            <Link href="/register">Bắt đầu miễn phí</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <Badge variant="secondary" className="mb-6 animate-pulse">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Phiên bản beta công khai
                    </Badge>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight">
                        Quản lý dự án
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                            dễ dàng hơn bao giờ
                        </span>
                    </h1>

                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Công cụ quản lý dự án mạnh mẽ với bảng Kanban, cộng tác thời gian thực,
                        và mọi thứ bạn cần để giữ nhóm luôn ngăn nắp.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="text-lg px-8 h-14" asChild>
                            <Link href="/register">
                                Bắt đầu miễn phí
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="text-lg px-8 h-14" asChild>
                            <Link href="#features">Tìm hiểu thêm</Link>
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4">Tính năng</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Mọi thứ bạn cần
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Tính năng mạnh mẽ giúp bạn quản lý dự án, theo dõi công việc và cộng tác với nhóm.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <Card
                                    key={feature.title}
                                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                >
                                    <CardContent className="p-6">
                                        <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon className={`w-6 h-6 ${feature.color}`} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-0 shadow-2xl bg-gradient-to-r from-primary to-purple-600 overflow-hidden">
                        <CardContent className="p-12 text-center relative">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                                    backgroundSize: '24px 24px'
                                }} />
                            </div>

                            <div className="relative">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                    Sẵn sàng bắt đầu?
                                </h2>
                                <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">
                                    Tham gia cùng hàng nghìn nhóm đang sử dụng TasksCatt để quản lý dự án.
                                </p>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="text-lg px-8 h-14 bg-white text-primary hover:bg-white/90"
                                    asChild
                                >
                                    <Link href="/register">
                                        Bắt đầu miễn phí
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-foreground">TasksCatt</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Github className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Twitter className="w-5 h-5" />
                            </Link>
                        </div>

                        <p className="text-muted-foreground text-sm">
                            © 2026 TasksCatt. Built with NestJS + Next.js
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
