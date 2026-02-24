'use client';

import { Team } from '@/lib/types';
import styles from './TeamCard.module.css';
import { getChakraTypes, getCharacterImageUrl, translateUI, handleCharacterImageError } from '@/lib/utils';
import { Clock, ThumbsUp, Swords, Trophy, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ALL_DETAILED_MISSIONS } from '@/lib/missions';
import { useAuth } from '@/context/AuthContext';
import { useTeams } from '@/context/TeamContext';

interface TeamCardProps {
    team: Team;
}

export default function TeamCard({ team }: TeamCardProps) {
    const { isAdmin } = useAuth();
    const { deleteTeam } = useTeams();

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Deseja excluir este time?')) {
            deleteTeam(team.id);
        }
    };

    return (
        <Link href={`/teams/${team.id}`} className={styles.cardLink}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.title}>{team.name}</h3>
                        <div className={styles.metaRow}>
                            <span className={styles.date}>{new Date(team.createdAt).toLocaleDateString()}</span>
                            {team.purpose && (
                                <span className={`${styles.purposeBadge} ${styles[team.purpose.toLowerCase()]}`}>
                                    {team.purpose === 'Mission' ? <Swords size={12} /> : <Trophy size={12} />}
                                    {team.purpose === 'Mission' && team.missionId
                                        ? translateUI(ALL_DETAILED_MISSIONS.find(m => m.id === team.missionId)?.title || 'Missão')
                                        : team.purpose === 'Ranking' && team.rankRequirement && team.rankRequirement !== 'None'
                                            ? `Ranking - ${translateUI(team.rankRequirement)}`
                                            : team.purpose === 'Ranking' ? 'Ranking' : team.purpose === 'Mission' ? 'Missão' : team.purpose}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.likes}>
                            <ThumbsUp size={16} />
                            <span>{team.likes}</span>
                        </div>
                        {isAdmin && (
                            <button
                                className={styles.deleteBtn}
                                onClick={handleDelete}
                                title="Excluir time"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {team.tags && team.tags.length > 0 && (
                    <div className={styles.tagGrid}>
                        {team.tags.map(tag => (
                            <span key={tag} className={styles.teamTag}>
                                {translateUI(tag)}
                            </span>
                        ))}
                    </div>
                )}

                <div className={styles.characters}>
                    {team.characters.map((char, index) => (
                        <div className={styles.character} key={char.id || index}>
                            <div className={styles.avatar}>
                                <img
                                    src={getCharacterImageUrl(char.id, char.name)}
                                    alt={char.name}
                                    className={styles.avatarImg}
                                    onError={(e) => handleCharacterImageError(e, char.id, char.name)}
                                />
                                <div className={styles.dotsContainer}>
                                    {getChakraTypes(char).map((type, idx) => (
                                        <span key={idx} className={styles.chakraDot} data-type={type} />
                                    ))}
                                </div>
                            </div>
                            <span className={styles.charName}>{char.displayName || char.name}</span>
                        </div>
                    ))}
                </div>

                <pre className={styles.description}>{team.description}</pre>
            </div>
        </Link>
    );
}
