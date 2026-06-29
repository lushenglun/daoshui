export enum GameState {
    LOADING = 'LOADING',
    MAIN_MENU = 'MAIN_MENU',
    LEVEL_SELECT = 'LEVEL_SELECT',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    SETTINGS = 'SETTINGS',
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
    lastPlayedLevel: number;
    completedLevels: number[];
    levelStars: Record<number, number>;
    coins: number;
    diamonds: number;
    unlockedThemes: string[];
    currentTheme: string;
    currentThemeId: string;
    settings: {
        musicEnabled: boolean;
        soundEnabled: boolean;
        vibrationEnabled: boolean;
    };
    dailyCheckIn: {
        lastCheckInDate: string;
        consecutiveDays: number;
        checkInHistory: boolean[];
        makeupCountThisWeek: number;
        lastMakeupWeek: string;
    };
    achievements: Record<string, AchievementProgress>;
    dailyChallenge: {
        lastChallengeDate: string;
        bestStepsByDate: Record<string, number>;
        completedDates: string[];
        consecutiveDays: number;
        totalCompletions: number;
    };
    social: {
        loginCode: string;
        openId: string;
        lastLoginTime: number;
        lastLoginError: string;
        cloudSyncedAt: number;
        lastShareDate: string;
        dailyShareCount: number;
        totalShares: number;
    };
    adStats: {
        rewardedToday: number;
        interstitialToday: number;
        lastRewardedTime: number;
        lastInterstitialTime: number;
        lastResetDate: string;
    };
    flags: {
        hasShownAgeTip: boolean;
    };
    statistics: {
        totalPlayTime: number;
        totalLevelsCompleted: number;
        totalAdsWatched: number;
        bestUndoStreak: number;
    };
}

export interface AchievementProgress {
    current: number;
    completed: boolean;
    claimed: boolean;
    completedAt: number;
}

export function createDefaultSaveData(): PlayerSaveData {
    return {
        version: 1,
        lastSaveTime: Date.now(),
        currentLevel: 1,
        lastPlayedLevel: 1,
        completedLevels: [],
        levelStars: {},
        coins: 0,
        diamonds: 0,
        unlockedThemes: ['default'],
        currentTheme: 'default',
        currentThemeId: 'default',
        settings: {
            musicEnabled: true,
            soundEnabled: true,
            vibrationEnabled: true,
        },
        dailyCheckIn: {
            lastCheckInDate: '',
            consecutiveDays: 0,
            checkInHistory: [false, false, false, false, false, false, false],
            makeupCountThisWeek: 0,
            lastMakeupWeek: '',
        },
        achievements: {
            complete_10: { current: 0, completed: false, claimed: false, completedAt: 0 },
            complete_100: { current: 0, completed: false, claimed: false, completedAt: 0 },
            complete_500: { current: 0, completed: false, claimed: false, completedAt: 0 },
            three_stars_100: { current: 0, completed: false, claimed: false, completedAt: 0 },
            no_hint_50: { current: 0, completed: false, claimed: false, completedAt: 0 },
            undo_master: { current: 0, completed: false, claimed: false, completedAt: 0 },
            ad_watcher_50: { current: 0, completed: false, claimed: false, completedAt: 0 },
            share_20: { current: 0, completed: false, claimed: false, completedAt: 0 },
            daily_challenge_7: { current: 0, completed: false, claimed: false, completedAt: 0 },
            speed_run: { current: 0, completed: false, claimed: false, completedAt: 0 },
        },
        dailyChallenge: {
            lastChallengeDate: '',
            bestStepsByDate: {},
            completedDates: [],
            consecutiveDays: 0,
            totalCompletions: 0,
        },
        social: {
            loginCode: '',
            openId: '',
            lastLoginTime: 0,
            lastLoginError: '',
            cloudSyncedAt: 0,
            lastShareDate: '',
            dailyShareCount: 0,
            totalShares: 0,
        },
        adStats: {
            rewardedToday: 0,
            interstitialToday: 0,
            lastRewardedTime: 0,
            lastInterstitialTime: 0,
            lastResetDate: '',
        },
        flags: {
            hasShownAgeTip: false,
        },
        statistics: {
            totalPlayTime: 0,
            totalLevelsCompleted: 0,
            totalAdsWatched: 0,
            bestUndoStreak: 0,
        },
    };
}
