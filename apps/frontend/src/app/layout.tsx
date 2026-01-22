import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import ToastProvider from '@/components/ToastProvider';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
    title: 'TasksCatt - Quản lý Dự án & Task',
    description: 'Hệ thống quản lý dự án và task với Kanban board, real-time sync',
    keywords: ['task management', 'kanban', 'project management', 'jira', 'trello'],
    authors: [{ name: 'TasksCatt Team' }],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen antialiased`} suppressHydrationWarning>
                <ThemeProvider>
                    <LanguageProvider>
                        <AuthProvider>
                            <TooltipProvider>
                                <ErrorBoundary>
                                    {children}
                                </ErrorBoundary>
                            </TooltipProvider>
                            <Toaster position="top-right" />
                            <ToastProvider />
                        </AuthProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
