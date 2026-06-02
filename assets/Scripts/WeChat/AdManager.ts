import { GAME_CONFIG, AD_UNIT_IDS } from '../Data/GameConfig';
import { PlayerSaveData } from '../Data/GameData';
import { StorageManager } from '../Core/StorageManager';
import { WXAPI } from './WXAPI';
import { CloudSaveManager } from './CloudSaveManager';

export type RewardedScene = 'hint' | 'undo' | 'double_coins' | 'free_coins' | 'check_in_makeup';

export interface RewardedResult {
    success: boolean;
    completed: boolean;
    message: string;
}

export interface AdStats {
    rewardedToday: number;
    interstitialToday: number;
    lastRewardedTime: number;
    lastInterstitialTime: number;
}

export class AdManager {
    /**
     * 当前是否处于 Mock 模式
     * 由 GAME_CONFIG.AD.MOCK_ENABLED 控制，流量主未开通时默认开启
     */
    static get isMockMode(): boolean {
        return !GAME_CONFIG.BUILD.DISABLE_ALL_ADS && GAME_CONFIG.AD.MOCK_ENABLED && !GAME_CONFIG.BUILD.IS_RELEASE;
    }

    static preloadAds(): void {
        StorageManager.resetAdStatsIfNeeded();
        if (GAME_CONFIG.BUILD.DISABLE_ALL_ADS) {
            return;
        }
        if (this.isMockMode) {
            console.log('[AdManager] Mock mode: preloadAds skipped.');
            return;
        }
        this.preloadRewardedVideo();
    }

    static preloadRewardedVideo(): void {
        if (GAME_CONFIG.BUILD.DISABLE_ALL_ADS) {
            return;
        }
        if (this.isMockMode) {
            return;
        }
        if (!this.hasValidAdUnitId(AD_UNIT_IDS.rewardedVideo)) {
            return;
        }
        WXAPI.preloadRewardedVideo(AD_UNIT_IDS.rewardedVideo);
    }

    static async showRewardedVideo(scene: RewardedScene): Promise<RewardedResult> {
        if (GAME_CONFIG.BUILD.DISABLE_ALL_ADS) {
            return { success: false, completed: false, message: '广告功能暂未开放。' };
        }
        const data = StorageManager.resetAdStatsIfNeeded();
        const stats = data.adStats;
        const now = Date.now();
        const cooldownMs = GAME_CONFIG.AD.REWARDED_COOLDOWN * 1000;

        if (stats.rewardedToday >= GAME_CONFIG.AD.REWARDED_DAILY_LIMIT) {
            return { success: false, completed: false, message: '今日视频奖励次数已用完。' };
        }

        if (stats.lastRewardedTime > 0 && now - stats.lastRewardedTime < cooldownMs) {
            const seconds = Math.ceil((cooldownMs - (now - stats.lastRewardedTime)) / 1000);
            return { success: false, completed: false, message: `视频冷却中，请 ${seconds} 秒后再试。` };
        }

        // ── Mock 模式：模拟广告播放 ──
        if (this.isMockMode) {
            WXAPI.showToast('广告播放中…', 'none');
            console.log(`[AdManager] Mock rewarded video: scene=${scene}, delay=${GAME_CONFIG.AD.MOCK_REWARDED_DELAY}ms`);
            await this.delay(GAME_CONFIG.AD.MOCK_REWARDED_DELAY);
            stats.rewardedToday += 1;
            stats.lastRewardedTime = Date.now();
            data.statistics.totalAdsWatched += 1;
            StorageManager.save(data);
            void CloudSaveManager.uploadAdRecord(scene, 'rewarded', data);
            WXAPI.showToast('奖励已发放', 'success');
            return { success: true, completed: true, message: '奖励已发放。' };
        }

        // ── 真实模式 ──
        if (!this.hasValidAdUnitId(AD_UNIT_IDS.rewardedVideo)) {
            return { success: false, completed: false, message: '广告暂未配置，请稍后再试。' };
        }

        const completed = await WXAPI.showRewardedVideo(AD_UNIT_IDS.rewardedVideo);
        if (!completed) {
            return { success: false, completed: false, message: this.getRewardedFailMessage(scene) };
        }

        stats.rewardedToday += 1;
        stats.lastRewardedTime = now;
        data.statistics.totalAdsWatched += 1;
        StorageManager.save(data);
        void CloudSaveManager.uploadAdRecord(scene, 'rewarded', data);
        return { success: true, completed: true, message: '奖励已发放。' };
    }

    static async showInterstitial(levelId: number): Promise<boolean> {
        if (GAME_CONFIG.BUILD.DISABLE_ALL_ADS) {
            return false;
        }
        const data = StorageManager.resetAdStatsIfNeeded();
        const stats = data.adStats;
        const now = Date.now();
        const cooldownMs = GAME_CONFIG.AD.INTERSTITIAL_COOLDOWN * 1000;

        if (levelId < GAME_CONFIG.AD.INTERSTITIAL_FIRST_LEVEL) {
            return false;
        }
        if ((levelId - GAME_CONFIG.AD.INTERSTITIAL_FIRST_LEVEL) % GAME_CONFIG.AD.INTERSTITIAL_LEVEL_INTERVAL !== 0) {
            return false;
        }
        if (stats.interstitialToday >= GAME_CONFIG.AD.INTERSTITIAL_DAILY_LIMIT) {
            return false;
        }
        if (stats.lastInterstitialTime > 0 && now - stats.lastInterstitialTime < cooldownMs) {
            return false;
        }

        // ── Mock 模式：模拟插屏 ──
        if (this.isMockMode) {
            console.log(`[AdManager] Mock interstitial: level=${levelId}, delay=${GAME_CONFIG.AD.MOCK_INTERSTITIAL_DELAY}ms`);
            await this.delay(GAME_CONFIG.AD.MOCK_INTERSTITIAL_DELAY);
            stats.interstitialToday += 1;
            stats.lastInterstitialTime = Date.now();
            StorageManager.save(data);
            void CloudSaveManager.uploadAdRecord(`level_${levelId}`, 'interstitial', data);
            return true;
        }

        // ── 真实模式 ──
        if (!this.hasValidAdUnitId(AD_UNIT_IDS.interstitial)) {
            return false;
        }

        const shown = await WXAPI.showInterstitial(AD_UNIT_IDS.interstitial);
        if (shown) {
            stats.interstitialToday += 1;
            stats.lastInterstitialTime = now;
            StorageManager.save(data);
            void CloudSaveManager.uploadAdRecord(`level_${levelId}`, 'interstitial', data);
        }
        return shown;
    }

    static createBanner(): void {
        if (GAME_CONFIG.BUILD.DISABLE_ALL_ADS) {
            return;
        }
        if (this.isMockMode) {
            console.log('[AdManager] Mock mode: createBanner skipped.');
            return;
        }
        if (!this.hasValidAdUnitId(AD_UNIT_IDS.banner)) {
            return;
        }
        WXAPI.createBanner(AD_UNIT_IDS.banner);
    }

    static showBanner(): void {
        if (GAME_CONFIG.BUILD.DISABLE_ALL_ADS) {
            return;
        }
        if (this.isMockMode) {
            console.log('[AdManager] Mock mode: showBanner skipped.');
            return;
        }
        if (!this.hasValidAdUnitId(AD_UNIT_IDS.banner)) {
            return;
        }
        WXAPI.showBanner(AD_UNIT_IDS.banner);
    }

    static hideBanner(): void {
        if (GAME_CONFIG.BUILD.DISABLE_ALL_ADS) {
            return;
        }
        if (this.isMockMode) {
            console.log('[AdManager] Mock mode: hideBanner skipped.');
            return;
        }
        WXAPI.hideBanner();
    }

    static destroyBanner(): void {
        if (GAME_CONFIG.BUILD.DISABLE_ALL_ADS) {
            return;
        }
        if (this.isMockMode) {
            console.log('[AdManager] Mock mode: destroyBanner skipped.');
            return;
        }
        WXAPI.destroyBanner();
    }

    static getAdStats(): AdStats {
        const data: PlayerSaveData = StorageManager.resetAdStatsIfNeeded();
        return {
            rewardedToday: data.adStats.rewardedToday,
            interstitialToday: data.adStats.interstitialToday,
            lastRewardedTime: data.adStats.lastRewardedTime,
            lastInterstitialTime: data.adStats.lastInterstitialTime,
        };
    }

    private static getRewardedFailMessage(scene: RewardedScene): string {
        switch (scene) {
            case 'hint':
                return '视频未完整观看，暂未获得提示。';
            case 'undo':
                return '视频未完整观看，暂未获得撤销次数。';
            case 'double_coins':
                return '视频未完整观看，暂未获得双倍奖励。';
            case 'free_coins':
                return '视频未完整观看，暂未获得金币。';
            default:
                return '视频未完整观看，暂未获得奖励。';
        }
    }

    /** 获取 Mock 模式下已模拟观看的总广告数（用于 VIP 解锁进度展示） */
    static getMockTotalAdsWatched(): number {
        const data = StorageManager.load();
        return data.statistics.totalAdsWatched;
    }

    private static hasValidAdUnitId(adUnitId: string): boolean {
        return Boolean(adUnitId)
            && adUnitId.indexOf('xxxxxxxx') < 0
            && adUnitId.indexOf('yyyyyyyy') < 0
            && adUnitId.indexOf('zzzzzzzz') < 0;
    }

    private static delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
