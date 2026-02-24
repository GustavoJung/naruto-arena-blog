export type SkillClass = 'Ranged' | 'Physical' | 'Unique' | 'Affliction' | 'Chakra' | 'Mental' | 'Summon' | 'Energy' | 'Strategic' | 'Instant' | 'Melee' | 'Piercing';
export type SkillTarget = 'Enemy' | 'Ally' | 'Self' | 'All Enemies' | 'All Allies';

export type ChakraType = 'Taijutsu' | 'Ninjutsu' | 'Genjutsu' | 'Bloodline' | 'Random' | string;

export interface ChakraRequirement {
  type: ChakraType;
  total: number | string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  cooldown: number;
  chakraCost: ChakraRequirement[];
  classes: SkillClass[];
  target: string | SkillTarget;
}

export interface Character {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  unlockRequirements?: string;
  avatarUrl?: string; // Optional URL for character image
  chakraTypes: ChakraType[]; // Multiple Chakra nature types
  skills: Skill[]; // At least 4 skills per character
}

export type RankLevel = 'None' | 'Genin' | 'Chunnin' | 'Missing-Nin' | 'Anbu' | 'Jounnin' | 'Sannin' | 'Jinchuuriky' | 'Akatsuki' | 'Kage';

export type TeamTag = 'AoE Damage' | 'Chakra Steal' | 'Stun' | 'Damage Over Time' | 'Defense' | 'Buffer';

export interface Team {
  id: string;
  name: string; // Name of the team composition
  description: string;
  characters: [Character, Character, Character]; // Array of exactly 3 characters
  createdAt: number; // Timestamp
  author?: string; // Optional author name
  likes: number;
  purpose?: 'Mission' | 'Ranking'; // Purpose of the team
  missionId?: string; // Optional link to a specific mission
  rankRequirement?: RankLevel; // Requirement for ranking teams
  tags?: TeamTag[]; // Optional tactical tags
}

export type MissionCategory = 'Genin' | 'Chunnin' | 'Missing-nin';

export interface Mission {
  id: string;
  title: string;
  category: MissionCategory;
  description: string;
  requirements: string[]; // e.g. ["Level 10", "Sasuke unlocked"]
  reward?: string;
}

// New mission types for missions_out data
export interface MissionCard {
  imageUrl: string;
  isAvailable: boolean;
  isLevelAvailable: boolean;
  isCompleted: boolean;
  rankRequirement: string;
  levelRequirement: number;
  completedRequeriments: Array<{
    name: string;
    color: string;
  }>;
  unlockedCharacter: string;
}

export interface MissionGoal {
  text: string;
  isCompleted: boolean;
}

export interface MissionImages {
  mission?: {
    url: string;
    file: string;
  };
  reward?: {
    url: string;
    file: string;
  };
}

export interface DetailedMission {
  id: string;
  title: string;
  section: string;
  card: MissionCard;
  missionInfo: Record<string, any>;
  requirements: string;
  reward: string;
  goals: MissionGoal[];
  images: MissionImages;
  pageUrl: string;
}

export interface SessionImage {
  url: string;
  file: string;
}

export interface MissionSession {
  id: string;
  title: string;
  description: string;
  url: string;
  image?: SessionImage;
  missions: DetailedMission[];
}
