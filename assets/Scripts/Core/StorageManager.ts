import { sys } from 'cc';
import { GAME_CONFIG, getLevelRewardConfig } from '../Data/GameConfig';
import { createDefaultSaveData, PlayerSaveData } from '../Data/GameData';

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
            this.data = this.deepMerge(createDefaultSaveData(), parsed);
        } catch (error) {
            console.warn('[StorageManager] save data is broken, reset to default.', error);
            this.data = createDefaultSaveData();
        }

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
}
