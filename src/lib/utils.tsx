import { Character } from "./types";

const BASE_PATH = '/naruto-arena-blog';

const PNG_CHARACTERS = [
    'Gaara', 'Kankuro', 'Temari', 'Uchiha Madara', 'Uchiha Izuna', 'Uchiha Shisui',
    'Anbu Kakashi', 'Akatsuki Sasuke (S)', 'Captain Kankuro (S)', 'Captain Temari (S)',
    'Commander Gaara (S)', 'Cursed Seal Lv1 Sasuke', 'Ebisu (S)', 'Edo Tensei Dan (S)',
    'Edo Tensei Hayate (S)', 'Edo Tensei Mangetsu (S)', 'Edo Tensei Yota (S)',
    'Edo tensei Chen (S)', 'Female Animal Path Pein (S)', 'Fuu (S)', 'Guren (S)',
    'Hiruko Sasori (S)', 'Karatachi Yagura', 'Mecha Naruto', 'Puppet Sasori (S)',
    'Shinobi War Tobi (S)', 'Shiore Orochimaru', 'Shizune (S)', 'Six Tails Kyuubi Naruto (S)',
    'Sora (S)', 'Three Tails Kyuubi Naruto (S)', 'Uzuki Yugao', 'White Snake Kabuto (S)',
    'White Snake Orochimaru', 'Young Kushina', 'Zaji'
];

const CHARACTER_NAME_MAPPING: Record<string, string> = {
    'Gaara of the Desert': 'Gaara',
    'Sakon': 'Sakon and Ukon',
    'Touji Mizuki': 'Mizuki',
    'Shodai Hokage': 'Senju Hashirama',
    'Sandaime Hokage': 'Sarutobi Hiruzen',
    'Gaara Rehabilitated': 'Rehabilitated Gaara',
    'Yondaime Hokage': 'Namikaze Minato',
    'Nidaime Hokage': 'Senju Tobirama',
    'Cursed Seal Mizuki': 'Mizuki',
    'Sai (S)': 'Sai',
    'Yamato (S)': 'Yamato',
    'Inuzuka Tsume (S)': 'Inuzuka Tsume',
    'Izumo and Kotetsu (S)': 'Izumo and Kotetsu',
    'Yamashiro Aoba (S)': 'Yamashiro Aoba',
    'Morino Ibiki (S)': 'Morino Ibiki',
    'Akimichi Chouza (S)': 'Akimichi Chouza',
    'Hyuuga Hiashi (S)': 'Hyuuga Hiashi',
    'Yamanaka Fu (S)': 'Yamanaka Fu',
    'Aburame Torune (S)': 'Aburame Torune',
    'Shimura Danzo (S)': 'Shimura Danzo',
    'Raikage (S)': 'Ay (S)',
    'Susanoo Sasuke (S)': 'Mangekyou Sasuke (S)',
    'Mizukage (S)': 'Terumi Mei (S)',
    'Tsuchikage (S)': 'Ohnoki (S)',
    'Uchiha Shisui (S)': 'Uchiha Shisui',
    'True Form Sasori': 'Sasori of the Red Sand (S)',
    'Susanoo Itachi (S)': 'Uchiha Itachi (S)',
    'Nagato (S)': 'Uzumaki Nagato (S)',
    'White Zetsu (S)': 'Zetsu (S)',
    'Masked Man': 'Uchiha Obito',
    'Shinobi Alliance Naruto (S)': 'Sennin Naruto (S)',
    'Shinobi Alliance Sakura (S)': 'Haruno Sakura (S)',
    'Shinobi Alliance Sai (S)': 'Sai',
    'Shinobi Alliance Kakashi (S)': 'Hatake Kakashi (S)',
    'Shinobi Alliance Shikamaru (S)': 'Nara Shikamaru (S)',
    'Shinobi Alliance Chouji (S)': 'Akimichi Chouji (S)',
    'Shinobi Alliance Shino (S)': 'Aburame Shino (S)',
    'Shinobi Alliance Ino (S)': 'Yamanaka Ino (S)',
    'Shinobi Alliance Hinata (S)': 'Hyuuga Hinata (S)',
    'Shinobi Alliance Kiba (S)': 'Inuzuka Kiba (S)',
    'Shinobi Alliance Gaara (S)': 'Kazekage Gaara (S)',
    'Shinobi Alliance Temari (S)': 'Temari (S)',
    'Shinobi Alliance Kankuro (S)': 'Kankuro (S)',
    'Edo Tensei Itachi (S)': 'Uchiha Itachi (S)',
    'Edo Tensei Muu (S)': 'ET Nidaime Tsuchikage (S)',
    'Edo Tensei Sakon (S)': 'Edo Tensei Sakon and Ukon (S)',
    'Edo Tensei Fuu (S)': 'Fuu (S)',
    'Edo Tensei Yugito (S)': 'Nii Yugito (S)',
    'Edo Tensei Yagura (S)': 'Karatachi Yagura'
};

const PRE_PREFIXED_SKILLS = [
    'Rasenshuriken', 'Claw Swipe', 'Fire Release Fire Ball', 'Mind Body Switch'
];

export function getCharacterImageUrl(id: string, name: string): string {
    return `${BASE_PATH}/assets/nawiki/characters/${id.toLowerCase()}.png`;
}

export function handleCharacterImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, id: string, name: string) {
    const target = e.target as HTMLImageElement;
    const currentSrc = target.src;

    if (currentSrc.endsWith('.png')) {
        // Try ID-based .jpg
        target.src = currentSrc.replace('.png', '.jpg');
    } else if (currentSrc.includes(id.toLowerCase())) {
        // If ID-based JPEG failed, try name-based lookup
        const finalName = CHARACTER_NAME_MAPPING[name] || name;
        target.src = `${BASE_PATH}/assets/nawiki/characters/${finalName}.jpg`;
    } else {
        // Final fallback: hide
        target.onerror = null;
        target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        target.style.opacity = '0';
    }
}

export function getSkillImageUrl(skillId: string, charId: string, skillName: string, charName?: string): string {
    const skillPart = skillId.startsWith(charId)
        ? skillId.slice(charId.length + 1)
        : skillId;

    const finalName = `${charId}__${skillPart}`;
    return `${BASE_PATH}/assets/nawiki/skills/${finalName}.png`;
}

export function handleSkillImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, skillId: string, charId: string, skillName: string, charName?: string) {
    const target = e.target as HTMLImageElement;
    const currentSrc = target.src;

    if (currentSrc.endsWith('.png')) {
        // Try ID-based .jpg
        target.src = currentSrc.replace('.png', '.jpg');
    } else if (currentSrc.includes('__')) {
        // Try name-based lookup (old standard)
        let finalName = skillName;
        if (charName && PRE_PREFIXED_SKILLS.some(s => skillName.includes(s))) {
            finalName = `${charName} - ${skillName}`;
        }
        target.src = `${BASE_PATH}/assets/nawiki/skills/${finalName}.jpg`;
    } else {
        // Final fallback
        target.onerror = null;
        target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        target.style.opacity = '0';
    }
}

const CHAKRA_TYPES = ['Taijutsu', 'Ninjutsu', 'Genjutsu', 'Bloodline', 'Random'] as const;

export function getChakraTypes(char: Character): string[] {
    if (char.chakraTypes && char.chakraTypes.length > 0) return char.chakraTypes;
    // Legacy single type support
    // @ts-ignore
    if (char.chakraType) return [char.chakraType];

    // Deterministic fallback (1 to 3 types) based on ID/Name
    const len = (char.id?.length || char.name.length);
    const count = (len % 3) + 1; // 1, 2, or 3 types

    const types = [];
    for (let i = 0; i < count; i++) {
        const typeIndex = (len + i) % CHAKRA_TYPES.length;
        types.push(CHAKRA_TYPES[typeIndex]);
    }

    // Deduplicate just in case
    return Array.from(new Set(types));
}

/**
 * Parses description text with custom tags and returns React elements with styles.
 */
export function parseDescription(text: string, styles: any): React.ReactNode {
    if (!text) return null;

    // Use a regex to find all <Tag>Content</Tag> patterns
    const regex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Add preceding text
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const tag = match[1];
        const content = match[2];
        const className = styles[`desc${tag}`] || '';

        parts.push(
            <span key={match.index} className={className}>
                {content}
            </span>
        );

        lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts;
}

/**
 * Translates character names and titles from English to Portuguese.
 */
export function translateName(name: string): string {
    if (!name) return name;

    const translations: Record<string, string> = {
        'Young': 'Jovem',
        'Captain': 'Capitão',
        'Commander': 'Comandante',
        'Six Tails': 'Seis Caudas',
        'Four Tails': 'Quatro Caudas',
        'Three Tails': 'Três Caudas',
        'Five Tails': 'Cinco Caudas',
        'Seven Tails': 'Sete Caudas',
        'Eight Tails': 'Oito Caudas (Hachibi)',
        'Nine Tails': 'Nove Caudas (Kyuubi)',
        'Kyuubi': 'Kyuubi',
        'Demon Brothers': 'Irmãos Demônio',
        'Drunken': 'Punho Embriagado',
        'Cursed Seal': 'Marca da Maldição',
        'Butterfly': 'Borboleta',
        'of the Rain': 'da Chuva',
        'of the Red Sand': 'da Areia Vermelha',
        'Rehabilitated': 'Reabilitado',
        'Female': 'Feminino',
        'Path': 'Caminho',
        'Pein': 'Pain',
        'Shinobi War': 'Guerra Shinobi',
        'Body Double': 'Clone de Corpo',
        'Activation': 'Ativação',
        'Anbu': 'Anbu',
        'Team': 'Time',
        'Bonding': 'Vínculo',
        'Test': 'Teste',
        'Capture': 'Captura',
        'Search': 'Busca',
        'Cleanup': 'Limpeza',
        'Patrol': 'Patrulha',
        'Hunt': 'Caça'
    };

    let translated = name;

    // Handle order for specific cases like "Young Kushina" -> "Kushina Jovem"
    if (name.startsWith('Young ')) {
        const base = name.replace('Young ', '');
        return `${base} Jovem`;
    }
    if (name.startsWith('Anbu ')) {
        const base = name.replace('Anbu ', '');
        return `${base} Anbu`;
    }
    if (name.startsWith('Captain ')) {
        const base = name.replace('Captain ', '');
        return `Capitão ${base}`;
    }

    // Replace based on mapping
    Object.entries(translations).forEach(([eng, pt]) => {
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        translated = translated.replace(regex, pt);
    });

    return translated;
}

/**
 * General purpose translation for UI labels and data strings.
 */
export function translateUI(text: string): string {
    if (!text) return text;

    const uiMap: Record<string, string> = {
        'Mission': 'Missão',
        'Ranking': 'Ranking',
        'All': 'Todos',
        'Taijutsu': 'Taijutsu',
        'Ninjutsu': 'Ninjutsu',
        'Genjutsu': 'Genjutsu',
        'Bloodline': 'Linhagem',
        'Random': 'Aleatório',
        'AoE Damage': 'Dano em Área',
        'Chakra Steal': 'Roubo de Chakra',
        'Stun': 'Atordoamento',
        'Damage Over Time': 'Dano Contínuo',
        'Defense': 'Defesa',
        'Buffer': 'Suporte',
        'A-Rank Missions': 'Missões Rank-A',
        'B-Rank Missions': 'Missões Rank-B',
        'C-Rank Missions': 'Missões Rank-C',
        'D-Rank Missions': 'Missões Rank-D',
        'S-Rank Missions': 'Missões Rank-S',
        'D-and-C-Rank Missions': 'Missões Rank-D e C',
        'Shippuuden Missions': 'Missões Shippuuden',
        'Tales Missions': 'Contos Ninja',
        'Five Kage Summit Missions': 'Reunião dos Cinco Kage',
        'Fourth Shinobi World War Pt. 1 Missions': 'Quarta Guerra Ninja Pt. 1',
        'Genin': 'Genin',
        'Chunnin': 'Chunin',
        'Jounnin': 'Jonin',
        'Sannin': 'Sannin',
        'Hokage': 'Hokage',
        'Missing-Nin': 'Nukenin',
        'Akatsuki': 'Akatsuki'
    };

    return uiMap[text] || translateName(text);
}
