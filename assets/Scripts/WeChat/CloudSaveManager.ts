import { sys } from 'cc';
import { GAME_CONFIG } from '../Data/GameConfig';
import { PlayerSaveData } from '../Data/GameData';
import { StorageManager } from '../Core/StorageManager';
import { WXAPI } from './WXAPI';

const CLOUD_SAVE_KEY = `${GAME_CONFIG.SAVE.SAVE_KEY}_cloud`;
const CLOUD_SHADOW_KEY = `${GAME_CONFIG.SAVE.SAVE_KEY}_cloud_shadow`;

export interface CloudSyncResult {
    success: boolean;
    source: 'wechat' | 'shadow' | 'none';
    message: string;
}

export class CloudSaveManager {
    static async syncOnLogin(): Promise<CloudSyncResult> {
        const remote = await this.downloadSave();
        const local = StorageManager.load();

        if (!remote) {
            await this.uploadSave(local);
            return { success: true, source: 'none', message: '云端暂无存档，已用本地存档初始化。' };
        }

        const merged = this.mergeSaveData(local, remote);
        StorageManager.save(merged);
        await this.uploadSave(merged);
        return { success: true, source: WXAPI.available ? 'wechat' : 'shadow', message: '云存档已合并到本地。' };
    }

    static async uploadSave(data = StorageManager.load()): Promise<CloudSyncResult> {
        const payload = JSON.stringify(data);
        sys.localStorage.setItem(CLOUD_SHADOW_KEY, payload);

        const cloud = WXAPI.getCloud();
        if (!cloud?.database) {
            console.log('[CloudSaveManager] uploadSave: no cloud db, shadow only');
            return { success: true, source: 'shadow', message: '已写入本地云存档影子数据。' };
        }

        console.log('[CloudSaveManager] uploadSave: writing to cloud db, bytes:', payload.length);
        try {
            const db = cloud.database();
            const col = db.collection('kv_saves');
            const key = CLOUD_SAVE_KEY;
            const record = { key, value: payload, updatedAt: Date.now() };

            // 查询当前用户是否已有存档（系统自动按 _openid 过滤）
            const queryRes = await col.where({ key }).limit(1).get();
            if (queryRes.data.length > 0) {
                console.log('[CloudSaveManager] uploadSave: updating existing record');
                await col.doc(queryRes.data[0]._id).update({ data: record });
            } else {
                console.log('[CloudSaveManager] uploadSave: adding new record');
                await col.add({ data: record });
            }

            console.log('[CloudSaveManager] uploadSave: cloud save ok');
            return { success: true, source: 'wechat', message: '云存档写入成功。' };
        } catch (error) {
            console.warn('[CloudSaveManager] direct db write failed, shadow save kept.', error);
            return { success: true, source: 'shadow', message: '已写入本地云存档影子数据。' };
        }
    }

    static async downloadSave(): Promise<PlayerSaveData | null> {
        console.log('[CloudSaveManager] downloadSave: checking cloud db');
        const cloud = WXAPI.getCloud();
        if (!cloud?.database) {
            console.log('[CloudSaveManager] downloadSave: no cloud db');
            return null;
        }

        try {
            const db = cloud.database();
            const col = db.collection('kv_saves');
            const key = CLOUD_SAVE_KEY;

            // 查询当前用户的存档（系统自动按 _openid 过滤）
            const res = await col.where({ key }).limit(1).get();
            console.log('[CloudSaveManager] downloadSave: query result count:', res.data.length);
            if (!res.data.length) {
                return null;
            }

            const value = res.data[0].value;
            if (typeof value === 'string') {
                return JSON.parse(value) as PlayerSaveData;
            }
            return null;
        } catch (error) {
            console.warn('[CloudSaveManager] direct db read failed.', error);
            return null;
        }
    }

    static async uploadRankFields(data = StorageManager.load()): Promise<void> {
        const cloud = WXAPI.getCloud();
        if (!cloud?.database) {
            return;
        }

        try {
            const db = cloud.database();
            const col = db.collection('rank_data');
            const totalStars = Object.keys(data.levelStars).reduce((sum, key) => sum + (data.levelStars[Number(key)] ?? 0), 0);
            const rankData = {
                totalStars,
                currentLevel: data.currentLevel,
                completedLevels: data.completedLevels.length,
                updatedAt: Date.now(),
            };

            const queryRes = await col.where({}).limit(1).get();
            if (queryRes.data.length > 0) {
                await col.doc(queryRes.data[0]._id).update({ data: rankData });
            } else {
                await col.add({ data: rankData });
            }
        } catch (error) {
            console.warn('[CloudSaveManager] upload rank failed.', error);
        }
    }

    private static mergeSaveData(local: PlayerSaveData, remote: PlayerSaveData): PlayerSaveData {
        const useRemote = remote.lastSaveTime > local.lastSaveTime;
        const base: PlayerSaveData = useRemote
            ? JSON.parse(JSON.stringify(remote))
            : JSON.parse(JSON.stringify(local));

        // 合并 completedLevels：取并集
        const completedSet = new Set([...local.completedLevels, ...remote.completedLevels]);
        base.completedLevels = Array.from(completedSet).sort((a, b) => a - b);

        // 合并 levelStars：取最大值
        base.levelStars = { ...local.levelStars };
        Object.keys(remote.levelStars).forEach((key) => {
            const k = Number(key);
            base.levelStars[k] = Math.max(base.levelStars[k] ?? 0, remote.levelStars[k] ?? 0);
        });

        // 取较大值
        base.coins = Math.max(local.coins, remote.coins);
        base.diamonds = Math.max(local.diamonds, remote.diamonds);
        base.currentLevel = Math.max(local.currentLevel, remote.currentLevel);

        // 统计取大值
        base.statistics = {
            totalPlayTime: Math.max(local.statistics.totalPlayTime, remote.statistics.totalPlayTime),
            totalLevelsCompleted: Math.max(local.statistics.totalLevelsCompleted, remote.statistics.totalLevelsCompleted),
            totalAdsWatched: Math.max(local.statistics.totalAdsWatched, remote.statistics.totalAdsWatched),
            bestUndoStreak: Math.max(local.statistics.bestUndoStreak, remote.statistics.bestUndoStreak),
        };

        // 若远程较新，覆盖设置/签到/社交/标记
        if (useRemote) {
            base.settings = { ...remote.settings };
            base.dailyCheckIn = { ...remote.dailyCheckIn };
            base.flags = { ...remote.flags };
            base.social = { ...remote.social };
        }

        base.lastSaveTime = Date.now();
        return base;
    }
}
