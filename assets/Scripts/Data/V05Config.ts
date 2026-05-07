export interface RewardBundle {
    coins?: number;
    diamonds?: number;
    themeId?: string;
    title?: string;
}

export interface AchievementConfig {
    id: string;
    name: string;
    description: string;
    target: number;
    rewards: RewardBundle;
}

export interface ThemeConfig {
    id: string;
    name: string;
    description: string;
    unlockText: string;
    requiredCompletedLevels?: number;
    requiredShares?: number;
    requiredAdsWatched?: number;
    achievementId?: string;
    priceCoins?: number;
    priceDiamonds?: number;
    backgroundColor: string;
}

export interface DailyCheckInReward {
    label: string;
    coins: number;
    diamonds: number;
}

export const DAILY_CHECKIN_REWARDS: DailyCheckInReward[] = [
    { label: '50金币', coins: 50, diamonds: 0 },
    { label: '100金币', coins: 100, diamonds: 0 },
    { label: '10钻石', coins: 0, diamonds: 10 },
    { label: '200金币', coins: 200, diamonds: 0 },
    { label: '50金币', coins: 50, diamonds: 0 },
    { label: '20钻石', coins: 0, diamonds: 20 },
    { label: '500金币', coins: 500, diamonds: 0 },
];

export const ACHIEVEMENT_CONFIGS: AchievementConfig[] = [
    { id: 'complete_10', name: '初出茅庐', description: '累计通关10关', target: 10, rewards: { coins: 50 } },
    { id: 'complete_100', name: '滴水穿石', description: '累计通关100关', target: 100, rewards: { coins: 100, diamonds: 5 } },
    { id: 'complete_500', name: '倒水乐乐乐', description: '累计通关500关', target: 500, rewards: { coins: 500, diamonds: 20 } },
    { id: 'three_stars_100', name: '完美主义', description: '累计获得100个三星评价', target: 100, rewards: { coins: 200, diamonds: 10 } },
    { id: 'no_hint_50', name: '独立思考', description: '不使用提示通关50关', target: 50, rewards: { coins: 300, diamonds: 15 } },
    { id: 'undo_master', name: '反悔大师', description: '累计使用撤销功能100次', target: 100, rewards: { coins: 100 } },
    { id: 'ad_watcher_50', name: '广告达人', description: '累计观看50次激励视频', target: 50, rewards: { coins: 500, title: '金主' } },
    { id: 'share_20', name: '分享大使', description: '累计分享20次', target: 20, rewards: { coins: 200, themeId: 'sakura' } },
    { id: 'daily_challenge_7', name: '挑战者', description: '连续7天完成每日挑战', target: 7, rewards: { diamonds: 50, title: '挑战者' } },
    { id: 'speed_run', name: '极速通关', description: '30秒内通关任意一关', target: 1, rewards: { coins: 100, diamonds: 5 } },
];

export const THEME_CONFIGS: ThemeConfig[] = [
    { id: 'default', name: '清新夏日', description: '默认浅绿背景', unlockText: '默认解锁', backgroundColor: '#E8F6F3' },
    { id: 'candy', name: '甜蜜糖果', description: '粉色与亮色液体', unlockText: '通关25关后可解锁', requiredCompletedLevels: 25, priceCoins: 500, priceDiamonds: 50, backgroundColor: '#FFF0F7' },
    { id: 'ocean', name: '深海秘境', description: '蓝绿冷色系', unlockText: '通关50关后可解锁', requiredCompletedLevels: 50, priceCoins: 800, priceDiamonds: 80, backgroundColor: '#E6F7FF' },
    { id: 'autumn', name: '金秋丰收', description: '暖色丰收主题', unlockText: '通关75关后可解锁', requiredCompletedLevels: 75, priceCoins: 1000, priceDiamonds: 100, backgroundColor: '#FFF6E5' },
    { id: 'neon', name: '霓虹都市', description: '高饱和霓虹配色', unlockText: '通关100关后可解锁', requiredCompletedLevels: 100, priceCoins: 1500, priceDiamonds: 150, backgroundColor: '#F4F0FF' },
    { id: 'sakura', name: '樱花祭', description: '分享或成就限定主题', unlockText: '分享5次或成就解锁', requiredShares: 5, achievementId: 'share_20', priceDiamonds: 200, backgroundColor: '#FFF1F3' },
    { id: 'vip', name: '黑金至尊', description: '广告达人专属主题', unlockText: '累计观看50次激励视频', requiredAdsWatched: 50, priceDiamonds: 300, backgroundColor: '#F7F3E8' },
];

export const THEME_NAME_BY_ID = THEME_CONFIGS.reduce<Record<string, string>>((map, theme) => {
    map[theme.id] = theme.name;
    return map;
}, {});
