/**
 * 《倒水乐乐乐》全局游戏配置常量
 * 所有数值型配置集中管理，便于策划调优
 */

export const GAME_CONFIG = {
    /** 游戏版本号 */
    VERSION: '0.5.3',

    /** 构建与发布配置 */
    BUILD: {
        /** 是否为发布版本（true = 隐藏 GM 工具等开发功能） */
        IS_RELEASE: false,
        /** 审核期间是否隐藏所有广告入口（流量主未开通前建议开启） */
        HIDE_AD_ENTRIES_IN_REVIEW: false,
        /** 总广告开关：true 时禁止所有真实/Mock 广告调用 */
        DISABLE_ALL_ADS: true,
    },

    /** 关卡相关 */
    LEVEL: {
        /** 默认瓶子容量（格数） */
        DEFAULT_CAPACITY: 4,
        /** 初始解锁关卡数 */
        INITIAL_UNLOCK: 1,
        /** 三星评价步数宽裕值 */
        THREE_STAR_MARGIN: 2,
        /** 二星评价步数宽裕值 */
        TWO_STAR_MARGIN: 5,
    },

    /** 撤销功能 */
    UNDO: {
        /** 每关免费撤销次数 */
        FREE_COUNT: 3,
        /** 超出免费后的单次价格（金币） */
        COST: 10,
        /** 看视频奖励的撤销次数 */
        VIDEO_REWARD_COUNT: 5,
    },

    /** 提示功能 */
    HINT: {
        /** 单次提示价格（金币） */
        COST: 50,
        /** 看视频奖励的提示次数 */
        VIDEO_REWARD_COUNT: 1,
    },

    /** 经济系统 */
    ECONOMY: {
        /** 金币持有上限 */
        COIN_CAP: 99999,
        /** 钻石持有上限 */
        DIAMOND_CAP: 9999,
        /** 每日签到基础奖励 */
        DAILY_CHECKIN_BASE: 50,
        /** 连续签到加成倍数 */
        CHECKIN_STREAK_MULTIPLIER: 1.5,
        /** 分享每日首次奖励 */
        SHARE_REWARD: 50,
    },

    /** 广告配置 */
    AD: {
        /** 是否启用 Mock 模式（流量主未开通时使用） */
        MOCK_ENABLED: false,
        /** Mock 模式激励视频模拟时长（毫秒） */
        MOCK_REWARDED_DELAY: 1500,
        /** Mock 模式插屏模拟时长（毫秒） */
        MOCK_INTERSTITIAL_DELAY: 500,
        /** 激励视频冷却时间（秒） */
        REWARDED_COOLDOWN: 30,
        /** 激励视频每日上限 */
        REWARDED_DAILY_LIMIT: 20,
        /** 插屏广告首次展示关卡 */
        INTERSTITIAL_FIRST_LEVEL: 6,
        /** 插屏广告关卡间隔 */
        INTERSTITIAL_LEVEL_INTERVAL: 3,
        /** 插屏广告同次冷却（秒） */
        INTERSTITIAL_COOLDOWN: 300,
        /** 插屏每日上限 */
        INTERSTITIAL_DAILY_LIMIT: 20,
        /** Banner刷新间隔（秒） */
        BANNER_REFRESH: 30,
    },

    /** 动画时长（秒） */
    ANIMATION: {
        /** 倒水动画总时长 */
        POUR_DURATION: 0.5,
        /** 液体移动时长 */
        LIQUID_MOVE: 0.3,
        /** 填充/缩减时长 */
        FILL_SHRINK: 0.2,
        /** 选中浮动周期 */
        FLOAT_CYCLE: 2.0,
        /** 错误抖动时长 */
        SHAKE_DURATION: 0.3,
        /** 撤销倒流时长 */
        UNDO_DURATION: 0.4,
        /** 界面弹出时长 */
        POPUP_DURATION: 0.3,
        /** 界面关闭时长 */
        POPUP_CLOSE: 0.2,
        /** 星星亮起间隔 */
        STAR_INTERVAL: 0.3,
    },

    /** 音频配置 */
    AUDIO: {
        /** BGM音量 */
        BGM_VOLUME: 0.5,
        /** SFX音量 */
        SFX_VOLUME: 0.8,
    },

    /** 输入配置 */
    INPUT: {
        /** 双击检测间隔（毫秒） */
        DOUBLE_CLICK_INTERVAL: 300,
        /** 动画期间是否屏蔽输入 */
        BLOCK_INPUT_DURING_ANIM: true,
    },

    /** 存档配置 */
    SAVE: {
        /** 存档键名 */
        SAVE_KEY: 'water_sort_save_v1',
        /** 自动存档间隔（秒） */
        AUTO_SAVE_INTERVAL: 30,
    },
};

/** 颜色配置表 */
export const COLOR_PALETTES: Record<string, string[]> = {
    default: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#F093FB', '#F5576C'],
    candy: ['#FF69B4', '#FF1493', '#FFB6C1', '#FFA07A', '#FFD700', '#DA70D6', '#87CEEB', '#98FB98'],
    ocean: ['#00CED1', '#20B2AA', '#008B8B', '#5F9EA0', '#4682B4', '#1E90FF', '#00BFFF', '#87CEFA'],
    autumn: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#F5DEB3', '#FFE4B5', '#FFDEAD'],
    neon: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0080', '#80FF00', '#0080FF', '#FF8000', '#8000FF'],
    sakura: ['#FFB7C5', '#FF8FAB', '#FADADD', '#E75480', '#FFFFFF', '#C8E7E2', '#F7CAC9', '#FFDDE2'],
    vip: ['#1F2933', '#111827', '#D4AF37', '#F7E7A1', '#6B7280', '#FFFFFF', '#B8860B', '#2D3436'],
};

/** 微信广告位ID配置（需要替换为真实ID） */
export const AD_UNIT_IDS = {
    /** 激励视频 */
    rewardedVideo: 'adunit-xxxxxxxxxxxxxxxx',
    /** 插屏广告 */
    interstitial: 'adunit-yyyyyyyyyyyyyyyy',
    /** Banner广告 */
    banner: 'adunit-zzzzzzzzzzzzzzzz',
};

/** 关卡通关奖励配置 */
export const LEVEL_REWARDS: { maxLevel: number; baseCoins: number; starBonus: [number, number, number] }[] = [
    { maxLevel: 10, baseCoins: 20, starBonus: [5, 10, 15] },
    { maxLevel: 50, baseCoins: 25, starBonus: [5, 10, 15] },
    { maxLevel: 100, baseCoins: 30, starBonus: [10, 15, 20] },
    { maxLevel: 200, baseCoins: 35, starBonus: [10, 15, 20] },
    { maxLevel: 500, baseCoins: 40, starBonus: [10, 20, 30] },
    { maxLevel: Infinity, baseCoins: 50, starBonus: [15, 25, 35] },
];

/** 获取关卡奖励配置 */
export function getLevelRewardConfig(levelId: number): { baseCoins: number; starBonus: [number, number, number] } {
    for (const config of LEVEL_REWARDS) {
        if (levelId <= config.maxLevel) {
            return { baseCoins: config.baseCoins, starBonus: config.starBonus };
        }
    }
    return { baseCoins: 50, starBonus: [15, 25, 35] };
}
