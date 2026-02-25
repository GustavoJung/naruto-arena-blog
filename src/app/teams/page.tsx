'use client';

import { useState } from 'react';
import { useTeams } from '@/context/TeamContext';
import TeamCard from '@/components/TeamCard';
import CreateTeamBar from '@/components/CreateTeamBar';
import styles from '../page.module.css';

export default function TeamsPage() {
    const { teams } = useTeams();
    const [filter, setFilter] = useState<'All' | 'Mission' | 'Ranking'>('All');

    const filteredTeams = teams.filter(team => {
        if (filter === 'All') return true;
        return team.purpose === filter;
    });

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Times Lendários</h1>
            <div className={styles.sectionWrapper}>
                <div className={styles.header}>
                    <div className={styles.filterTabs}>
                        {[
                            { id: 'All', label: 'Todos' },
                            { id: 'Mission', label: 'Missões' },
                            { id: 'Ranking', label: 'Ranking' }
                        ].map((f) => (
                            <button
                                key={f.id}
                                className={`${styles.filterTab} ${filter === f.id ? styles.active : ''}`}
                                onClick={() => setFilter(f.id as any)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.grid}>
                    {filteredTeams.length === 0 ? (
                        <div className={styles.emptyState}  >
                            <img
                                src="/naruto-arena-blog/assets/nawiki/nada.jpg"
                                alt="Nenhum time encontrado"
                                className={styles.emptyImage}
                                width={800}
                                height={400}
                            />
                            <h2 className={styles.emptyTitle}>
                                Nenhum time por aqui ainda
                            </h2>

                            <p className={styles.emptyDescription}>
                                Crie um novo time e ajude seus companheiros.
                            </p>
                        </div>
                    ) : (
                        filteredTeams.map((team) => (
                            <div key={team.id} style={{ width: '350px', scrollSnapAlign: 'start' }}>
                                <TeamCard team={team} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div style={{ height: '150px' }}></div>
            <CreateTeamBar />
        </div>
    );
}
