/**
 * Login Page Loading State
 */
export default function LoginLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 animate-pulse">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                    {/* Logo Skeleton */}
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    </div>

                    {/* Title Skeleton */}
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-8" />

                    {/* Form Fields Skeleton */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        </div>
                        <div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        </div>
                    </div>

                    {/* Button Skeleton */}
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mx-auto" />
                </div>
            </div>
        </div>
    );
}
