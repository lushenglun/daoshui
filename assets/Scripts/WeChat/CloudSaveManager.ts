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
    private static getCurrentOpenId(data = StorageManager.load()): string {
        return data.social?.openId || StorageManager.getActiveUserId();
    }

    private static getShadowKey(openId: string): string {
        return openId ? `${CLOUD_SHADOW_KEY}_${openId}` : CLOUD_SHADOW_KEY;
    }

    static async syncOnLogin(): Promise<CloudSyncResult> {
        const remote = await this.downloadSave();
        const local = StorageManager.load();

        if (!remote) {
            await this.uploadSave(local);
            return { success: true, source: 'none', message: 'cloud save empty, initialized from current runtime save.' };
        }

        if (GAME_CONFIG.SAVE.CLOUD_AUTHORITATIVE) {
            remote.social.openId = this.getCurrentOpenId(local);
            remote.social.cloudSyncedAt = Date.now();
            StorageManager.replaceWith(remote);
            return { success: true, source: WXAPI.available ? 'wechat' : 'shadow', message: 'cloud save loaded as authoritative runtime save.' };
        }

        const merged = this.mergeSaveData(local, remote);
        StorageManager.save(merged);
        await this.uploadSave(merged);
        return { success: true, source: WXAPI.available ? 'wechat' : 'shadow', message: 'cloud save merged into runtime save.' };
    }

    static async uploadSave(data = StorageManager.load()): Promise<CloudSyncResult> {
        const openId = this.getCurrentOpenId(data);
        data.social.openId = openId;
        const payload = JSON.stringify(data);
        if (!GAME_CONFIG.SAVE.CLOUD_AUTHORITATIVE || !openId) {
            sys.localStorage.setItem(this.getShadowKey(openId), payload);
        }

        const cloud = WXAPI.getCloud();
        if (!cloud?.database) {
            console.log('[CloudSaveManager] uploadSave: no cloud db, shadow only');
            return {
                success: true,
                source: 'shadow',
                message: GAME_CONFIG.SAVE.CLOUD_AUTHORITATIVE ? 'cloud unavailable; runtime save not persisted locally.' : 'saved to local cloud-shadow data.',
            };
        }
        if (!openId) {
            console.warn('[CloudSaveManager] uploadSave: openid missing, skip cloud db write');
            return {
                success: true,
                source: 'shadow',
                message: GAME_CONFIG.SAVE.CLOUD_AUTHORITATIVE ? 'openid missing; runtime save not persisted locally.' : 'saved locally; cloud sync waits for user identity.',
            };
        }

        console.log('[CloudSaveManager] uploadSave: writing to cloud db, bytes:', payload.length, 'openid:', openId);
        try {
            const db = cloud.database();
            const col = db.collection('kv_saves');
            const key = CLOUD_SAVE_KEY;
            const record = { key, value: payload, updatedAt: Date.now(), ownerOpenId: openId };

            // User isolation must be enforced by collection permissions: creator-only read/write.
            // Keep the client query on business key only to avoid trusting client-provided identity.
            const queryRes = await col.where({ key }).limit(1).get();
            if (queryRes.data.length > 0) {
                console.log('[CloudSaveManager] uploadSave: updating existing record');
                await col.doc(queryRes.data[0]._id).update({ data: record });
            } else {
                console.log('[CloudSaveManager] uploadSave: adding new record');
                await col.add({ data: record });
            }

            console.log('[CloudSaveManager] uploadSave: cloud save ok');
            return { success: true, source: 'wechat', message: 'cloud save uploaded.' };
        } catch (error) {
            console.warn('[CloudSaveManager] direct db write failed.', error);
            return {
                success: true,
                source: 'shadow',
                message: GAME_CONFIG.SAVE.CLOUD_AUTHORITATIVE ? 'cloud write failed; runtime save not persisted locally.' : 'saved to local cloud-shadow data.',
            };
        }
    }

    static async downloadSave(): Promise<PlayerSaveData | null> {
        console.log('[CloudSaveManager] downloadSave: checking cloud db');
        const cloud = WXAPI.getCloud();
        if (!cloud?.database) {
            console.log('[CloudSaveManager] downloadSave: no cloud db');
            return null;
        }

        const openId = this.getCurrentOpenId();
        if (!openId) {
            console.warn('[CloudSaveManager] downloadSave: openid missing, skip cloud db read');
            return null;
        }

        try {
            const db = cloud.database();
            const col = db.collection('kv_saves');
            const key = CLOUD_SAVE_KEY;

            // User isolation must be enforced by collection permissions: creator-only read/write.
            const res = await col.where({ key }).limit(1).get();
            console.log('[CloudSaveManager] downloadSave: query result count:', res.data.length, 'openid:', openId);
            if (!res.data.length) {
                return null;
            }

            const value = res.data[0].value;
            if (typeof value === 'string') {
                const parsed = StorageManager.normalizeSaveData(JSON.parse(value) as PlayerSaveData);
                parsed.social.openId = openId;
                return parsed;
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
        const openId = this.getCurrentOpenId(data);
        if (!openId) {
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
        local = StorageManager.normalizeSaveData(local);
        remote = StorageManager.normalizeSaveData(remote);
        const openId = this.getCurrentOpenId(local);
        const useRemote = remote.lastSaveTime > local.lastSaveTime;
        const base: PlayerSaveData = StorageManager.normalizeSaveData(JSON.parse(JSON.stringify(local)) as PlayerSaveData);

        const completedSet = new Set([...local.completedLevels, ...remote.completedLevels]);
        base.completedLevels = Array.from(completedSet).sort((a, b) => a - b);

        base.levelStars = { ...local.levelStars };
        Object.keys(remote.levelStars).forEach((key) => {
            const k = Number(key);
            base.levelStars[k] = Math.max(base.levelStars[k] ?? 0, remote.levelStars[k] ?? 0);
        });

        base.coins = Math.max(local.coins, remote.coins);
        base.diamonds = Math.max(local.diamonds, remote.diamonds);
        base.currentLevel = Math.max(local.currentLevel, remote.currentLevel);

        base.statistics = {
            totalPlayTime: Math.max(local.statistics.totalPlayTime, remote.statistics.totalPlayTime),
            totalLevelsCompleted: Math.max(local.statistics.totalLevelsCompleted, remote.statistics.totalLevelsCompleted),
            totalAdsWatched: Math.max(local.statistics.totalAdsWatched, remote.statistics.totalAdsWatched),
            bestUndoStreak: Math.max(local.statistics.bestUndoStreak, remote.statistics.bestUndoStreak),
        };

        base.unlockedThemes = Array.from(new Set([...(local.unlockedThemes ?? []), ...(remote.unlockedThemes ?? [])]));
        const achievementIds = new Set([
            ...Object.keys(local.achievements ?? {}),
            ...Object.keys(remote.achievements ?? {}),
        ]);
        achievementIds.forEach((id) => {
            const localProgress = local.achievements[id];
            const remoteProgress = remote.achievements[id];
            if (!localProgress && remoteProgress) {
                base.achievements[id] = { ...remoteProgress };
                return;
            }
            if (localProgress && !remoteProgress) {
                base.achievements[id] = { ...localProgress };
                return;
            }
            if (!localProgress || !remoteProgress) {
                return;
            }
            base.achievements[id] = {
                current: Math.max(localProgress.current, remoteProgress.current),
                completed: localProgress.completed || remoteProgress.completed,
                claimed: localProgress.claimed || remoteProgress.claimed,
                completedAt: Math.max(localProgress.completedAt, remoteProgress.completedAt),
            };
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

        if (useRemote) {
            base.settings = { ...remote.settings };
            base.dailyCheckIn = { ...remote.dailyCheckIn };
            base.flags = { ...remote.flags };
            base.social = { ...remote.social };
        }

        base.social.openId = openId;
        base.social.cloudSyncedAt = Date.now();
        base.lastSaveTime = Date.now();
        return StorageManager.normalizeSaveData(base);
    }

    static async uploadAdRecord(scene: string, adType: 'rewarded' | 'interstitial', data = StorageManager.load()): Promise<void> {
        const cloud = WXAPI.getCloud();
        if (!cloud?.database) {
            return;
        }
        const openId = this.getCurrentOpenId(data);
        if (!openId) {
            return;
        }

        try {
            const db = cloud.database();
            await db.collection('ad_records').add({
                data: {
                    scene,
                    adType,
                    rewardedToday: data.adStats.rewardedToday,
                    interstitialToday: data.adStats.interstitialToday,
                    totalAdsWatched: data.statistics.totalAdsWatched,
                    ownerOpenId: openId,
                    createdAt: Date.now(),
                },
            });
        } catch (error) {
            console.warn('[CloudSaveManager] upload ad record failed.', error);
        }
    }
}
