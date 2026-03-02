'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Team } from '@/lib/types';
import { db } from '@/lib/firebase';
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    increment,
    arrayUnion,
    query,
    orderBy
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface TeamContextType {
    teams: Team[];
    addTeam: (team: Omit<Team, 'id' | 'likes' | 'createdAt'>) => Promise<void>;
    deleteTeam: (id: string) => Promise<void>;
    likeTeam: (id: string, currentLikes: number) => Promise<void>;
    clearTeams: () => Promise<void>;
    loading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, isAdmin } = useAuth();
    const { showToast } = useToast();

    // Load from Firestore on mount
    useEffect(() => {
        const q = query(collection(db, 'teams'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Team[];
            setTeams(teamsList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching teams:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addTeam = async (teamData: Omit<Team, 'id' | 'likes' | 'createdAt'>) => {
        if (!user) {
            showToast('Você precisa estar logado para criar um time', 'error');
            return;
        }

        try {
            const docData: any = {
                ...teamData,
                characters: teamData.characters.map(char => ({
                    id: char.id,
                    name: char.name,
                    displayName: char.displayName || char.name,
                    chakraTypes: char.chakraTypes
                })),
                likes: 0,
                likedBy: [],
                createdAt: new Date().toISOString(),
                authorId: user.uid,
                authorName: teamData.authorName || user.displayName || user.email || 'Anônimo'
            };

            // Deeply remove undefined fields which Firestore doesn't accept
            const sanitize = (obj: any): any => {
                if (Array.isArray(obj)) {
                    return obj.map(v => sanitize(v));
                } else if (obj !== null && typeof obj === 'object') {
                    return Object.fromEntries(
                        Object.entries(obj)
                            .filter(([_, v]) => v !== undefined)
                            .map(([k, v]) => [k, sanitize(v)])
                    );
                }
                return obj;
            };

            const sanitizedData = sanitize(docData);

            await addDoc(collection(db, 'teams'), sanitizedData);
            showToast('Time criado com sucesso!', 'success');
        } catch (error) {
            console.error("Error adding team:", error);
            showToast('Erro ao criar time', 'error');
        }
    };

    const deleteTeam = async (id: string) => {
        if (!isAdmin) {
            showToast('Apenas administradores podem excluir times', 'error');
            return;
        }

        try {
            await deleteDoc(doc(db, 'teams', id));
            showToast('Time excluído com sucesso', 'success');
        } catch (error) {
            console.error("Error deleting team:", error);
            showToast('Erro ao excluir time', 'error');
        }
    };

    const likeTeam = async (id: string, currentLikes: number) => {
        if (!user) {
            showToast('Você precisa estar logado para dar like', 'error');
            return;
        }

        const team = teams.find(t => t.id === id);
        if (team?.likedBy?.includes(user.uid)) {
            showToast('Você já deu like neste time!', 'error');
            return;
        }

        try {
            const teamRef = doc(db, 'teams', id);
            await updateDoc(teamRef, {
                likes: increment(1),
                likedBy: arrayUnion(user.uid)
            });
        } catch (error) {
            console.error("Error liking team:", error);
        }
    };

    const clearTeams = async () => {
        if (!isAdmin) {
            showToast('Apenas administradores podem limpar os times', 'error');
            return;
        }

        // Firestore doesn't have a single call to clear a collection
        // We'd need to delete each doc. For now, let's just warn it's disabled or needs implementation
        showToast('Funcionalidade de limpar tudo deve ser usada com cautela no Firestore', 'error');
    };

    return (
        <TeamContext.Provider value={{ teams, addTeam, deleteTeam, likeTeam, clearTeams, loading }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeams = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeams must be used within a TeamProvider');
    }
    return context;
};
