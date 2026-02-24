'use client';

import { TeamProvider } from '@/context/TeamContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ToastProvider>
                <TeamProvider>{children}</TeamProvider>
            </ToastProvider>
        </AuthProvider>
    );
}
