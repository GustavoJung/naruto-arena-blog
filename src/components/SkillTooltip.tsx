'use client';

import { useState, useRef } from 'react';
import { Skill } from '@/lib/types';
import { getSkillImageUrl, handleSkillImageError } from '@/lib/utils';
import styles from './SkillTooltip.module.css';

interface SkillTooltipProps {
    skillName: string;
    skill: Skill & { characterId: string };
}

const CHAKRA_ICONS: Record<string, string> = {
    taijutsu: '🟢',
    ninjutsu: '🔵',
    genjutsu: '⚪',
    bloodline: '🔴',
    random: '⚫',
};

export default function SkillTooltip({ skillName, skill }: SkillTooltipProps) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState<'above' | 'below'>('above');
    const ref = useRef<HTMLSpanElement>(null);

    const handleMouseEnter = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            // Show below if too close to the top of the viewport
            setPos(rect.top < 180 ? 'below' : 'above');
        }
        setShow(true);
    };

    const chakraCostStr = skill.chakraCost.length === 0
        ? 'Nenhum'
        : skill.chakraCost.map(c => {
            const icon = CHAKRA_ICONS[c.type.toLowerCase()] || '?';
            return `${icon} ${c.total}x ${c.type}`;
        }).join(', ');

    const cooldownStr = skill.cooldown === 0 ? 'Nenhum' : `${skill.cooldown} turno(s)`;

    return (
        <span
            ref={ref}
            className={styles.trigger}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShow(false)}
        >
            <span className={styles.skillLink}>{skillName}</span>

            {show && (
                <span className={`${styles.popup} ${pos === 'below' ? styles.below : styles.above}`}>
                    <span className={styles.popupHeader}>
                        <span className={styles.icon}>
                            <img
                                src={skill.imageUrl || getSkillImageUrl(skill.id, skill.characterId, skill.name)}
                                alt={skill.name}
                                className={styles.iconImg}
                                onError={(e) => handleSkillImageError(e as any, skill.id, skill.characterId, skill.name)}
                            />
                        </span>
                        <span className={styles.skillName}>{skill.name}</span>
                    </span>

                    <span className={styles.separator} />

                    <span className={styles.description}>{skill.description}</span>

                    <span className={styles.stats}>
                        <span className={styles.stat}>
                            <span className={styles.statLabel}>Custo:</span>
                            <span className={styles.statValue}>{chakraCostStr}</span>
                        </span>
                        <span className={styles.stat}>
                            <span className={styles.statLabel}>Cooldown:</span>
                            <span className={styles.statValue}>{cooldownStr}</span>
                        </span>
                    </span>
                </span>
            )}
        </span>
    );
}
