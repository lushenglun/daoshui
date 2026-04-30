import { AdManager } from '../WeChat/AdManager';

export class SDKManager {
    static initialize(): void {
        AdManager.preloadAds();
    }
}

