import { sys } from 'cc';
import { GAME_CONFIG } from '../Data/GameConfig';
import { PlayerSaveData } from '../Data/GameData';
import { StorageManager } from '../Core/StorageManager';
import { WXAPI } from './WXAPI';

const CLOUD_SAVE_KEY = `${GAME_CONFIG.SAVE.SAVE_KEY}_cloud`;
const CLOUD_SHADOW_KEY = `${GAME_CONFIG.SAVE.SAVE_KEY}_cloud_shadow`;
const LEGACY_CLOUD_SAVE_KEY = CLOUD_SAVE_KEY;

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

    private static normalizeOpenId(openId: string): string {
        return openId.replace(/[^a-zA-Z0-9_-]/g, '');
    }

    private static getCloudSaveKey(openId: string): string {
        const safeOpenId = this.normalizeOpenId(openId);
        return safeOpenId ? `${CLOUD_SAVE_KEY}_${safeOpenId}` : CLOUD_SAVE_KEY;
    }

    private static recordBelongsToOpenId(record: Record<string, unknown>, openId: string): boolean {
        if (!openId) {
            return false;
        }

        if (record.ownerOpenId === openId) {
            return true;
        }

        if (record._openid === openId) {
            return true;
        }

        const value = record.value;
        if (typeof value !== 'string') {
            return false;
        }

        try {
            const parsed = JSON.parse(value) as PlayerSaveData;
            return parsed.social?.openId === openId;
        } catch {
            return false;
        }
    }

    static async syncOnLogin(): Promise<CloudSyncResult> {
        const remote = await this.downloadSave();
        const local = StorageManager.load();

        if (!remote) {
            await this.uploadSave(local);
            return { success: true, source: 'none', message: 'cloud save empty, initialized from local save.' };
        }

        const merged = this.mergeSaveData(local, remote);
        StorageManager.save(merged);
        await this.uploadSave(merged);
        return { success: true, source: WXAPI.available ? 'wechat' : 'shadow', message: 'cloud save merged into local save.' };
    }

    static async uploadSave(data = StorageManager.load()): Promise<CloudSyncResult> {
        const openId = this.getCurrentOpenId(data);
        data.social.openId = openId;
        const payload = JSON.stringify(data);
        sys.localStorage.setItem(this.getShadowKey(openId), payload);

        const cloud = WXAPI.getCloud();
        if (!cloud?.database) {
            console.log('[CloudSaveManager] uploadSave: no cloud db, shadow only');
            return { success: true, source: 'shadow', message: 'saved to local cloud-shadow data.' };
        }
        if (!openId) {
            console.warn('[CloudSaveManager] uploadSave: openid missing, skip cloud db write');
            return { success: true, source: 'shadow', message: 'saved locally; cloud sync waits for user identity.' };
        }

        console.log('[CloudSaveManager] uploadSave: writing to cloud db, bytes:', payload.length, 'openid:', openId);
        try {
            const db = cloud.database();
            const col = db.collection('kv_saves');
            const key = this.getCloudSaveKey(openId);
            const record = { key, value: payload, updatedAt: Date.now(), ownerOpenId: openId };

            // Use a user-scoped key and owner marker so records stay isolated even if
            // the cloud collection permission is temporarily misconfigured.
            const queryRes = await col.where({ key, ownerOpenId: openId }).limit(1).get();
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
            console.warn('[CloudSaveManager] direct db write failed, shadow save kept.', error);
            return { success: true, source: 'shadow', message: 'saved to local cloud-shadow data.' };
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
            const key = this.getCloudSaveKey(openId);

            const res = await col.where({ key, ownerOpenId: openId }).limit(1).get();
            console.log('[CloudSaveManager] downloadSave: query result count:', res.data.length, 'openid:', openId);
            let record = res.data[0] as Record<string, unknown> | undefined;

            if (!record) {
                // One-time compatibility for records created before v0.5.3-hotfix-2.
                // Never import a legacy shared record unless it explicitly belongs to this user.
                const legacyRes = await col.where({ key: LEGACY_CLOUD_SAVE_KEY }).limit(3).get();
                record = (legacyRes.data as Record<string, unknown>[]).find((item) => this.recordBelongsToOpenId(item, openId));
                console.log('[CloudSaveManager] downloadSave: legacy query result count:', legacyRes.data.length, 'matched:', Boolean(record), 'openid:', openId);
            }

            if (!record) {
                return null;
            }

            const value = record.value;
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
