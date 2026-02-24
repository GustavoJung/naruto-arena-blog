import { useState } from 'react';
import { Character, Skill } from '@/lib/types';
import { ALL_CHARACTERS } from '@/lib/data';
import { getChakraTypes, getCharacterImageUrl, getSkillImageUrl } from '@/lib/utils';
import styles from './CharacterSelector.module.css';

interface CharacterSelectorProps {
    onSelect: (character: Character) => void;
    selectedIds: string[]; // IDs of characters already selected in the team
}

export default function CharacterSelector({ onSelect, selectedIds }: CharacterSelectorProps) {
    const [hoveredChar, setHoveredChar] = useState<string | null>(null);
    const [showBelow, setShowBelow] = useState(false);
    const [alignEdge, setAlignEdge] = useState<'center' | 'left' | 'right'>('center');

    const handleMouseEnter = (e: React.MouseEvent, charId: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const parentRect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();

        if (parentRect) {
            // Vertical: If the element is in the top 180px of the scrollable area, show tooltip below
            const relativeTop = rect.top - parentRect.top;
            setShowBelow(relativeTop < 180);

            // Horizontal: Detect proximity to left/right edges
            const relativeLeft = rect.left - parentRect.left;
            const relativeRight = parentRect.right - rect.right;

            if (relativeLeft < 80) {
                setAlignEdge('left');
            } else if (relativeRight < 80) {
                setAlignEdge('right');
            } else {
                setAlignEdge('center');
            }
        }

        setHoveredChar(charId);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.grid}>
                {ALL_CHARACTERS.map((char) => {
                    const isSelected = selectedIds.includes(char.id);
                    return (
                        <div
                            key={char.id}
                            className={styles.charItem}
                            onMouseEnter={(e) => handleMouseEnter(e, char.id)}
                            onMouseLeave={() => setHoveredChar(null)}
                        >
                            <button
                                className={`${styles.characterBtn} ${isSelected ? styles.disabled : ''}`}
                                onClick={() => !isSelected && onSelect(char)}
                                disabled={isSelected}
                                type="button"
                            >
                                <div className={styles.avatarPlaceholder}>
                                    <img
                                        src={getCharacterImageUrl(char.id, char.name)}
                                        alt={char.name}
                                        className={styles.charAvatar}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; // Prevent infinite loop
                                            target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                                            target.style.opacity = '0';
                                        }}
                                    />
                                    <div className={styles.dotsContainer}>
                                        {getChakraTypes(char).map((type: any, idx: number) => (
                                            <span key={idx} className={styles.chakraDot} data-type={type} />
                                        ))}
                                    </div>
                                </div>
                                <span className={styles.name}>{char.displayName || char.name}</span>
                            </button>

                            {hoveredChar === char.id && (
                                <div className={`
                                    ${styles.skillPreview} 
                                    ${showBelow ? styles.showBelow : ''} 
                                    ${alignEdge === 'left' ? styles.alignLeft : ''} 
                                    ${alignEdge === 'right' ? styles.alignRight : ''}
                                `}>
                                    <div className={styles.previewName}>{char.displayName || char.name}</div>
                                    <div className={styles.skillsRow}>
                                        {char.skills.map((skill: Skill) => (
                                            <div key={skill.id} className={styles.miniSkill} title={skill.name}>
                                                <div className={styles.miniIcon} data-main-type={char.chakraTypes[0]}>
                                                    <img
                                                        src={skill.imageUrl}
                                                        alt={skill.name}
                                                        className={styles.skillIcon}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.onerror = null;
                                                            target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.previewHint}>Clique para adicionar ao time</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className={styles.footerNote}>* Passe o mouse para ver as habilidades</div>
        </div>
    );
}
