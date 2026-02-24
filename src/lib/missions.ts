import missionsData from '../../public/assets/nawiki/missions_out/missions_out.json';
import { MissionSession } from './types';

// Import and type-cast the missions data
export const ALL_MISSION_SESSIONS: MissionSession[] = (missionsData as any).sessions || [];

// Flattened list of all missions for easy access
export const ALL_DETAILED_MISSIONS = ALL_MISSION_SESSIONS.flatMap(session => session.missions);

// Helper to get mission image URL
export function getMissionImageUrl(mission: any, type: "mission" | "reward" | string): string {
    const t = String(type).trim().toLowerCase();
    const normalized: "mission" | "reward" = t.startsWith("rew") ? "reward" : "mission";
    let filePath = "";
    if (type == "reward") {
        filePath = "assets/nawiki/characters/" + mission.reward + ".jpg";
    } else {
        filePath = mission?.images?.[normalized]?.file;
    }

    if (filePath) {
        filePath = filePath.replace(/^public\//, "").replace(/^\/+/, "");

        if (filePath.startsWith("missions_out/")) {
            return `/assets/nawiki/${filePath}`;
        }
        return `/${filePath}`;
    }

    if (normalized === "mission" && mission?.card?.imageUrl) return mission.card.imageUrl;
    return "";
}

// Hardcoded map for session images since the scraper didn't include some exact filenames or extensions
const SESSION_IMAGE_MAP: Record<string, string> = {
    "a-rank-missions": "session__a-rank-missions__.jpg",
    "b-rank-missions": "session__b-rank-missions__.jpg",
    "d-and-c-rank-missions": "session__d-and-c-rank-missions__.jpg",
    "five-kage-summit-missions": "session__five-kage-summit-missions__.png",
    "fourth-shinobi-world-war-pt.-1-missions": "session__fourth-shinobi-world-war-pt-1-missions__.png",
    "s-rank-missions": "session__s-rank-missions__.jpg",
    "shippuuden-missions": "session__shippuuden-missions__.jpg",
    "tales-missions": "session__tales-missions__.png"
};

// Helper to get session image URL
export function getSessionImageUrl(session: any): string {
    if (!session.image?.file) {
        // Fallback to exact local mapped string
        if (session.id && SESSION_IMAGE_MAP[session.id]) {
            return `/assets/nawiki/missions_out/images/${SESSION_IMAGE_MAP[session.id]}`;
        }
        return '';
    }

    let filePath = session.image.file;
    filePath = filePath.replace(/^public\//, "").replace(/^\/+/, "");
    return `/${filePath}`;
}

// Helper to check if mission is completed
export function isMissionCompleted(mission: any): boolean {
    if (typeof mission.card?.isCompleted === "boolean") return mission.card.isCompleted;

    const goals = mission.goals ?? [];
    return goals.length > 0 && goals.every((g: any) => g?.isCompleted);
}

// Helper to count completed goals
export function getCompletedGoalsCount(goals: any[]):
    | { completed: number; total: number }
    | null {
    if (!Array.isArray(goals) || goals.length === 0) return null;

    const completed = goals.filter(g => g?.isCompleted).length;
    return { completed, total: goals.length };
}