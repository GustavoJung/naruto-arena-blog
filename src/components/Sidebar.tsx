'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Trophy, Shield, Settings, Home, Swords, ScrollText, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTeams } from '@/context/TeamContext';
import styles from './Sidebar.module.css';

const MENU_ITEMS = [
    { name: 'Início', path: '/home', icon: Home },
    { name: 'Times', path: '/', icon: LayoutDashboard },
    { name: 'Personagens', path: '/characters', icon: Users },
    { name: 'Missões', path: '/missions', icon: ScrollText },
    { name: 'Jogue agora', path: 'https://www.naruto-arena.site/', icon: Swords }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { role, setRole, isAdmin } = useAuth();
    const { clearTeams } = useTeams();

    return (
        <>
            <aside className={styles.sidebar}>
                <div className={styles.container}>
                    <div className={styles.logo}>
                        <img
                            src="/logo-naruto.png"
                            alt="Naruto Arena Logo"
                            className={styles.logoImage}
                        />
                    </div>

                    <nav className={styles.nav}>
                        {MENU_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
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
                    <div className={styles.adminActions}>
                        <span className={styles.roleLabel}>Acessado como:</span>
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
                    <div className={styles.roleButtons}>
                        <button
                            className={`${styles.roleBtn} ${!isAdmin ? styles.activeUser : ''}`}
                            onClick={() => setRole('User')}
                        >
                            <Users size={14} /> Leitor
                        </button>
                        <button
                            className={`${styles.roleBtn} ${isAdmin ? styles.activeAdmin : ''}`}
                            onClick={() => setRole('Admin')}
                        >
                            <Shield size={14} /> Administrador
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className={styles.mobileNav}>
                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
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
