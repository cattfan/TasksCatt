'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child component tree and displays fallback UI
 */
export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // TODO: Send to Sentry
        // Sentry.captureException(error, { contexts: { react: errorInfo } });

        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 space-y-6 border">
                        {/* Icon */}
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Đã xảy ra lỗi
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
                            </p>
                        </div>

                        {/* Error details (development only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="bg-gray-50 rounded-lg p-4 text-sm">
                                <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                                    Chi tiết lỗi (Dev only)
                                </summary>
                                <div className="mt-3 space-y-2">
                                    <p className="text-red-600 font-mono text-xs">
                                        {this.state.error.message}
                                    </p>
                                    {this.state.error.stack && (
                                        <pre className="text-xs text-gray-600 overflow-auto max-h-32 bg-white p-2 rounded border">
                                            {this.state.error.stack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Thử lại
                            </button>
                            <Link
                                href="/dashboard"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

