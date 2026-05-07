import { sys } from 'cc';
import { GAME_CONFIG, getLevelRewardConfig } from '../Data/GameConfig';
import { createDefaultSaveData, PlayerSaveData } from '../Data/GameData';
import { ACHIEVEMENT_CONFIGS } from '../Data/V05Config';

export class StorageManager {
    private static data: PlayerSaveData | null = null;

    /** 深度合并对象，确保嵌套属性不会被完全覆盖 */
    private static deepMerge<T>(target: T, source: Partial<T>): T {
        const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
        const sourceRecord = source as Record<string, unknown>;
        for (const key in sourceRecord) {
            if (sourceRecord[key] !== null && typeof sourceRecord[key] === 'object' && !Array.isArray(sourceRecord[key])) {
                result[key] = this.deepMerge(
                    (result[key] as Record<string, unknown>) ?? {},
                    sourceRecord[key] as Record<string, unknown>
                );
            } else if (sourceRecord[key] !== undefined) {
                result[key] = sourceRecord[key];
            }
        }
        return result as T;
    }

    static load(): PlayerSaveData {
        if (this.data) {
            return this.data;
        }

        const raw = sys.localStorage.getItem(GAME_CONFIG.SAVE.SAVE_KEY);
        if (!raw) {
            this.data = createDefaultSaveData();
            return this.data;
        }

        try {
            const parsed = JSON.parse(raw) as Partial<PlayerSaveData>;
            this.data = this.normalizeSaveData(this.deepMerge(createDefaultSaveData(), parsed));
        } catch (error) {
            console.warn('[StorageManager] save data is broken, reset to default.', error);
            this.data = createDefaultSaveData();
        }

        this.data = this.normalizeSaveData(this.data);
        return this.data;
    }

    static save(data = this.load()): void {
        data.lastSaveTime = Date.now();
        this.data = data;
        sys.localStorage.setItem(GAME_CONFIG.SAVE.SAVE_KEY, JSON.stringify(data));
    }

    static resetToDefault(): PlayerSaveData {
        const data = createDefaultSaveData();
        this.save(data);
        return data;
    }

    static replaceWith(data: PlayerSaveData): void {
        this.save(this.normalizeSaveData(this.deepMerge(createDefaultSaveData(), data)));
    }

    static mergeSaveData(local: PlayerSaveData, remote: PlayerSaveData): PlayerSaveData {
        local = this.normalizeSaveData(local);
        remote = this.normalizeSaveData(remote);
        const merged = this.normalizeSaveData(this.deepMerge(createDefaultSaveData(), local));
        const newerBase = remote.lastSaveTime > local.lastSaveTime ? remote : local;
        const base = this.deepMerge(merged, newerBase);

        base.currentLevel = Math.max(local.currentLevel, remote.currentLevel);
        base.coins = Math.max(local.coins, remote.coins);
        base.diamonds = Math.max(local.diamonds, remote.diamonds);
        base.completedLevels = Array.from(new Set([...local.completedLevels, ...remote.completedLevels])).sort((a, b) => a - b);
        base.levelStars = { ...local.levelStars };
        Object.keys(remote.levelStars).forEach((key) => {
            const levelId = Number(key);
            base.levelStars[levelId] = Math.max(base.levelStars[levelId] ?? 0, remote.levelStars[levelId] ?? 0);
        });
        base.statistics.totalLevelsCompleted = Math.max(local.statistics.totalLevelsCompleted, remote.statistics.totalLevelsCompleted, base.completedLevels.length);
        base.unlockedThemes = Array.from(new Set([...(local.unlockedThemes ?? []), ...(remote.unlockedThemes ?? [])]));
        Object.keys(remote.achievements ?? {}).forEach((id) => {
            const localProgress = local.achievements[id];
            const remoteProgress = remote.achievements[id];
            if (!localProgress || !remoteProgress) {
                return;
            }
            base.achievements[id] = remoteProgress.current > localProgress.current ? { ...remoteProgress } : { ...localProgress };
            base.achievements[id].completed = localProgress.completed || remoteProgress.completed;
            base.achievements[id].claimed = localProgress.claimed || remoteProgress.claimed;
            base.achievements[id].completedAt = Math.max(localProgress.completedAt, remoteProgress.completedAt);
        });
        base.dailyChallenge.bestStepsByDate = { ...local.dailyChallenge.bestStepsByDate };
        Object.keys(remote.dailyChallenge.bestStepsByDate ?? {}).forEach((date) => {
            const localSteps = base.dailyChallenge.bestStepsByDate[date] ?? 0;
            const remoteSteps = remote.dailyChallenge.bestStepsByDate[date] ?? 0;
            base.dailyChallenge.bestStepsByDate[date] = localSteps > 0 && remoteSteps > 0 ? Math.min(localSteps, remoteSteps) : Math.max(localSteps, remoteSteps);
        });
        base.dailyChallenge.completedDates = Array.from(new Set([...(local.dailyChallenge.completedDates ?? []), ...(remote.dailyChallenge.completedDates ?? [])]));
        base.dailyChallenge.totalCompletions = Math.max(local.dailyChallenge.totalCompletions, remote.dailyChallenge.totalCompletions);
        base.dailyChallenge.consecutiveDays = Math.max(local.dailyChallenge.consecutiveDays, remote.dailyChallenge.consecutiveDays);
        base.social.cloudSyncedAt = Date.now();
        return this.normalizeSaveData(base);
    }

    static normalizeSaveData(data: PlayerSaveData): PlayerSaveData {
        const defaultData = createDefaultSaveData();
        const rawThemes = data.unlockedThemes as unknown[];
        const themeMap: Record<string, string> = {
            '1': 'default',
            '2': 'candy',
            '3': 'ocean',
            '4': 'autumn',
            '5': 'neon',
        };
        const themes = Array.isArray(rawThemes)
            ? rawThemes.map((theme) => themeMap[String(theme)] ?? String(theme))
            : ['default'];

        data.unlockedThemes = Array.from(new Set(['default', ...themes]));
        data.currentTheme = data.currentTheme || data.currentThemeId || 'default';
        data.currentThemeId = data.currentThemeId || data.currentTheme;
        if (data.unlockedThemes.indexOf(data.currentTheme) < 0) {
            data.currentTheme = 'default';
            data.currentThemeId = 'default';
        }

        data.dailyCheckIn = {
            ...defaultData.dailyCheckIn,
            ...data.dailyCheckIn,
            checkInHistory: Array.isArray(data.dailyCheckIn?.checkInHistory)
                ? data.dailyCheckIn.checkInHistory.slice(0, 7).concat(defaultData.dailyCheckIn.checkInHistory).slice(0, 7)
                : [...defaultData.dailyCheckIn.checkInHistory],
        };

        data.achievements = data.achievements || {};
        ACHIEVEMENT_CONFIGS.forEach((config) => {
            data.achievements[config.id] = {
                ...defaultData.achievements[config.id],
                ...(data.achievements[config.id] ?? {}),
            };
        });

        data.dailyChallenge = {
            ...defaultData.dailyChallenge,
            ...data.dailyChallenge,
            bestStepsByDate: { ...(data.dailyChallenge?.bestStepsByDate ?? {}) },
            completedDates: Array.isArray(data.dailyChallenge?.completedDates) ? data.dailyChallenge.completedDates : [],
        };

        return data;
    }

    static addCoins(amount: number): PlayerSaveData {
        const data = this.resetAdStatsIfNeeded();
        data.coins = Math.min(GAME_CONFIG.ECONOMY.COIN_CAP, data.coins + amount);
        this.save(data);
        return data;
    }

    static spendCoins(amount: number): boolean {
        const data = this.load();
        if (data.coins < amount) {
            return false;
        }
        data.coins = Math.max(0, data.coins - amount);
        this.save(data);
        return true;
    }

    static addDiamonds(amount: number): PlayerSaveData {
        const data = this.load();
        data.diamonds = Math.min(GAME_CONFIG.ECONOMY.DIAMOND_CAP, data.diamonds + amount);
        this.save(data);
        return data;
    }

    static spendDiamonds(amount: number): boolean {
        const data = this.load();
        if (data.diamonds < amount) {
            return false;
        }
        data.diamonds = Math.max(0, data.diamonds - amount);
        this.save(data);
        return true;
    }

    static unlockTheme(themeId: string): PlayerSaveData {
        const data = this.load();
        if (data.unlockedThemes.indexOf(themeId) < 0) {
            data.unlockedThemes.push(themeId);
        }
        this.save(data);
        return data;
    }

    static setCurrentTheme(themeId: string): PlayerSaveData {
        const data = this.load();
        if (data.unlockedThemes.indexOf(themeId) < 0) {
            data.unlockedThemes.push(themeId);
        }
        data.currentTheme = themeId;
        data.currentThemeId = themeId;
        this.save(data);
        return data;
    }

    static resetAdStatsIfNeeded(): PlayerSaveData {
        const data = this.load();
        const today = this.getLocalDateKey();
        if (data.adStats.lastResetDate !== today) {
            data.adStats.rewardedToday = 0;
            data.adStats.interstitialToday = 0;
            data.adStats.lastResetDate = today;
            this.save(data);
        }
        return data;
    }

    static getTotalStars(data = this.load()): number {
        return Object.keys(data.levelStars).reduce((sum, key) => sum + (data.levelStars[Number(key)] ?? 0), 0);
    }

    static getDebugSummary(): string {
        const data = this.load();
        const threeStars = Object.keys(data.levelStars).filter((key) => data.levelStars[Number(key)] >= 3).length;
        return [
            `存档键: ${GAME_CONFIG.SAVE.SAVE_KEY}`,
            `当前解锁关卡: ${data.currentLevel}`,
            `已通关: ${data.completedLevels.length}`,
            `三星: ${threeStars}`,
            `金币: ${data.coins}`,
            `钻石: ${data.diamonds}`,
            `连续签到: ${data.dailyCheckIn.consecutiveDays}天`,
            `上次签到: ${data.dailyCheckIn.lastCheckInDate || '无'}`,
            `总分享: ${data.social.totalShares}`,
            `云同步: ${data.social.cloudSyncedAt ? new Date(data.social.cloudSyncedAt).toLocaleString() : '未同步'}`,
        ].join('\n');
    }

    static completeLevel(levelId: number, steps: number, minSteps: number): { stars: number; coins: number } {
        const data = this.load();
        const stars = steps <= minSteps + GAME_CONFIG.LEVEL.THREE_STAR_MARGIN
            ? 3
            : steps <= minSteps + GAME_CONFIG.LEVEL.TWO_STAR_MARGIN
                ? 2
                : 1;
        const reward = getLevelRewardConfig(levelId);
        const coins = reward.baseCoins + reward.starBonus[stars - 1];

        if (data.completedLevels.indexOf(levelId) < 0) {
            data.completedLevels.push(levelId);
            data.statistics.totalLevelsCompleted += 1;
        }

        data.levelStars[levelId] = Math.max(data.levelStars[levelId] ?? 0, stars);
        data.currentLevel = Math.max(data.currentLevel, levelId + 1);
        data.coins = Math.min(GAME_CONFIG.ECONOMY.COIN_CAP, data.coins + coins);
        this.save(data);

        return { stars, coins };
    }

    private static getLocalDateKey(): string {
        const date = new Date();
        const year = date.getFullYear();
        const rawMonth = `${date.getMonth() + 1}`;
        const rawDay = `${date.getDate()}`;
        const month = rawMonth.length === 1 ? `0${rawMonth}` : rawMonth;
        const day = rawDay.length === 1 ? `0${rawDay}` : rawDay;
        return `${year}-${month}-${day}`;
    }
}
