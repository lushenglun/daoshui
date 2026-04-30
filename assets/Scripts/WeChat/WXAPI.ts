declare const wx: any;

export interface LoginResult {
    success: boolean;
    code: string;
    error: string;
}

export interface SharePayload {
    title: string;
    query?: string;
    imageUrl?: string;
}

export class WXAPI {
    private static cloudInited = false;

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
            return { success: true, code: 'editor_mock_login_code', error: '' };
        }

        return new Promise((resolve) => {
            wx.login({
                success: (res: { code?: string }) => {
                    resolve({ success: Boolean(res.code), code: res.code ?? '', error: res.code ? '' : 'wx.login missing code' });
                },
                fail: (error: unknown) => {
                    resolve({ success: false, code: '', error: JSON.stringify(error) });
                },
            });
        });
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
}
