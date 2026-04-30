declare const wx: any;

export class WXAPI {
    static get available(): boolean {
        return typeof wx !== 'undefined';
    }

    static vibrateShort(): void {
        if (this.available && wx.vibrateShort) {
            wx.vibrateShort({ type: 'light' });
        }
    }

    static showToast(title: string, icon: 'success' | 'error' | 'none' = 'none'): void {
        if (this.available && wx.showToast) {
            wx.showToast({ title, icon });
        }
    }
}
