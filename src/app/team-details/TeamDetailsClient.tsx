'use client';

import { useRouter } from 'next/navigation';
import { useTeams } from '@/context/TeamContext';
import { getChakraTypes, translateUI, getCharacterImageUrl, handleCharacterImageError } from '@/lib/utils';
import { ALL_DETAILED_MISSIONS } from '@/lib/missions';
import styles from './page.module.css';
import { ThumbsUp, Calendar, ArrowLeft, Swords, Trophy } from 'lucide-react';
import FormattedStrategy from '@/components/FormattedStrategy';

export default function TeamDetailsClient({ id }: { id: string }) {
    const router = useRouter();
    const { teams, likeTeam } = useTeams();

    const team = teams.find(t => t.id === id);

    if (!team) {
        return (
            <div className={styles.container}>
                <div className={styles.notFound}>
                    <h1>Time não encontrado</h1>
                    <button onClick={() => router.back()} className="btn btn-primary">Voltar</button>
                </div>
            </div>
        );
    }

    const handleLike = () => {
        likeTeam(team.id);
    };

    return (
        <div className={styles.container}>
            <button onClick={() => router.back()} className={styles.backBtn}>
                <ArrowLeft size={20} /> Voltar
            </button>

            <div className={styles.detailsCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.teamName}>{team.name}</h1>
                        <div className={styles.meta}>
                            <div className={styles.metaItem}>
                                <Calendar size={16} />
                                {new Date(team.createdAt).toLocaleDateString()}
                            </div>
                            {team.author && (
                                <div className={styles.metaItem}>
                                    por <strong>{team.author}</strong>
                                </div>
                            )}
                            {team.purpose && (
                                <div className={`${styles.purposeBadge} ${styles[team.purpose.toLowerCase()]}`}>
                                    {team.purpose === 'Mission' ? <Swords size={12} /> : <Trophy size={12} />}
                                    {translateUI(team.purpose)}
                                    {team.purpose === 'Ranking' && team.rankRequirement && team.rankRequirement !== 'None' && (
                                        <span> - {translateUI(team.rankRequirement)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button className={styles.likeBtn} onClick={handleLike}>
                        <ThumbsUp size={24} />
                        <span>{team.likes} Curtidas</span>
                    </button>

                </div>

                {team.tags && team.tags.length > 0 && (
                    <div className={styles.tagList}>
                        {team.tags.map(tag => (
                            <span key={tag} className={styles.tag}>
                                {translateUI(tag)}
                            </span>
                        ))}
                    </div>
                )}


                <div className={styles.charactersGrid}>
                    {team.characters.map((char, index) => (
                        <div key={char.id || index} className={styles.character}>
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
                            <h3 className={styles.charName}>{translateUI(char.name)}</h3>
                        </div>
                    ))}
                </div>

                <div className={styles.strategySection}>
                    <h2 className={styles.sectionTitle}>Estratégia de Batalha</h2>
                    <div className={styles.strategyContent}>
                        <FormattedStrategy text={team.description} characters={team.characters} />
                    </div>
                </div>

                {team.missionId && (
                    <div className={styles.linkedMission}>
                        Missão: <strong>{translateUI(ALL_DETAILED_MISSIONS.find(m => m.id === team.missionId)?.title || team.missionId)}</strong>
                    </div>
                )}
            </div>
        </div>
    );
}
