'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Team } from '@/lib/types';

interface TeamContextType {
    teams: Team[];
    addTeam: (team: Team) => void;
    deleteTeam: (id: string) => void;
    clearTeams: () => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const storedTeams = localStorage.getItem('naruto-arena-teams');
        if (storedTeams) {
            try {
                setTeams(JSON.parse(storedTeams));
            } catch (e) {
                console.error('Failed to parse teams from local storage', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage whenever teams change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('naruto-arena-teams', JSON.stringify(teams));
        }
    }, [teams, isLoaded]);

    const addTeam = (team: Team) => {
        setTeams((prev) => [team, ...prev]);
    };

    const deleteTeam = (id: string) => {
        setTeams((prev) => prev.filter(t => t.id !== id));
    };

    const clearTeams = () => {
        setTeams([]);
        localStorage.removeItem('naruto-arena-teams');
    };

    return (
        <TeamContext.Provider value={{ teams, addTeam, deleteTeam, clearTeams }}>
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
