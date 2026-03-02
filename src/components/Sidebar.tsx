'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Trophy, Shield, Settings, Home, Swords, ScrollText, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTeams } from '@/context/TeamContext';
import styles from './Sidebar.module.css';

const MENU_ITEMS = [
    { name: 'Início', path: '/home', icon: Home },
    { name: 'Times', path: '/teams', icon: LayoutDashboard },
    { name: 'Personagens', path: '/characters', icon: Users },
    { name: 'Missões', path: '/missions', icon: ScrollText },
    { name: 'Jogue agora', path: 'https://www.naruto-arena.site/', icon: Swords }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, role, isAdmin, loading } = useAuth();
    const { clearTeams } = useTeams();

    const handleLogin = async () => {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const handleLogout = async () => {
        const { auth } = await import('@/lib/firebase');
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <>
            <aside className={styles.sidebar}>
                <div className={styles.container}>
                    <div className={styles.logo}>
                        <img
                            src="/naruto-arena-blog/logo-naruto.png"
                            alt="Naruto Arena Logo"
                            className={styles.logoImage}
                        />
                    </div>

                    <nav className={styles.nav}>
                        {MENU_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.path || (item.path === '/home' && pathname === '/') || (item.path !== '/home' && item.path !== '/' && pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                    {...(item.path.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                >
                                    <Icon size={20} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className={styles.roleSwitcher}>
                    {loading ? (
                        <div className={styles.loadingAuth}>Carregando...</div>
                    ) : user ? (
                        <div className={styles.userInfo}>
                            <div className={styles.adminActions}>
                                <span className={styles.userName}>{user.displayName || user.email}</span>
                                {isAdmin && (
                                    <button
                                        className={styles.clearBtn}
                                        onClick={() => {
                                            if (confirm('Apagar todos os times permanentemente?')) {
                                                clearTeams();
                                            }
                                        }}
                                        title="Limpar todos os times"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <button className={styles.logoutBtn} onClick={handleLogout}>
                                <Shield size={14} /> Sair ({role})
                            </button>
                        </div>
                    ) : (
                        <button className={styles.loginBtn} onClick={handleLogin}>
                            <Shield size={14} /> Entrar com Google
                        </button>
                    )}
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className={styles.mobileNav}>
                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path || (item.path === '/home' && pathname === '/') || (item.path !== '/home' && item.path !== '/' && pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`${styles.mobileNavItem} ${isActive ? styles.active : ''}`}
                            {...(item.path.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                            <Icon size={24} />
                            <span className={styles.mobileNavLabel}>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
