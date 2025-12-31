import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-50 bg-grid-pattern">
            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-900">TasksCatt</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition">
                            Sign in
                        </Link>
                        <Link href="/register" className="btn-primary">
                            Get started free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium mb-6">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        Now in public beta
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Manage your projects
                        <br />
                        <span className="text-indigo-500">with ease</span>
                    </h1>

                    <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
                        A powerful project management tool with Kanban boards, real-time collaboration,
                        and everything you need to keep your team organized.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register" className="btn-primary text-lg px-8 py-4">
                            Start for free
                        </Link>
                        <Link href="#features" className="btn-secondary text-lg px-8 py-4">
                            Learn more
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">
                            Powerful features to help you manage projects, track tasks, and collaborate with your team.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                                title: 'Kanban Boards',
                                description: 'Visualize your workflow with drag-and-drop kanban boards. Customize columns and organize tasks your way.',
                                color: 'bg-indigo-500'
                            },
                            {
                                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                                title: 'Team Collaboration',
                                description: 'Invite team members, assign tasks, and work together in real-time with instant updates.',
                                color: 'bg-green-500'
                            },
                            {
                                icon: 'M13 10V3L4 14h7v7l9-11h-7z',
                                title: 'Real-time Sync',
                                description: 'Changes sync instantly across all devices. Never miss an update from your team.',
                                color: 'bg-amber-500'
                            },
                            {
                                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                                title: 'Progress Tracking',
                                description: 'Track progress with visual indicators, due dates, and priority levels for every task.',
                                color: 'bg-pink-500'
                            },
                            {
                                icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                                title: 'Comments & Discussion',
                                description: 'Communicate directly on tasks with comments, mentions, and file attachments.',
                                color: 'bg-blue-500'
                            },
                            {
                                icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
                                title: 'Secure & Private',
                                description: 'Enterprise-grade security with role-based permissions to keep your data safe.',
                                color: 'bg-purple-500'
                            },
                        ].map((feature) => (
                            <div key={feature.title} className="card p-6 card-hover">
                                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-500 text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="card p-12 text-center bg-gradient-to-r from-indigo-500 to-purple-600 border-none">
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
                        <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
                            Join thousands of teams who are already using TasksCatt to manage their projects.
                        </p>
                        <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition">
                            Get started for free
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="font-bold text-gray-900">TasksCatt</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © 2024 TasksCatt. Built with NestJS + Next.js
                    </p>
                </div>
            </footer>
        </div>
    );
}
