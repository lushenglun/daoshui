import { AdManager } from '../WeChat/AdManager';
import { StorageManager } from './StorageManager';
import { CloudSaveManager } from '../WeChat/CloudSaveManager';
import { WXAPI } from '../WeChat/WXAPI';

export class SDKManager {
    private static loginStarted = false;

    static initialize(): void {
        AdManager.preloadAds();
        WXAPI.initCloud();
        WXAPI.showShareMenu();
        void this.loginAndSync();
    }

    static async loginAndSync(): Promise<boolean> {
        if (this.loginStarted) {
            return false;
        }

        this.loginStarted = true;
        const save = StorageManager.load();
        const result = await WXAPI.login();

        if (!result.success) {
            save.social.lastLoginError = result.error;
            StorageManager.save(save);
            console.warn('[SDKManager] login failed:', result.error);
            WXAPI.showToast('登录失败，可在设置中重试', 'none');
            this.loginStarted = false;
            return false;
        }

        console.log(`[SDKManager] login code: ${result.code}`);
        save.social.loginCode = result.code;
        save.social.lastLoginTime = Date.now();
        save.social.lastLoginError = '';
        StorageManager.save(save);
        const syncResult = await CloudSaveManager.syncOnLogin();
        console.log('[SDKManager] login ok, sync:', syncResult.message);
        this.loginStarted = false;
        return true;
    }
}
