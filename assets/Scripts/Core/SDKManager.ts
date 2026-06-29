import { AdManager } from '../WeChat/AdManager';
import { StorageManager } from './StorageManager';
import { CloudSaveManager } from '../WeChat/CloudSaveManager';
import { WXAPI } from '../WeChat/WXAPI';

export class SDKManager {
    private static loginStarted = false;
    private static loginPromise: Promise<boolean> | null = null;
    private static syncedOnce = false;
    private static initialized = false;
    private static timeouts: number[] = [];

    static initialize(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        WXAPI.showShareMenu();

        // Keep first screen light: cloud login/sync and ad preloading can wait until
        // after the game is visible and interactive.
        this.timeouts.push(setTimeout(() => {
            WXAPI.initCloud();
            void this.loginAndSync();
        }, 1500));
        this.timeouts.push(setTimeout(() => {
            AdManager.preloadAds();
        }, 2500));
    }

    static cleanup(): void {
        this.timeouts.forEach((id) => clearTimeout(id));
        this.timeouts = [];
        this.initialized = false;
        this.loginStarted = false;
        this.loginPromise = null;
        this.syncedOnce = false;
    }

    static async loginAndSync(): Promise<boolean> {
        if (this.loginPromise) {
            return this.loginPromise;
        }

        this.loginPromise = this.performLoginAndSync();
        try {
            const success = await this.loginPromise;
            this.syncedOnce = success || this.syncedOnce;
            return success;
        } finally {
            this.loginPromise = null;
        }
    }

    static async ensureLoginAndSync(): Promise<boolean> {
        if (this.syncedOnce) {
            return true;
        }
        return this.loginAndSync();
    }

    private static async performLoginAndSync(): Promise<boolean> {
        if (this.loginStarted) {
            return false;
        }

        this.loginStarted = true;
        try {
            WXAPI.initCloud();
            const result = await WXAPI.login();

            if (!result.success) {
                const save = StorageManager.load();
                save.social.lastLoginError = result.error;
                StorageManager.save(save);
                console.warn('[SDKManager] login failed:', result.error);
                WXAPI.showToast('登录失败，可在设置中重试', 'none');
                return false;
            }

            console.log(`[SDKManager] login code: ${result.code}`);
            if (result.openId) {
                StorageManager.setUserScope(result.openId);
            } else {
                console.warn('[SDKManager] openid missing, cloud save sync will be skipped.');
            }

            const save = StorageManager.load();
            save.social.loginCode = result.code;
            save.social.openId = result.openId;
            save.social.lastLoginTime = Date.now();
            save.social.lastLoginError = '';
            StorageManager.save(save);
            const syncResult = await CloudSaveManager.syncOnLogin();
            console.log('[SDKManager] login ok, sync:', syncResult.message);
            return true;
        } finally {
            this.loginStarted = false;
        }
    }
}
