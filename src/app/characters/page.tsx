'use client';

import { useState } from 'react';
import { ALL_CHARACTERS } from '@/lib/data';
import { getChakraTypes, getCharacterImageUrl, getSkillImageUrl, parseDescription, translateUI } from '@/lib/utils';
import { Character, Skill } from '@/lib/types';
import styles from './page.module.css';
import { Clock, Zap, Target as TargetIcon, X, Search } from 'lucide-react';

const CHAKRA_TYPES = ["Taijutsu", "Ninjutsu", "Genjutsu", "Bloodline", "Random"];

export default function CharactersPage() {
    const [selectedChar, setSelectedChar] = useState<Character | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChakras, setSelectedChakras] = useState<string[]>([]);

    const toggleChakra = (type: string) => {
        setSelectedChakras(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const filteredCharacters = ALL_CHARACTERS.filter(char => {
        const matchesName = (char.displayName || char.name).toLowerCase().includes(searchQuery.toLowerCase());
        const charChakraTypes = getChakraTypes(char);
        // If filters are active, character must have ALL selected chakra types
        const matchesChakra = selectedChakras.length === 0 || selectedChakras.every(type => charChakraTypes.includes(type));
        return matchesName && matchesChakra;
    });

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Enciclopédia Shinobi</h1>
            <div className={styles.sectionWrapper}>


                <div className={styles.filtersContainer}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.chakraFilters}>
                        <button
                            className={`${styles.filterBtn} ${selectedChakras.length === 0 ? styles.active : ''}`}
                            onClick={() => setSelectedChakras([])}
                        >
                            Todos
                        </button>
                        {CHAKRA_TYPES.map(type => (
                            <button
                                key={type}
                                className={`${styles.filterBtn} ${selectedChakras.includes(type) ? styles.active : ''}`}
                                onClick={() => toggleChakra(type)}
                            >
                                <span className={styles.chakraDot} data-type={type} style={{ marginRight: '6px' }} />
                                {translateUI(type)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.grid}>
                    {filteredCharacters.map((char) => (
                        <div
                            key={char.id}
                            className={`${styles.card} ${selectedChar?.id === char.id ? styles.selected : ''}`}
                            onClick={() => setSelectedChar(char)}
                        >
                            <div className={styles.avatar}>
                                <img
                                    src={getCharacterImageUrl(char.id, char.name)}
                                    alt={char.name}
                                    className={styles.avatarImg}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
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
                            <span className={styles.charName}>{char.displayName || char.name}</span>
                        </div>
                    ))}
                </div>

                {selectedChar && (
                    <div className={styles.detailsPanel}>
                        <button
                            className={styles.closeButton}
                            onClick={() => setSelectedChar(null)}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                        <div className={styles.detailsHeader}>
                            <div className={styles.largeAvatar}>
                                <img
                                    src={getCharacterImageUrl(selectedChar.id, selectedChar.name)}
                                    alt={selectedChar.name}
                                    className={styles.avatarImg}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                                        target.style.opacity = '0';
                                    }}
                                />
                            </div>
                            <div className={styles.headerInfo}>
                                <h2 className={styles.detailsName}>{selectedChar.displayName || selectedChar.name}</h2>
                                <div className={styles.typeTags}>
                                    {getChakraTypes(selectedChar).map((type: any, idx: number) => (
                                        <span key={idx} className={styles.typeTag} data-type={type}>
                                            {translateUI(type)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {selectedChar.description && (
                            <div className={styles.descriptionSection}>
                                <div className={styles.charDescription}>
                                    {parseDescription(selectedChar.description, styles)}
                                </div>
                                {selectedChar.unlockRequirements && (
                                    <div className={styles.requirements}>
                                        <strong>Requerimentos:</strong> {selectedChar.unlockRequirements}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={styles.skillsSection}>
                            <h3 className={styles.sectionTitle}>Ninjutsu e Habilidades</h3>
                            <div className={styles.skillsGrid}>
                                {selectedChar.skills.map((skill: Skill) => (
                                    <div key={skill.id} className={styles.skillCard}>
                                        <div className={styles.skillTop}>
                                            <div className={styles.skillIcon} data-main-type={selectedChar.chakraTypes[0]}>
                                                <img
                                                    src={skill.imageUrl}
                                                    alt={skill.name}
                                                    className={styles.skillIconImg}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null;
                                                        target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                                                        target.style.opacity = '0';
                                                    }}
                                                />
                                            </div>
                                            <div className={styles.skillMainInfo}>
                                                <h4 className={styles.skillName}>{skill.name}</h4>
                                                <div className={styles.skillClasses}>
                                                    {skill.classes.map(cls => (
                                                        <span key={cls} className={styles.classTag}>{cls}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.skillStats}>
                                            <div className={styles.statLine}>
                                                <Clock size={12} /> Cooldown: {skill.cooldown}
                                            </div>
                                            <div className={styles.chakraCost}>
                                                {skill.chakraCost.map((cost, idx) => (
                                                    <div key={idx} className={styles.costItem} data-type={cost.type.toLowerCase()}>
                                                        {cost.total}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={styles.skillDesc}>
                                            {parseDescription(skill.description, styles)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Spacer to prevent content from being hidden behind the fixed bottom bar */}
            <div style={{ height: '150px' }}></div>
        </div>
    );
}
