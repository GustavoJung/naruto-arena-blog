'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Character, Team } from '@/lib/types';
import { useTeams } from '@/context/TeamContext';
import CharacterSelector from './CharacterSelector';
import styles from './CreateTeamForm.module.css';
import { Trash2 } from 'lucide-react';

export default function CreateTeamForm() {
    const router = useRouter();
    const { addTeam } = useTeams();

    const [name, setName] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [selectedChars, setSelectedChars] = useState<Character[]>([]);
    const [error, setError] = useState('');

    const handleSelectCharacter = (char: Character) => {
        if (selectedChars.length >= 3) {
            setError('Você só pode selecionar 3 personagens.');
            return;
        }
        setSelectedChars([...selectedChars, char]);
        setError('');
    };

    const handleRemoveCharacter = (id: string) => {
        setSelectedChars(selectedChars.filter(c => c.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedChars.length !== 3) {
            setError('Por favor, selecione exatamente 3 personagens.');
            return;
        }
        if (!name.trim() || !description.trim() || !author.trim()) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        const newTeam: Team = {
            id: crypto.randomUUID(),
            name,
            author,
            description,
            characters: selectedChars as [Character, Character, Character],
            createdAt: Date.now(),
            likes: 0,
        };

        addTeam(newTeam);
        router.push('/');
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.fieldGrid}>
                <div className={styles.field}>
                    <label htmlFor="teamName" className={styles.label}>Nome do Time</label>
                    <input
                        id="teamName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.input}
                        placeholder="ex: Time 7 Renascido"
                        required
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="author" className={styles.label}>Seu Nickname</label>
                    <input
                        id="author"
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className={styles.input}
                        placeholder="ex: Uzumaki_Ninja"
                        required
                    />
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Selecionar Personagens ({selectedChars.length}/3)</label>

                {/* Selected Characters Preview */}
                <div className={styles.selectedContainer}>
                    {selectedChars.map((char) => (
                        <div key={char.id} className={styles.selectedCharTag}>
                            <span>{char.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveCharacter(char.id)}
                                className={styles.removeBtn}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {selectedChars.length === 0 && <span className="text-gray-400 text-sm">Nenhum personagem selecionado</span>}
                </div>

                <CharacterSelector
                    onSelect={handleSelectCharacter}
                    selectedIds={selectedChars.map(c => c.id)}
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="description" className={styles.label}>Estratégia / Descrição</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={styles.textarea}
                    placeholder="Explique como este time funciona..."
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={selectedChars.length !== 3}>
                Criar Time
            </button>
        </form>
    );
}
