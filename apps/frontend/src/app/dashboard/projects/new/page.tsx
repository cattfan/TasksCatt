'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect /dashboard/projects/new to /dashboard/projects?create=true
 * This prevents the [slug] dynamic route from catching 'new'
 */
export default function NewProjectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/projects?create=true');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Đang chuyển hướng...</div>
        </div>
    );
}
