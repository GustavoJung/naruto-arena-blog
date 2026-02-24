'use client';

import { useState } from 'react';
import { ALL_MISSION_SESSIONS } from '@/lib/missions';
import { getMissionImageUrl, getSessionImageUrl } from '@/lib/missions';
import { translateUI, getCharacterImageUrl, handleCharacterImageError } from '@/lib/utils';
import { DetailedMission } from '@/lib/types';
import styles from './page.module.css';
import { ChevronDown, ChevronUp, Target, ThumbsUp } from 'lucide-react';
import { useTeams } from '@/context/TeamContext';
import Link from 'next/link';

export default function MissionsPage() {
    const { teams } = useTeams();
    const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
    const [selectedMission, setSelectedMission] = useState<DetailedMission | null>(null);

    const linkedTeams = selectedMission
        ? teams.filter(t => t.missionId === selectedMission.id)
        : [];

    const toggleSession = (sessionId: string) => {
        setExpandedSessions(prev =>
            prev.includes(sessionId)
                ? prev.filter(id => id !== sessionId)
                : [...prev, sessionId]
        );
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Mural de Missões Ninja</h1>
            <p className={styles.subtitle}>Complete missões para desbloquear shinobis lendários e recompensas especiais</p>

            <div className={styles.sessions}>
                {ALL_MISSION_SESSIONS.map(session => {
                    const isExpanded = expandedSessions.includes(session.id);
                    const sessionImage = getSessionImageUrl(session);
                    return (
                        <div key={session.id} className={styles.sessionCard}>
                            <button
                                className={styles.sessionHeader}
                                onClick={() => toggleSession(session.id)}
                            >
                                {sessionImage && (
                                    <div className={styles.sessionImageWrapper}>
                                        <img
                                            src={sessionImage}
                                            alt={session.title}
                                            className={styles.sessionImage}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <div className={styles.sessionInfo}>
                                    <h2 className={styles.sessionTitle}>{translateUI(session.title)}</h2>
                                    <p className={styles.sessionDesc}>{session.description}</p>
                                </div>
                                <div className={styles.sessionToggle}>
                                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className={styles.missionGrid}>
                                    {session.missions.map(mission => {
                                        const missionImg = getMissionImageUrl(mission, 'mission');

                                        return (
                                            <div
                                                key={mission.id}
                                                className={styles.missionCard}
                                                onClick={() => setSelectedMission(mission)}
                                            >
                                                {missionImg && (
                                                    <div className={styles.missionImage}>
                                                        <img
                                                            src={missionImg}
                                                            alt={mission.title}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                if (target.src !== mission.card?.imageUrl && mission.card?.imageUrl) {
                                                                    target.src = mission.card.imageUrl;
                                                                } else {
                                                                    target.style.display = 'none';
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                <div className={styles.missionContent}>
                                                    <h3 className={styles.missionTitle}>{translateUI(mission.title)}</h3>

                                                    <div className={styles.goalsPreview}>
                                                        <Target size={14} />
                                                        <span>{mission.goals.length} objetivo{mission.goals.length !== 1 ? 's' : ''}</span>
                                                    </div>

                                                    {mission.card.rankRequirement && (
                                                        <div className={styles.rankBadge}>
                                                            {mission.card.rankRequirement}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedMission && (
                <div className={styles.modal} onClick={() => setSelectedMission(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={styles.closeBtn}
                            onClick={() => setSelectedMission(null)}
                        >
                            ✕
                        </button>

                        <h2 className={styles.modalTitle}>{translateUI(selectedMission.title)}</h2>

                        <div className={styles.modalBody}>
                            {selectedMission.reward && (
                                <div className={styles.rewardSection}>
                                    <h3>Recompensa</h3>
                                    <div className={styles.rewardContent}>
                                        <div className={styles.rewardText}>
                                            <strong>Recompensa da Missão</strong>
                                            <br />
                                            Missão "{selectedMission.title}" completa.
                                            <br />
                                            <br />
                                            Desbloqueia: <strong>{selectedMission.card.unlockedCharacter}</strong>
                                        </div>
                                        {getMissionImageUrl(selectedMission, 'reward') && (
                                            <img
                                                src={getMissionImageUrl(selectedMission, 'reward')}
                                                alt="Reward"
                                                className={styles.rewardImage}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    if (target.src.endsWith('.jpg')) {
                                                        target.src = target.src.replace('.jpg', '.png');
                                                    } else if (target.src.endsWith('.png') && !target.src.includes('fallback')) {
                                                        // Convert literal name to slug for final fallback
                                                        const name = selectedMission.reward || selectedMission.card.unlockedCharacter || '';
                                                        const slug = name.toLowerCase().replace(/[^\\w\\s-]/g, '').replace(/\\s+/g, '-');
                                                        target.src = `/assets/nawiki/characters/${slug}.png?fallback=1`;
                                                    } else {
                                                        target.style.display = 'none';
                                                    }
                                                }}
                                            />
                                        )}

                                    </div>
                                </div>
                            )}

                            <div className={styles.goalsSection}>
                                <h3>Objetivos da Missão</h3>
                                <div className={styles.goalsList}>
                                    {selectedMission.goals.map((goal, idx) => (
                                        <div key={idx} className={styles.goalItem}>
                                            <span className={styles.goalText}>
                                                {goal.text.replace(/\(\d+\//g, '(0/')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {(selectedMission.card.rankRequirement || (selectedMission.card.completedRequeriments && selectedMission.card.completedRequeriments.length > 0)) && (
                                <div className={styles.requirementsSection}>
                                    <h3>Requisitos</h3>
                                    <div style={{ marginTop: '10px' }}>
                                        {selectedMission.card.rankRequirement && (
                                            <p style={{ marginBottom: '8px' }}>
                                                <strong>Rank:</strong> {selectedMission.card.rankRequirement}
                                            </p>
                                        )}
                                        {selectedMission.card.completedRequeriments && selectedMission.card.completedRequeriments.length > 0 && (
                                            <div>
                                                <p><strong>Missões concluídas:</strong></p>
                                                <ul style={{ paddingLeft: '20px', marginTop: '5px', listStyleType: 'disc' }}>
                                                    {selectedMission.card.completedRequeriments.map((req, idx) => {
                                                        return (
                                                            <li key={idx} style={{ color: 'var(--text-color)', fontWeight: '500' }}>
                                                                <span>{req.name}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {linkedTeams.length > 0 && (
                                <div className={styles.recommendedTeamsSection}>
                                    <h3>Times Recomendados</h3>
                                    <div className={styles.teamsList}>
                                        {linkedTeams.map(team => (
                                            <Link key={team.id} href={`/teams/${team.id}`} className={styles.teamLink}>
                                                <div className={styles.teamMiniCard}>
                                                    <div className={styles.teamAvatarGroup}>
                                                        {team.characters.map((char, i) => (
                                                            <img
                                                                key={i}
                                                                src={getCharacterImageUrl(char.id, char.name)}
                                                                alt={char.name}
                                                                className={styles.teamCharAvatar}
                                                                onError={(e) => handleCharacterImageError(e, char.id, char.name)}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className={styles.teamMiniName}>{team.name}</span>
                                                    <div className="flex items-center gap-1 ml-auto text-xs text-slate-500">
                                                        <ThumbsUp size={12} />
                                                        {team.likes}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
