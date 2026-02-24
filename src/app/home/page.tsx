'use client';

import styles from './page.module.css';
import { Newspaper, Bell, Zap, Info } from 'lucide-react';

export default function HomePage() {
    const news = [
        {
            id: 1,
            title: "Lista de missões implementada!",
            date: "2026-feb-23",
            content: "Agora você pode visualizar todas as missões, requisitos e recompensas! Confira a aba Missões na barra lateral.",
            type: "Funcionalidade",
            icon: <Zap size={20} />
        },
        {
            id: 2,
            title: "Página de Detalhes de Times Implementada!",
            date: "2026-feb-12",
            content: "Clique em qualquer card de time para ver descrições completas de estratégia e estatísticas detalhadas dos personagens.",
            type: "Funcionalidade",
            icon: <Info size={20} />
        },
        {
            id: 3,
            title: "Lista de personagens, habilidades e detalhes implementada!",
            date: "2026-feb-11",
            content: "Acesse o menu de personagens e confira todos os detalhes!",
            type: "Funcionalidade",
            icon: <Info size={20} />
        },

    ];

    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                <h1 className={styles.title}>Novidades</h1>
                <p className={styles.subtitle}>Fique por dentro das últimas notícias e atualizações!</p>
            </header>

            <main className={styles.newsList}>
                {news.map(item => (
                    <article key={item.id} className={styles.newsItem} data-type={item.type}>
                        <div className={styles.newsHeader}>
                            <div className={styles.iconWrapper}>
                                {item.icon}
                            </div>
                            <div className={styles.headerInfo}>
                                <h2 className={styles.newsTitle}>{item.title}</h2>
                                <span className={styles.newsDate}>{item.date}</span>
                            </div>
                            <span className={styles.tag}>{item.type}</span>
                        </div>
                        <p className={styles.newsContent}>{item.content}</p>
                    </article>
                ))}
            </main>
        </div>
    );
}
