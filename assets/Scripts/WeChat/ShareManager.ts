import { WXAPI } from './WXAPI';

declare const wx: any;

export class ShareManager {
    static shareLevel(levelId: number): void {
        if (!WXAPI.available || !wx.shareAppMessage) {
            return;
        }

        wx.shareAppMessage({
            title: `我在倒水大师第${levelId}关卡住了，来挑战我！`,
            query: `level=${levelId}`,
        });
    }
}

