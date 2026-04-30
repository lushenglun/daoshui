export enum GameState {
    LOADING = 'LOADING',
    MAIN_MENU = 'MAIN_MENU',
    LEVEL_SELECT = 'LEVEL_SELECT',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE',
}

export interface PourAction {
    fromIndex: number;
    toIndex: number;
    colorId: number;
    count: number;
    beforeState: number[][];
    afterState: number[][];
}

export interface PlayerSaveData {
    version: number;
    lastSaveTime: number;
    currentLevel: number;
    completedLevels: number[];
    levelStars: Record<number, number>;
    coins: number;
    diamonds: number;
    unlockedThemes: number[];
    settings: {
        musicEnabled: boolean;
        soundEnabled: boolean;
        vibrationEnabled: boolean;
    };
    dailyCheckIn: {
        lastCheckInDate: string;
        consecutiveDays: number;
        checkInHistory: boolean[];
    };
    statistics: {
        totalPlayTime: number;
        totalLevelsCompleted: number;
        totalAdsWatched: number;
        bestUndoStreak: number;
    };
}

export function createDefaultSaveData(): PlayerSaveData {
    return {
        version: 1,
        lastSaveTime: Date.now(),
        currentLevel: 1,
        completedLevels: [],
        levelStars: {},
        coins: 0,
        diamonds: 0,
        unlockedThemes: [1],
        settings: {
            musicEnabled: true,
            soundEnabled: true,
            vibrationEnabled: true,
        },
        dailyCheckIn: {
            lastCheckInDate: '',
            consecutiveDays: 0,
            checkInHistory: [false, false, false, false, false, false, false],
        },
        statistics: {
            totalPlayTime: 0,
            totalLevelsCompleted: 0,
            totalAdsWatched: 0,
            bestUndoStreak: 0,
        },
    };
}

