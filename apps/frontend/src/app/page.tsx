import { CheckCircle2, Kanban, Users, Zap } from 'lucide-react';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    {/* Header */}
                    <nav className="flex items-center justify-between mb-16">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Kanban className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">TasksCatt</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <a
                                href="/login"
                                className="text-slate-300 hover:text-white transition-colors"
                            >
                                Đăng nhập
                            </a>
                            <a
                                href="/register"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Bắt đầu miễn phí
                            </a>
                        </div>
                    </nav>

                    {/* Hero Content */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            Quản lý dự án
                            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                {' '}hiện đại{' '}
                            </span>
                            và hiệu quả
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
                            TasksCatt giúp team của bạn tổ chức công việc với Kanban board trực quan,
                            cập nhật real-time và giao diện thân thiện.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <a
                                href="/register"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
                            >
                                Tạo tài khoản miễn phí
                            </a>
                            <a
                                href="#features"
                                className="border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 px-8 py-3 rounded-lg font-medium transition-colors"
                            >
                                Tìm hiểu thêm
                            </a>
                        </div>
                    </div>

                    {/* Preview Image Placeholder */}
                    <div className="relative mx-auto max-w-5xl">
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl">
                            <div className="bg-slate-900 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                                <div className="text-center">
                                    <Kanban className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-500 text-lg">
                                        Kanban Board Preview
                                    </p>
                                    <p className="text-slate-600 text-sm mt-2">
                                        (Sẽ được thêm ở Giai đoạn 4)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Tính năng nổi bật
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Mọi thứ bạn cần để quản lý dự án hiệu quả
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Kanban,
                                title: 'Kanban Board',
                                description: 'Kéo thả task giữa các cột một cách trực quan',
                            },
                            {
                                icon: Zap,
                                title: 'Real-time Sync',
                                description: 'Cập nhật tức thì khi team thay đổi task',
                            },
                            {
                                icon: Users,
                                title: 'Collaboration',
                                description: 'Mời thành viên và phân quyền linh hoạt',
                            },
                            {
                                icon: CheckCircle2,
                                title: 'Task Tracking',
                                description: 'Theo dõi tiến độ với priority và deadline',
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Kanban className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-white">TasksCatt</span>
                        </div>
                        <p className="text-slate-500 text-sm">
                            © 2024 TasksCatt. Đồ án Công nghệ Phần mềm.
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
