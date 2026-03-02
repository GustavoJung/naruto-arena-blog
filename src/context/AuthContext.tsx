'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type UserRole = 'Admin' | 'User';

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>('User');
    const [loading, setLoading] = useState(true);

    const ADMIN_EMAIL = 'udesc.gustavo@gmail.com';

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // If email matches the fixed admin email, set role to Admin
                if (firebaseUser.email === ADMIN_EMAIL) {
                    setRole('Admin');
                } else {
                    // Otherwise try to get role from Firestore if user exists
                    try {
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                        if (userDoc.exists()) {
                            setRole(userDoc.data().role as UserRole);
                        } else {
                            setRole('User');
                        }
                    } catch (error) {
                        console.error("Error fetching user role:", error);
                        setRole('User');
                    }
                }
            } else {
                setRole('User');
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            role,
            loading,
            isAdmin: role === 'Admin' || user?.email === ADMIN_EMAIL
        }}>
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
