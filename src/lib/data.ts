import { Character, Mission, Skill, TeamTag, ChakraRequirement } from './types';
import rawCharacters from '../../public/assets/nawiki/naruto_arena_characters_fixed.json';
import { getCharacterImageUrl, getSkillImageUrl, translateName } from './utils';

export const AVAILABLE_TEAM_TAGS: TeamTag[] = [
    'AoE Damage',
    'Chakra Steal',
    'Stun',
    'Damage Over Time',
    'Defense',
    'Buffer'
];

export const ALL_MISSIONS: Mission[] = [
    {
        id: 'team-7-bonding',
        title: 'Team 7 Bonding',
        category: 'Genin',
        description: 'Prove the strength of the new Team 7 through a series of D-rank tasks.',
        requirements: ['Level 5', 'Naruto, Sasuke, or Sakura in team'],
        reward: '1000 Ryo'
    },
    {
        id: 'bell-test',
        title: 'The Bell Test',
        category: 'Genin',
        description: 'Take the bells from the Copy Ninja. Focus on teamwork and perseverance.',
        requirements: ['Level 10', 'Kakashi unlocked'],
        reward: 'Hidden Entry'
    },
    {
        id: 'cat-capture',
        title: 'Catch the Lost Tora',
        category: 'Genin',
        description: 'Find and capture Madam Shijimi\'s lost cat. Be careful, she bites!',
        requirements: ['Level 2', 'Any Genin in team'],
        reward: '500 Ryo'
    },
    {
        id: 'herb-gathering',
        title: 'Medicinal Herb Search',
        category: 'Genin',
        description: 'Gather rare herbs from the Forest of Quietude for the Hospital.',
        requirements: ['Level 3', 'Sakura or Hinata in team'],
        reward: '800 Ryo'
    },
    {
        id: 'river-cleanup',
        title: 'River Cleaning Patrol',
        category: 'Genin',
        description: 'Remove debris and trash from the Naka River to ensure clean water flow.',
        requirements: ['Level 4', 'Rock Lee or Shikamaru in team'],
        reward: '600 Ryo'
    },
    {
        id: 'training-cleanup',
        title: 'Field Maintenance',
        category: 'Genin',
        description: 'Clean up the training fields. Remove broken targets and refill kunai pouches.',
        requirements: ['Level 1', 'No specific requirements'],
        reward: '300 Ryo'
    },
    {
        id: 'forest-of-death',
        title: 'Forest of Death',
        category: 'Chunnin',
        description: 'Survive the second stage of the Chunin Exams. Watch out for mysterious snakes.',
        requirements: ['Level 25', 'Anko Sensei unlocked'],
        reward: 'Scroll of Heaven'
    },
    {
        id: 'protect-the-daimyo',
        title: 'Protect the Daimyo',
        category: 'Chunnin',
        description: 'Guard the Fire Daimyo from hidden assassins during his travel.',
        requirements: ['Level 30', 'Asuma unlocked'],
        reward: 'Guardian Badge'
    },
    {
        id: 'akatsuki-hunt',
        title: 'Akatsuki Hunt',
        category: 'Missing-nin',
        description: 'Track and neutralize rogue members of the Akatsuki organization.',
        requirements: ['Level 50', 'Pain or Itachi defeated'],
        reward: 'S-Rank Status'
    },
    {
        id: 'rogue-kage',
        title: 'The Rogue Kage',
        category: 'Missing-nin',
        description: 'Defeat a former village leader who has gone rogue.',
        requirements: ['Level 60', 'High-tier Shinobi required'],
        reward: 'Legendary Title'
    }
];

const formatName = (id: string) => {
    let name = id.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // Convert trailing ' S' to ' (S)' to match filenames like "Uzumaki Naruto (S).jpg"
    if (name.endsWith(' S')) {
        name = name.slice(0, -2) + ' (S)';
    }

    return name;
};

/**
 * Find a skill by name. Searches team characters first (if provided), then globally.
 */
export function findSkillByName(
    name: string,
    characterContext?: Character[]
): (Skill & { characterId: string }) | undefined {
    const lowerName = name.toLowerCase();

    if (characterContext) {
        for (const char of characterContext) {
            const skill = char.skills.find(s => s.name.toLowerCase() === lowerName);
            if (skill) return { ...skill, characterId: char.id };
        }
    }

    for (const char of ALL_CHARACTERS) {
        const skill = char.skills.find(s => s.name.toLowerCase() === lowerName);
        if (skill) return { ...skill, characterId: char.id };
    }

    return undefined;
}

// Map the raw JSON data to our application types
export const ALL_CHARACTERS: Character[] = (rawCharacters as any[]).map(char => {
    const name = char.name;
    return {
        id: char.id,
        name: name,
        displayName: translateName(name),
        description: char.description || '',
        unlockRequirements: char.unlockRequirements,
        avatarUrl: getCharacterImageUrl(char.id, name),
        chakraTypes: char.chakraTypes && char.chakraTypes.length > 0 ? char.chakraTypes : ['Random'],
        skills: (char.skills || []).map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            imageUrl: getSkillImageUrl(skill.id, char.id, skill.name, name),
            cooldown: skill.cooldown || 0,
            chakraCost: (skill.chakraCost || []).map((cost: any) => ({
                type: cost.type,
                total: isNaN(Number(cost.total)) ? cost.total : Number(cost.total)
            })),
            classes: (skill.classes || []).filter((cls: string) => !cls.startsWith('_$')),
            target: skill.target || 'unknown'
        }))
    };
});
