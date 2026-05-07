import { GAME_CONFIG } from '../Data/GameConfig';
import { StorageManager } from '../Core/StorageManager';
import { CloudSaveManager } from './CloudSaveManager';
import { WXAPI } from './WXAPI';

export type ShareScene = 'main_help' | 'level_help' | 'result_showoff';

interface ShareContext {
    levelId?: number;
    steps?: number;
    stars?: number;
}

export interface ShareResult {
    success: boolean;
    rewarded: boolean;
    message: string;
}

const SHARE_TEMPLATES: Record<ShareScene, string[]> = {
    main_help: [
        '我在倒水乐乐乐第{level}关卡住了，求助大神！',
        '这杯水怎么倒才对？来倒水乐乐乐帮我看看第{level}关！',
        '倒水乐乐乐有点上头，第{level}关等你来挑战。',
    ],
    level_help: [
        '这关太难了，求好友指点迷津！',
        '第{level}关把我难住了，来帮我倒一倒。',
        '颜色都混在一起了，第{level}关谁能解？',
    ],
    result_showoff: [
        '我用{steps}步通关倒水乐乐乐第{level}关，拿到{stars}星！',
        '第{level}关已通关，{stars}星到手，来比一比？',
        '倒水乐乐乐第{level}关完成，只用了{steps}步。',
    ],
};

export class ShareManager {
    static async share(scene: ShareScene, context: ShareContext = {}): Promise<ShareResult> {
        if (scene === 'main_help' && this.hasClaimedMainShareRewardToday()) {
            return { success: true, rewarded: false, message: '今日首次分享奖励已领取，不重复发放。' };
        }

        const title = this.buildTitle(scene, context);
        const query = `scene=${scene}&level=${context.levelId ?? StorageManager.load().currentLevel}`;
        const success = await WXAPI.shareAppMessage({ title, query });
        if (!success) {
            return { success: false, rewarded: false, message: '分享失败，请稍后重试。' };
        }

        const reward = this.applyReward(scene);
        await CloudSaveManager.uploadSave();
        return { success: true, rewarded: reward.rewarded, message: reward.message };
    }

    private static buildTitle(scene: ShareScene, context: ShareContext): string {
        const templates = SHARE_TEMPLATES[scene];
        const template = templates[Math.floor(Math.random() * templates.length)];
        const save = StorageManager.load();
        return template
            .replace('{level}', String(context.levelId ?? save.currentLevel))
            .replace('{steps}', String(context.steps ?? 0))
            .replace('{stars}', String(context.stars ?? 0));
    }

    private static applyReward(scene: ShareScene): { rewarded: boolean; message: string } {
        const save = StorageManager.load();
        const today = WXAPI.getLocalDateKey();

        if (save.social.lastShareDate !== today) {
            save.social.lastShareDate = today;
            save.social.dailyShareCount = 0;
        }

        save.social.dailyShareCount += 1;
        save.social.totalShares += 1;

        if (scene === 'main_help' && save.social.dailyShareCount === 1) {
            save.coins = Math.min(GAME_CONFIG.ECONOMY.COIN_CAP, save.coins + GAME_CONFIG.ECONOMY.SHARE_REWARD);
            StorageManager.save(save);
            return { rewarded: true, message: `分享成功，获得 ${GAME_CONFIG.ECONOMY.SHARE_REWARD} 金币。` };
        }

        StorageManager.save(save);
        if (scene === 'main_help') {
            return { rewarded: false, message: '今日首次分享奖励已领取，不重复发放。' };
        }
        return { rewarded: false, message: '分享成功。' };
    }

    private static hasClaimedMainShareRewardToday(): boolean {
        const save = StorageManager.load();
        return save.social.lastShareDate === WXAPI.getLocalDateKey() && save.social.dailyShareCount > 0;
    }
}
