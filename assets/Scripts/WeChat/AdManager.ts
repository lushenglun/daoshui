export class AdManager {
    static preloadAds(): void {
        // Real ad units are configured in GameConfig and wired during WeChat build integration.
    }

    static async showRewardedVideo(): Promise<boolean> {
        return false;
    }

    static async showInterstitial(): Promise<boolean> {
        return false;
    }
}

