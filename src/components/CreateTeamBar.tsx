'use client';

import { useState } from 'react';
import { Character, Team, TeamTag } from '@/lib/types';
import { useTeams } from '@/context/TeamContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { AVAILABLE_TEAM_TAGS } from '@/lib/data';
import { ALL_MISSION_SESSIONS } from '@/lib/missions';
import { getChakraTypes, translateUI, getCharacterImageUrl, handleCharacterImageError } from '@/lib/utils';
import CharacterSelector from './CharacterSelector';
import styles from './CreateTeamBar.module.css';
import { Plus, X, Swords, Trophy, ScrollText, Shield, Tag as TagIcon } from 'lucide-react';

export default function CreateTeamBar() {
    const { addTeam } = useTeams();
    const { showToast } = useToast();
    const { isAdmin } = useAuth();
    const MAX_DESC_LENGTH = 600;

    const [name, setName] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [selectedChars, setSelectedChars] = useState<Character[]>([]);
    const [selectedTags, setSelectedTags] = useState<TeamTag[]>([]);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [purpose, setPurpose] = useState<'Mission' | 'Ranking'>('Ranking');
    const [missionId, setMissionId] = useState('');
    const [rankLevel, setRankLevel] = useState<Team['rankRequirement']>('None');

    const handleSelectCharacter = (char: Character) => {
        if (selectedChars.length < 3) {
            setSelectedChars([...selectedChars, char]);
        }
    };

    const handleRemoveCharacter = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedChars(selectedChars.filter(c => c.id !== id));
    };

    const toggleTag = (tag: TeamTag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        if (text.length <= MAX_DESC_LENGTH) {
            setDescription(text);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedChars.length !== 3 || !name || !description || !author) return;

        const newTeam: Team = {
            id: crypto.randomUUID(),
            name,
            author,
            description,
            characters: selectedChars as [Character, Character, Character],
            createdAt: Date.now(),
            likes: 0,
            purpose,
            missionId: purpose === 'Mission' ? missionId : undefined,
            rankRequirement: purpose === 'Ranking' ? rankLevel : undefined,
            tags: selectedTags
        };

        addTeam(newTeam);
        showToast('Time criado com sucesso!', 'success');

        // Reset form
        setName('');
        setAuthor('');
        setDescription('');
        setSelectedChars([]);
        setSelectedTags([]);
        setPurpose('Ranking');
        setMissionId('');
        setRankLevel('None');
        setIsPopoverOpen(false);
        setIsOpen(false);
    };

    if (!isOpen) {
        return (
            <button
                className={styles.openBtn}
                onClick={() => setIsOpen(true)}
            >
                <Plus size={24} /> Criar Novo Time
            </button>
        );
    }

    return (
        <div className={styles.bottomBar}>
            <button className={styles.closeBarBtn} onClick={() => setIsOpen(false)}>
                <X size={24} />
            </button>

            {isPopoverOpen && (
                <div className={styles.popover}>
                    <div className={styles.popoverHeader}>
                        <h3 className="font-bold">Selecionar Personagens ({selectedChars.length}/3)</h3>
                        <button className={styles.closePopoverBtn} onClick={() => setIsPopoverOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>
                    <CharacterSelector
                        onSelect={handleSelectCharacter}
                        selectedIds={selectedChars.map(c => c.id)}
                    />
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.topRow}>
                    <div className={styles.inputGroup} style={{ flexGrow: 2 }}>
                        <input
                            type="text"
                            placeholder="Nome do Time"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup} style={{ flexGrow: 1 }}>
                        <input
                            type="text"
                            placeholder="Seu Nick"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.purposeSelector}>
                        <button
                            type="button"
                            className={`${styles.purposeBtn} ${purpose === 'Mission' ? styles.activeMission : ''}`}
                            onClick={() => setPurpose('Mission')}
                        >
                            <Swords size={16} />
                            Missão
                        </button>
                        <button
                            type="button"
                            className={`${styles.purposeBtn} ${purpose === 'Ranking' ? styles.activeRanking : ''}`}
                            onClick={() => setPurpose('Ranking')}
                        >
                            <Trophy size={16} />
                            Ranking
                        </button>
                    </div>

                    {purpose === 'Mission' && (
                        <div className={styles.missionSelectContainer}>
                            <ScrollText size={16} className={styles.missionIcon} />
                            <select
                                value={missionId}
                                onChange={(e) => setMissionId(e.target.value)}
                                className={styles.select}
                                required
                            >
                                <option value="" disabled>Selecione a Missão</option>
                                {ALL_MISSION_SESSIONS.map(session => (
                                    <optgroup key={session.id} label={translateUI(session.title)}>
                                        {session.missions.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {translateUI(m.title)}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    )}

                    {purpose === 'Ranking' && (
                        <div className={styles.missionSelectContainer}>
                            <Shield size={16} className={styles.missionIcon} />
                            <select
                                value={rankLevel}
                                onChange={(e) => setRankLevel(e.target.value as any)}
                                className={styles.select}
                            >
                                <option value="None">Nível: Nenhum</option>
                                <option value="Genin">Genin</option>
                                <option value="Chunnin">Chunnin</option>
                                <option value="Missing-Nin">Missing-Nin</option>
                                <option value="Anbu">Anbu</option>
                                <option value="Jounnin">Jounnin</option>
                                <option value="Sannin">Sannin</option>
                                <option value="Jinchuuriky">Jinchuuriky</option>
                                <option value="Akatsuki">Akatsuki</option>
                                <option value="Kage">Kage</option>
                            </select>
                        </div>
                    )}

                    <div className={styles.slots} onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
                        {[0, 1, 2].map((index) => {
                            const char = selectedChars[index];
                            return (
                                <div key={index} className={`${styles.slot} ${char ? styles.filled : ''}`}>
                                    {char ? (
                                        <>
                                            <div className={styles.slotAvatar}>
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
                                            <button
                                                type="button"
                                                className={styles.removeBtn}
                                                onClick={(e) => handleRemoveCharacter(char.id, e)}
                                            >
                                                ×
                                            </button>
                                        </>
                                    ) : (
                                        <Plus size={16} color="#ccc" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={selectedChars.length !== 3 || !name || !description || !author || (purpose === 'Mission' && !missionId)}
                    >
                        Postar Time
                    </button>
                </div>

                <div className={styles.inputGroup}>
                    <textarea
                        placeholder="Descrição da Estratégia (Máx 600 chars)..."
                        value={description}
                        onChange={handleDescriptionChange}
                        className={`${styles.input} ${styles.textarea}`}
                        required
                        rows={2}
                    />
                    <div className={styles.charCount}>
                        {description.length}/{MAX_DESC_LENGTH}
                        <span className={styles.hintInline}>&nbsp;💡 Use <code>[Nome da Habilidade]</code> para tooltips interativos, ex: <code>[Shadow Clones]</code></span>
                    </div>
                </div>

                <div className={styles.tagSelector}>
                    <div className={styles.tagLabel}>
                        <TagIcon size={14} />
                        Tags Táticas:
                    </div>
                    <div className={styles.tagList}>
                        {AVAILABLE_TEAM_TAGS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                className={`${styles.tagBtn} ${selectedTags.includes(tag) ? styles.tagActive : ''}`}
                                onClick={() => toggleTag(tag)}
                            >
                                {tag === 'AoE Damage' && 'Dano em área'}
                                {tag === 'Chakra Steal' && 'Roubo de Chakra'}
                                {tag === 'Stun' && 'Atordoamento'}
                                {tag === 'Damage Over Time' && 'Dano Contínuo'}
                                {tag === 'Defense' && 'Defesa'}
                                {tag === 'Buffer' && 'Suporte'}
                            </button>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
}
