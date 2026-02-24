import Link from 'next/link';
import { Scroll, Zap } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.logo}>
                    <Scroll className="w-8 h-8" />
                    <span>Times para Naruto Arena</span>
                </Link>
                <div className={styles.links}>
                    <Link href="/" className={styles.link}>
                        Quadro de times
                    </Link>
                </div>
            </div>
        </nav>
    );
}
