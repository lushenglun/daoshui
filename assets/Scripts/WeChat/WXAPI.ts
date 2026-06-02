declare const wx: any;

export interface LoginResult {
    success: boolean;
    code: string;
    error: string;
    openId: string;
}

export interface SharePayload {
    title: string;
    query?: string;
    imageUrl?: string;
}

export class WXAPI {
    private static cloudInited = false;
    private static bannerAd: any | null = null;

    static get available(): boolean {
        return typeof wx !== 'undefined';
    }

    /**
     * Initialize wx.cloud once (safe to call repeatedly).
     * - In WeChat DevTools/real device, this prevents "please call wx.cloud.init first".
     * - In editor/non-wechat environment, this is a no-op.
     */
    static initCloud(): boolean {
        if (!this.available) {
            return false;
        }
        const cloud = wx.cloud;
        if (!cloud || !cloud.init) {
            return false;
        }
        if (this.cloudInited) {
            return true;
        }

        try {
            // If env is not provided, WeChat will use default env (configured in DevTools).
            cloud.init({ traceUser: true });
            this.cloudInited = true;
            console.log('[WXAPI] wx.cloud.init ok');
            return true;
        } catch (error) {
            console.warn('[WXAPI] wx.cloud.init failed:', error);
            this.cloudInited = false;
            return false;
        }
    }

    static get cloudReady(): boolean {
        return this.cloudInited && this.available && Boolean(wx.cloud);
    }

    static vibrateShort(): void {
        if (this.available && wx.vibrateShort) {
            wx.vibrateShort({ type: 'light' });
        }
    }

    static showToast(title: string, icon: 'success' | 'error' | 'none' = 'none'): void {
        if (this.available && wx.showToast) {
            wx.showToast({ title, icon });
            return;
        }
        console.log(`[Toast:${icon}] ${title}`);
    }

    static async login(): Promise<LoginResult> {
        if (!this.available || !wx.login) {
            console.log('[WXAPI] editor mock login code: editor_mock_login_code');
            return { success: true, code: 'editor_mock_login_code', error: '', openId: 'editor_mock_openid' };
        }

        const loginResult = await new Promise<LoginResult>((resolve) => {
            wx.login({
                success: (res: { code?: string }) => {
                    resolve({ success: Boolean(res.code), code: res.code ?? '', error: res.code ? '' : 'wx.login missing code', openId: '' });
                },
                fail: (error: unknown) => {
                    resolve({ success: false, code: '', error: JSON.stringify(error), openId: '' });
                },
            });
        });

        if (loginResult.success) {
            loginResult.openId = await this.getOpenId();
        }

        return loginResult;
    }

    static async getOpenId(): Promise<string> {
        const cloud = this.getCloud();
        if (!cloud?.callFunction) {
            return '';
        }

        const functionNames = ['getOpenId', 'login'];
        for (const name of functionNames) {
            try {
                const res = await cloud.callFunction({ name });
                const result = res?.result ?? {};
                const openId = result.openid ?? result.openId ?? result.OPENID ?? result.userInfo?.openid ?? '';
                if (typeof openId === 'string' && openId) {
                    console.log(`[WXAPI] openid resolved by cloud function: ${name}`);
                    return openId;
                }
            } catch (error) {
                console.warn(`[WXAPI] cloud function ${name} failed:`, error);
            }
        }

        return '';
    }

    static shareAppMessage(payload: SharePayload): Promise<boolean> {
        if (!this.available || !wx.shareAppMessage) {
            console.log('[WXAPI] editor share mock:', payload.title, payload.query ?? '');
            return Promise.resolve(true);
        }

        wx.shareAppMessage(payload);
        return Promise.resolve(true);
    }

    static setUserCloudStorage(key: string, value: string): Promise<boolean> {
        if (!this.available || !wx.setUserCloudStorage) {
            return Promise.resolve(false);
        }

        return new Promise((resolve) => {
            wx.setUserCloudStorage({
                KVDataList: [{ key, value }],
                success: () => resolve(true),
                fail: (error: unknown) => {
                    console.warn('[WXAPI] setUserCloudStorage failed:', error);
                    resolve(false);
                },
            });
        });
    }

    static postOpenDataContextMessage(message: Record<string, unknown>): boolean {
        if (!this.available || !wx.getOpenDataContext) {
            return false;
        }

        const context = wx.getOpenDataContext();
        if (!context || !context.postMessage) {
            return false;
        }
        context.postMessage(message);
        return true;
    }

    static getOpenDataContextCanvas(): any | null {
        if (!this.available || !wx.getOpenDataContext) {
            return null;
        }

        const context = wx.getOpenDataContext();
        return context?.canvas ?? null;
    }

    static getCloud(): any | null {
        // Ensure we at least attempted init before returning cloud instance.
        this.initCloud();
        return this.cloudReady ? wx.cloud : null;
    }

    static getLocalDateKey(): string {
        const date = new Date();
        const year = date.getFullYear();
        const rawMonth = `${date.getMonth() + 1}`;
        const rawDay = `${date.getDate()}`;
        const month = rawMonth.length === 1 ? `0${rawMonth}` : rawMonth;
        const day = rawDay.length === 1 ? `0${rawDay}` : rawDay;
        return `${year}-${month}-${day}`;
    }

    static showShareMenu(): void {
        if (this.available && wx.showShareMenu) {
            wx.showShareMenu({ withShareTicket: true });
        }
    }

    static async showRewardedVideo(adUnitId: string): Promise<boolean> {
        if (!this.available || !wx.createRewardedVideoAd || !adUnitId) {
            console.warn('[WXAPI] rewarded video unavailable.');
            return false;
        }

        return new Promise((resolve) => {
            let settled = false;
            const videoAd = wx.createRewardedVideoAd({ adUnitId });
            const cleanup = (): void => {
                if (videoAd.offClose) {
                    videoAd.offClose(onClose);
                }
                if (videoAd.offError) {
                    videoAd.offError(onError);
                }
            };
            const settle = (value: boolean): void => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                resolve(value);
            };
            const onClose = (res: { isEnded?: boolean } | undefined): void => {
                settle(Boolean(res?.isEnded));
            };
            const onError = (error: unknown): void => {
                console.warn('[WXAPI] rewarded video error:', error);
                settle(false);
            };

            videoAd.onClose(onClose);
            videoAd.onError(onError);
            videoAd.load()
                .then(() => videoAd.show())
                .catch((error: unknown) => {
                    console.warn('[WXAPI] rewarded video load/show failed:', error);
                    settle(false);
                });
        });
    }

    static preloadRewardedVideo(adUnitId: string): void {
        if (!this.available || !wx.createRewardedVideoAd || !adUnitId) {
            return;
        }

        try {
            const videoAd = wx.createRewardedVideoAd({ adUnitId });
            const result = videoAd.load?.();
            if (result && typeof result.catch === 'function') {
                result.catch((error: unknown) => console.warn('[WXAPI] preload rewarded video failed:', error));
            }
        } catch (error) {
            console.warn('[WXAPI] preload rewarded video failed:', error);
        }
    }

    static async showInterstitial(adUnitId: string): Promise<boolean> {
        if (!this.available || !wx.createInterstitialAd || !adUnitId) {
            return false;
        }

        return new Promise((resolve) => {
            let settled = false;
            const interstitialAd = wx.createInterstitialAd({ adUnitId });
            const settle = (value: boolean): void => {
                if (settled) {
                    return;
                }
                settled = true;
                resolve(value);
            };
            interstitialAd.onError?.((error: unknown) => {
                console.warn('[WXAPI] interstitial error:', error);
                settle(false);
            });
            interstitialAd.onClose?.(() => settle(true));
            interstitialAd.load()
                .then(() => interstitialAd.show())
                .catch((error: unknown) => {
                    console.warn('[WXAPI] interstitial load/show failed:', error);
                    settle(false);
                });
        });
    }

    static createBanner(adUnitId: string): void {
        if (!this.available || !wx.createBannerAd || !adUnitId || this.bannerAd) {
            return;
        }

        try {
            const info = wx.getSystemInfoSync ? wx.getSystemInfoSync() : { windowWidth: 360, windowHeight: 640 };
            this.bannerAd = wx.createBannerAd({
                adUnitId,
                style: {
                    left: 0,
                    top: info.windowHeight - 90,
                    width: info.windowWidth,
                },
            });
            this.bannerAd.onError?.((error: unknown) => {
                console.warn('[WXAPI] banner error:', error);
                this.destroyBanner();
            });
        } catch (error) {
            console.warn('[WXAPI] create banner failed:', error);
            this.bannerAd = null;
        }
    }

    static showBanner(adUnitId: string): void {
        if (!this.available || !adUnitId) {
            return;
        }
        if (!this.bannerAd) {
            this.createBanner(adUnitId);
        }
        const result = this.bannerAd?.show?.();
        if (result && typeof result.catch === 'function') {
            result.catch((error: unknown) => {
                console.warn('[WXAPI] banner show failed:', error);
                this.destroyBanner();
            });
        }
    }

    static hideBanner(): void {
        const result = this.bannerAd?.hide?.();
        if (result && typeof result.catch === 'function') {
            result.catch((error: unknown) => console.warn('[WXAPI] banner hide failed:', error));
        }
    }

    static destroyBanner(): void {
        this.bannerAd?.destroy?.();
        this.bannerAd = null;
    }
}
