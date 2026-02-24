'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'Admin' | 'User';

interface AuthContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<UserRole>('User');

    // Load initial role from localStorage if available
    useEffect(() => {
        const savedRole = localStorage.getItem('naruto-blog-role') as UserRole;
        if (savedRole) {
            setRole(savedRole);
        }
    }, []);

    const handleSetRole = (newRole: UserRole) => {
        setRole(newRole);
        localStorage.setItem('naruto-blog-role', newRole);
    };

    return (
        <AuthContext.Provider value={{ role, setRole: handleSetRole, isAdmin: role === 'Admin' }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
