import {
    _decorator,
    Color,
    Component,
    EventTouch,
    Graphics,
    Label,
    Node,
    tween,
    UITransform,
    Vec3,
} from 'cc';
import { GAME_CONFIG } from '../Data/GameConfig';
import { GameState } from '../Data/GameData';
import { colorFromHex } from '../Utils/ColorUtils';
import { Bottle } from '../Gameplay/Bottle';
import { LevelManager } from '../Gameplay/LevelManager';
import { PourController } from '../Gameplay/PourController';
import { StorageManager } from './StorageManager';
import { SDKManager } from './SDKManager';
import { CloudSaveManager } from '../WeChat/CloudSaveManager';
import { RankEntry, RankManager } from '../WeChat/RankManager';
import { ShareManager } from '../WeChat/ShareManager';
import { WXAPI } from '../WeChat/WXAPI';

const { ccclass } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    static instance: GameManager | null = null;

    private levelManager = new LevelManager();
    private state = GameState.LOADING;
    private selectedBottle = -1;
    private isAnimating = false;
    private canvasSize = { width: 720, height: 1280 };
    private maxBundledLevelId = 150;
    private lastTapIndex = -1;
    private lastTapTime = 0;

    private background: Node | null = null;
    private viewRoot: Node | null = null;
    private bottleLayer: Node | null = null;
    private popupLayer: Node | null = null;
    private stepLabel: Label | null = null;
    private levelLabel: Label | null = null;
    private coinLabel: Label | null = null;
    private statusLabel: Label | null = null;
    private bottles: Bottle[] = [];
    private previousStateBeforeSettings = GameState.MAIN_MENU;

    onLoad(): void {
        GameManager.instance = this;
        const transform = this.node.getComponent(UITransform);
        if (transform) {
            this.canvasSize = { width: transform.width, height: transform.height };
        }
        StorageManager.load();
        this.buildBaseLayers();
    }

    start(): void {
        this.showMainMenu();
        SDKManager.initialize();
        const save = StorageManager.load();
        if (!save.flags.hasShownAgeTip) {
            save.flags.hasShownAgeTip = true;
            StorageManager.save(save);
            this.showAgeTipPanel();
        }
    }

    private buildBaseLayers(): void {
        ['Background', 'ViewRoot', 'PopupLayer'].forEach((name) => {
            const child = this.node.getChildByName(name);
            if (child) {
                child.destroy();
            }
        });

        this.background = this.createLayer('Background');
        this.viewRoot = this.createLayer('ViewRoot');
        this.popupLayer = this.createLayer('PopupLayer');
    }

    private showMainMenu(): void {
        this.state = GameState.MAIN_MENU;
        this.clearView();
        this.drawBackground('#E8F6F3');

        if (!this.viewRoot) {
            console.error('[GameManager] viewRoot is null in showMainMenu');
            return;
        }

        this.createLabel(this.viewRoot, '倒水大师', 62, new Vec3(0, 360, 0), new Color(45, 52, 54));
        this.createLabel(this.viewRoot, '把同色液体倒在一起', 26, new Vec3(0, 300, 0), new Color(83, 103, 112));
        this.createButton(this.viewRoot, '开始游戏', new Vec3(0, 165, 0), 280, 86, '#4ECDC4', () => {
            const save = StorageManager.load();
            this.startLevel(save.currentLevel);
        });
        this.createButton(this.viewRoot, '选择关卡', new Vec3(0, 56, 0), 240, 68, '#45B7D1', () => {
            void this.showLevelSelect();
        });
        this.createQuickMenuButton('签到', new Vec3(-210, -72, 0), () => this.handleDailyCheckIn());
        this.createQuickMenuButton('排行', new Vec3(-70, -72, 0), () => this.showRankPanel());
        this.createQuickMenuButton('设置', new Vec3(70, -72, 0), () => this.showSettingsPanel(GameState.MAIN_MENU));
        this.createQuickMenuButton('商店', new Vec3(210, -72, 0), () => this.showInfoPanel('主题商店', '主题商店将在美术资源接入后开放。'));
        this.createButton(this.viewRoot, '每日挑战', new Vec3(-130, -210, 0), 200, 58, '#FFFFFF', () => this.showInfoPanel('每日挑战', '每日挑战将在后续版本开放，所有玩家挑战同一关。'));
        this.createButton(this.viewRoot, '成就', new Vec3(130, -210, 0), 200, 58, '#FFFFFF', () => this.showInfoPanel('成就', this.getAchievementSummary()));
        this.createButton(this.viewRoot, '分享求助', new Vec3(0, -292, 0), 220, 58, '#FFEAA7', () => {
            void this.handleMainShare();
        });

        this.createLabel(this.viewRoot, `金币 ${StorageManager.load().coins}`, 28, new Vec3(0, -374, 0), new Color(64, 82, 90));
        this.createLabel(this.viewRoot, 'v0.3 微信测试版 (cloudlog)', 22, new Vec3(0, -520, 0), new Color(120, 140, 148));
    }

    private async showLevelSelect(): Promise<void> {
        this.state = GameState.LEVEL_SELECT;
        this.clearView();
        this.drawBackground('#E8F6F3');

        if (!this.viewRoot) {
            console.error('[GameManager] viewRoot is null in showLevelSelect');
            return;
        }

        this.createLabel(this.viewRoot, '读取关卡...', 30, Vec3.ZERO, new Color(83, 103, 112));
        try {
            this.maxBundledLevelId = await this.levelManager.getMaxBundledLevelId();
        } catch (error) {
            console.warn('[GameManager] getMaxBundledLevelId failed, use fallback count.', error);
        }

        this.clearView();
        this.drawBackground('#E8F6F3');
        this.createButton(this.viewRoot, '<', new Vec3(-300, 520, 0), 72, 58, '#4ECDC4', () => this.showMainMenu());
        this.createLabel(this.viewRoot, '选择关卡', 42, new Vec3(0, 520, 0), new Color(45, 52, 54));

        const save = StorageManager.load();
        const maxLevel = Math.min(this.maxBundledLevelId, Math.max(25, save.currentLevel + 8));
        const columns = 5;
        const startX = -260;
        const startY = 390;
        const gapX = 130;
        const gapY = 112;

        for (let levelId = 1; levelId <= maxLevel; levelId += 1) {
            const col = (levelId - 1) % columns;
            const row = Math.floor((levelId - 1) / columns);
            const unlocked = levelId <= save.currentLevel;
            const stars = save.levelStars[levelId] ?? 0;
            const label = unlocked ? `${levelId}\n${'★'.repeat(stars)}` : `${levelId}\n锁`;
            this.createButton(
                this.viewRoot,
                label,
                new Vec3(startX + col * gapX, startY - row * gapY, 0),
                94,
                82,
                unlocked ? '#FFFFFF' : '#D7DEE2',
                () => unlocked ? this.startLevel(levelId) : WXAPI.showToast('先通关前一关', 'none'),
                unlocked ? new Color(45, 52, 54) : new Color(120, 132, 140),
            );
        }
    }

    private async startLevel(levelId: number): Promise<void> {
        this.state = GameState.LOADING;
        this.selectedBottle = -1;
        this.isAnimating = false;
        this.clearView();
        if (!this.viewRoot) {
            console.error('[GameManager] viewRoot is null in startLevel');
            return;
        }
        this.drawBackground('#E8F6F3');
        this.createLabel(this.viewRoot, '加载中...', 34, Vec3.ZERO, new Color(64, 82, 90));

        try {
            await this.levelManager.loadLevel(levelId);
            this.state = GameState.PLAYING;
            this.buildGameplayView();
            this.refreshGameplay();
        } catch (error) {
            console.error('[GameManager] load level failed:', levelId, error);
            if (levelId !== 1) {
                const save = StorageManager.load();
                save.currentLevel = 1;
                StorageManager.save(save);
                await this.startLevel(1);
                return;
            }
            this.clearView();
            this.createLabel(this.viewRoot, '关卡加载失败', 36, new Vec3(0, 60, 0), new Color(220, 80, 80));
            this.createLabel(this.viewRoot, String(error), 18, new Vec3(0, 8, 0), new Color(120, 70, 70), 620);
            this.createButton(this.viewRoot, '返回', new Vec3(0, -50, 0), 180, 64, '#4ECDC4', () => this.showMainMenu());
        }
    }

    private buildGameplayView(): void {
        this.clearView();
        const chapter = this.levelManager.currentChapter;
        if (!chapter) {
            console.error('[GameManager] chapter is null in buildGameplayView');
            return;
        }
        if (!this.viewRoot) {
            console.error('[GameManager] viewRoot is null in buildGameplayView');
            return;
        }

        this.drawBackground(chapter.theme.backgroundColor);

        this.createButton(this.viewRoot, '<', new Vec3(-310, 540, 0), 64, 54, '#FFFFFF', () => {
            void this.showLevelSelect();
        });
        this.createButton(this.viewRoot, '暂停', new Vec3(306, 540, 0), 96, 54, '#FFFFFF', () => this.showPausePanel());
        this.levelLabel = this.createLabel(this.viewRoot, '', 34, new Vec3(0, 545, 0), new Color(45, 52, 54));
        this.coinLabel = this.createLabel(this.viewRoot, '', 24, new Vec3(205, 545, 0), new Color(64, 82, 90));

        this.stepLabel = this.createLabel(this.viewRoot, '', 28, new Vec3(0, 475, 0), new Color(64, 82, 90));
        this.createButton(this.viewRoot, '撤销', new Vec3(-190, 410, 0), 128, 56, '#FFFFFF', () => this.undo());
        this.createButton(this.viewRoot, '提示', new Vec3(0, 410, 0), 128, 56, '#FFFFFF', () => this.showHint());
        this.createButton(this.viewRoot, '重置', new Vec3(190, 410, 0), 128, 56, '#FFFFFF', () => this.resetLevel());
        this.statusLabel = this.createLabel(this.viewRoot, '点击瓶子开始倒水，双击可自动寻找目标', 22, new Vec3(0, 348, 0), new Color(83, 103, 112), 620);

        this.bottleLayer = this.createLayer('BottleLayer', this.viewRoot);

        const tutorialText = this.levelManager.currentLevel?.tutorialText;
        if (tutorialText) {
            this.createLabel(this.viewRoot, tutorialText, 22, new Vec3(0, -520, 0), new Color(83, 103, 112), 620);
        }
    }

    private refreshGameplay(): void {
        const level = this.levelManager.currentLevel;
        if (!level) {
            console.error('[GameManager] level is null in refreshGameplay');
            return;
        }
        const save = StorageManager.load();
        if (this.levelLabel) {
            this.levelLabel.string = `关卡 ${level.levelId}`;
        }
        if (this.stepLabel) {
            this.stepLabel.string = `步数 ${this.levelManager.steps} / 目标 ${level.targetSteps}`;
        }
        if (this.coinLabel) {
            this.coinLabel.string = `金币 ${save.coins}`;
        }
        this.renderBottles();
    }

    private renderBottles(): void {
        const layer = this.bottleLayer;
        const level = this.levelManager.currentLevel;
        const chapter = this.levelManager.currentChapter;
        if (!layer || !level || !chapter) {
            return;
        }
        if (!this.viewRoot) {
            return;
        }

        layer.removeAllChildren();
        this.bottles = [];

        const count = level.bottleCount;
        const rows = count <= 4 ? 1 : count <= 8 ? 2 : 3;
        const perRow = Math.ceil(count / rows);
        const gapX = Math.min(150, 620 / Math.max(1, perRow - 1));
        const gapY = 285;
        const startY = rows === 1 ? -15 : 120;

        for (let i = 0; i < count; i += 1) {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            const rowCount = Math.min(perRow, count - row * perRow);
            const totalWidth = (rowCount - 1) * gapX;
            const x = col * gapX - totalWidth / 2;
            const y = startY - row * gapY;

            const bottleNode = new Node(`Bottle_${i + 1}`);
            layer.addChild(bottleNode);
            bottleNode.setPosition(x, y);

            const bottle = bottleNode.addComponent(Bottle);
            bottle.initialize(i, level.bottleCapacity, chapter.colorPalette, (index) => this.handleBottleTap(index));
            bottle.setState(this.levelManager.currentState[i]);
            this.bottles.push(bottle);
        }
    }

    private async handleBottleTap(index: number): Promise<void> {
        if (this.state !== GameState.PLAYING || this.isAnimating) {
            return;
        }

        const state = this.levelManager.currentState[index];
        const now = Date.now();
        const isDoubleTap = this.lastTapIndex === index && now - this.lastTapTime <= GAME_CONFIG.INPUT.DOUBLE_CLICK_INTERVAL;
        this.lastTapIndex = index;
        this.lastTapTime = now;

        if (isDoubleTap && state.length > 0) {
            await this.autoPour(index);
            return;
        }

        if (this.selectedBottle < 0) {
            if (state.length === 0) {
                this.showStatus('空瓶不能作为源瓶，可以作为目标瓶。');
                return;
            }
            this.selectBottle(index);
            this.showStatus(`已选择第 ${index + 1} 个瓶子`);
            return;
        }

        if (this.selectedBottle === index) {
            this.selectBottle(-1);
            return;
        }

        if (!this.levelManager.canPour(this.selectedBottle, index)) {
            this.bottles[index]?.playShake();
            this.showStatus('这个目标暂时不能倒入。');
            WXAPI.vibrateShort();
            return;
        }

        await this.performPour(this.selectedBottle, index);
    }

    private async autoPour(fromIndex: number): Promise<void> {
        const targets = this.levelManager.getValidTargets(fromIndex);
        if (targets.length === 0) {
            this.bottles[fromIndex]?.playShake();
            this.showStatus('这个瓶子暂时没有可倒目标。');
            return;
        }

        const target = targets.length === 1
            ? targets[0]
            : targets.find((index) => this.levelManager.currentState[index].length > 0) ?? targets[0];
        this.selectBottle(fromIndex);
        await this.performPour(fromIndex, target);
    }

    private async performPour(fromIndex: number, toIndex: number): Promise<void> {
        const action = this.levelManager.pour(fromIndex, toIndex);
        if (!action) {
            return;
        }

        this.isAnimating = true;
        const fromPos = this.bottles[fromIndex].node.position.clone();
        const toPos = this.bottles[toIndex].node.position.clone();
        const chapter = this.levelManager.currentChapter;
        if (!chapter) {
            this.isAnimating = false;
            return;
        }
        const palette = chapter.colorPalette;
        this.selectBottle(-1);
        if (!this.bottleLayer) {
            this.isAnimating = false;
            return;
        }
        await PourController.playFlow(this.bottleLayer, new Vec3(fromPos.x, fromPos.y + 120, 0), new Vec3(toPos.x, toPos.y + 120, 0), palette[action.colorId - 1], action.count);
        this.isAnimating = false;
        this.showStatus(`倒入 ${action.count} 格液体`);
        this.refreshGameplay();

        if (this.levelManager.checkWin()) {
            this.completeLevel();
        }
    }

    private selectBottle(index: number): void {
        if (this.selectedBottle >= 0) {
            this.bottles[this.selectedBottle]?.setSelected(false);
        }
        this.selectedBottle = index;
        if (index >= 0) {
            this.bottles[index]?.setSelected(true);
        }
    }

    private undo(): void {
        if (this.state !== GameState.PLAYING || this.isAnimating) {
            return;
        }
        const action = this.levelManager.undo();
        if (!action) {
            this.showStatus('没有可撤销的步骤');
            WXAPI.showToast('没有可撤销的步骤', 'none');
            return;
        }
        this.selectBottle(-1);
        this.showStatus('已撤销上一步');
        this.refreshGameplay();
    }

    private showHint(): void {
        if (this.state !== GameState.PLAYING || this.isAnimating) {
            return;
        }
        const hint = this.levelManager.getHint();
        if (!hint) {
            this.showStatus('暂时没有提示');
            WXAPI.showToast('暂时没有提示', 'none');
            return;
        }
        this.selectBottle(hint[0]);
        this.bottles[hint[1]]?.playShake();
        this.showStatus(`建议从第 ${hint[0] + 1} 个瓶子倒到第 ${hint[1] + 1} 个瓶子`);
    }

    private resetLevel(): void {
        if (this.state !== GameState.PLAYING) {
            return;
        }
        this.selectBottle(-1);
        this.levelManager.reset();
        this.showStatus('本关已重置');
        this.refreshGameplay();
    }

    private completeLevel(): void {
        this.state = GameState.LEVEL_COMPLETE;
        const level = this.levelManager.currentLevel;
        if (!level) {
            console.error('[GameManager] level is null in completeLevel');
            return;
        }
        if (!this.popupLayer) {
            console.error('[GameManager] popupLayer is null in completeLevel');
            return;
        }

        const result = StorageManager.completeLevel(level.levelId, this.levelManager.steps, level.minSteps);
        void CloudSaveManager.uploadSave();

        this.createPanel(this.popupLayer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, '#000000', 0, 85, true);
        const popup = this.createPanel(this.popupLayer, new Vec3(0, 0, 0), 520, 600, '#FFFFFF', 24, 255, true);
        popup.setScale(new Vec3(0.75, 0.75, 1));
        this.createLabel(popup, '通关成功', 46, new Vec3(0, 210, 0), new Color(45, 52, 54));
        this.createStarRating(popup, result.stars, new Vec3(0, 136, 0));
        this.createLabel(popup, `步数 ${this.levelManager.steps} / 最优 ${level.minSteps}`, 28, new Vec3(0, 66, 0), new Color(83, 103, 112));
        this.createLabel(popup, `获得金币 +${result.coins}`, 30, new Vec3(0, -4, 0), new Color(235, 154, 35));
        const rewardNotice = this.createLabel(popup, '', 18, new Vec3(0, -58, 0), new Color(120, 132, 140), 420);
        this.createButton(popup, '双倍奖励', new Vec3(-125, -112, 0), 210, 66, '#FFEAA7', () => {
            rewardNotice.string = '激励视频广告将在微信构建接入后启用。';
        });
        this.createButton(popup, '下一关', new Vec3(125, -112, 0), 210, 66, '#4ECDC4', () => {
            this.popupLayer?.removeAllChildren();
            this.startLevel(level.levelId + 1);
        });
        this.createButton(popup, '分享炫耀', new Vec3(-125, -210, 0), 210, 58, '#E8F6F3', () => {
            void this.handleResultShare(level.levelId, this.levelManager.steps, result.stars, rewardNotice);
        }, new Color(45, 52, 54));
        this.createButton(popup, '返回选关', new Vec3(125, -210, 0), 210, 58, '#EAF4F4', () => {
            this.popupLayer?.removeAllChildren();
            void this.showLevelSelect();
        }, new Color(45, 52, 54));

        tween(popup).to(0.22, { scale: Vec3.ONE }).start();
    }

    private showPausePanel(): void {
        if ((this.state !== GameState.PLAYING && this.state !== GameState.PAUSED && this.state !== GameState.SETTINGS) || !this.popupLayer) {
            return;
        }

        this.state = GameState.PAUSED;
        this.popupLayer.removeAllChildren();
        this.createPanel(this.popupLayer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, '#000000', 0, 115)
            .on(Node.EventType.TOUCH_END, () => this.resumeGame());

        const panel = this.createPanel(this.popupLayer, Vec3.ZERO, 480, 560, '#FFFFFF', 24, 255, true);
        panel.setScale(new Vec3(0.78, 0.78, 1));
        this.createLabel(panel, '游戏暂停', 46, new Vec3(0, 205, 0), new Color(45, 52, 54));
        this.createButton(panel, '继续游戏', new Vec3(0, 112, 0), 320, 72, '#4ECDC4', () => this.resumeGame());
        this.createButton(panel, '重新开始', new Vec3(0, 18, 0), 320, 72, '#E8F6F3', () => {
            this.popupLayer?.removeAllChildren();
            this.state = GameState.PLAYING;
            this.resetLevel();
        });
        this.createButton(panel, '返回主菜单', new Vec3(0, -76, 0), 320, 72, '#E8F6F3', () => this.showReturnMainConfirm());
        this.createButton(panel, '设置', new Vec3(0, -178, 0), 160, 64, '#FFFFFF', () => this.showSettingsPanel(GameState.PAUSED), new Color(45, 52, 54));

        tween(panel).to(0.24, { scale: Vec3.ONE }).start();
    }

    private resumeGame(): void {
        if (this.state !== GameState.PAUSED) {
            return;
        }
        this.popupLayer?.removeAllChildren();
        this.state = GameState.PLAYING;
        this.showStatus('继续游戏');
    }

    private showReturnMainConfirm(): void {
        if (!this.popupLayer) {
            return;
        }

        this.popupLayer.removeAllChildren();
        this.createPanel(this.popupLayer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, '#000000', 0, 125, true);
        const panel = this.createPanel(this.popupLayer, Vec3.ZERO, 420, 260, '#FFFFFF', 24, 255, true);
        this.createLabel(panel, '确定要返回主菜单吗？', 30, new Vec3(0, 70, 0), new Color(45, 52, 54));
        this.createLabel(panel, '当前关卡进度不会保存。', 22, new Vec3(0, 18, 0), new Color(83, 103, 112));
        this.createButton(panel, '取消', new Vec3(-92, -72, 0), 150, 58, '#E8F6F3', () => this.showPausePanel());
        this.createButton(panel, '确定', new Vec3(92, -72, 0), 150, 58, '#4ECDC4', () => this.showMainMenu());
    }

    private showSettingsPanel(previousState: GameState): void {
        if (!this.popupLayer) {
            return;
        }

        this.previousStateBeforeSettings = previousState;
        this.state = GameState.SETTINGS;
        this.popupLayer.removeAllChildren();
        this.createPanel(this.popupLayer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, '#000000', 0, previousState === GameState.PAUSED ? 115 : 70, true);

        const save = StorageManager.load();
        const panel = this.createPanel(this.popupLayer, Vec3.ZERO, 520, 640, '#FFFFFF', 24, 255, true);
        panel.setScale(new Vec3(0.82, 0.82, 1));
        this.createLabel(panel, '设置', 46, new Vec3(0, 254, 0), new Color(45, 52, 54));
        this.createButton(panel, '×', new Vec3(210, 254, 0), 58, 52, '#E8F6F3', () => this.closeSettingsPanel());

        this.createToggleRow(panel, '音乐', new Vec3(0, 165, 0), save.settings.musicEnabled, (enabled) => {
            save.settings.musicEnabled = enabled;
            StorageManager.save(save);
            void CloudSaveManager.uploadSave();
        });
        this.createToggleRow(panel, '音效', new Vec3(0, 82, 0), save.settings.soundEnabled, (enabled) => {
            save.settings.soundEnabled = enabled;
            StorageManager.save(save);
            void CloudSaveManager.uploadSave();
        });
        this.createToggleRow(panel, '震动', new Vec3(0, -1, 0), save.settings.vibrationEnabled, (enabled) => {
            save.settings.vibrationEnabled = enabled;
            StorageManager.save(save);
            void CloudSaveManager.uploadSave();
        });

        this.createPanel(panel, new Vec3(0, -62, 0), 440, 2, '#E8F6F3', 1);
        this.createButton(panel, '适龄提示 (12+)', new Vec3(0, -122, 0), 400, 58, '#F8F9FA', () => this.showAgeTipPanel());
        this.createButton(panel, '隐私协议', new Vec3(0, -192, 0), 400, 58, '#F8F9FA', () => this.showInfoPanel('隐私协议', '隐私协议将在微信小游戏发布前接入正式页面。'));
        this.createButton(panel, '去广告特权 ¥6.00', new Vec3(0, -262, 0), 400, 58, '#FFEAA7', () => this.showInfoPanel('去广告特权', '内购将在微信支付接入后开放。'));
        this.createButton(panel, 'GM', new Vec3(-198, -306, 0), 74, 42, '#E8F6F3', () => this.showGmPanel());
        this.createButton(panel, '同步', new Vec3(-106, -306, 0), 74, 42, '#E8F6F3', () => {
            void this.handleManualSync();
        });
        this.createLabel(panel, `版本 ${GAME_CONFIG.VERSION}`, 20, new Vec3(32, -306, 0), new Color(178, 190, 195), 260);

        tween(panel).to(0.24, { scale: Vec3.ONE }).start();
    }

    private closeSettingsPanel(): void {
        if (this.previousStateBeforeSettings === GameState.PAUSED) {
            this.showPausePanel();
            return;
        }

        this.popupLayer?.removeAllChildren();
        this.state = this.previousStateBeforeSettings;
    }

    private showAgeTipPanel(): void {
        if (!this.popupLayer) {
            return;
        }

        const restoreSettings = this.state === GameState.SETTINGS;
        this.popupLayer.removeAllChildren();
        this.createPanel(this.popupLayer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, '#000000', 0, 105, true);
        const panel = this.createPanel(this.popupLayer, Vec3.ZERO, 560, 480, '#FFFFFF', 24, 255, true);
        this.createLabel(panel, '适龄提示', 42, new Vec3(0, 160, 0), new Color(45, 52, 54));
        this.createLabel(panel, '《倒水大师》适用于 12 周岁及以上用户。游戏为轻度益智解谜内容，不含真实支付引导内容；请合理安排游戏时间。', 24, new Vec3(0, 40, 0), new Color(83, 103, 112), 455);
        this.createButton(panel, '我知道了', new Vec3(0, -150, 0), 220, 64, '#4ECDC4', () => {
            this.popupLayer?.removeAllChildren();
            if (restoreSettings) {
                this.showSettingsPanel(this.previousStateBeforeSettings);
            }
        });
    }

    private showInfoPanel(title: string, message: string): void {
        if (!this.popupLayer) {
            return;
        }

        const stateBeforeInfo = this.state;
        this.popupLayer.removeAllChildren();
        this.createPanel(this.popupLayer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, '#000000', 0, 88, true);
        const panel = this.createPanel(this.popupLayer, Vec3.ZERO, 500, 340, '#FFFFFF', 24, 255, true);
        panel.setScale(new Vec3(0.85, 0.85, 1));
        this.createLabel(panel, title, 38, new Vec3(0, 104, 0), new Color(45, 52, 54));
        this.createLabel(panel, message, 24, new Vec3(0, 16, 0), new Color(83, 103, 112), 410);
        this.createButton(panel, '知道了', new Vec3(0, -104, 0), 190, 58, '#4ECDC4', () => {
            this.popupLayer?.removeAllChildren();
            if (stateBeforeInfo === GameState.SETTINGS) {
                this.showSettingsPanel(this.previousStateBeforeSettings);
            } else {
                this.state = stateBeforeInfo;
            }
        });
        tween(panel).to(0.2, { scale: Vec3.ONE }).start();
    }

    private showRankPanel(): void {
        if (!this.popupLayer) {
            return;
        }

        this.state = GameState.MAIN_MENU;
        this.popupLayer.removeAllChildren();
        this.createPanel(this.popupLayer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, '#000000', 0, 88, true);
        const panel = this.createPanel(this.popupLayer, Vec3.ZERO, 540, 620, '#FFFFFF', 24, 255, true);
        panel.setScale(new Vec3(0.86, 0.86, 1));
        this.createLabel(panel, '好友排行', 42, new Vec3(0, 250, 0), new Color(45, 52, 54));
        this.createButton(panel, '好友', new Vec3(-96, 184, 0), 150, 54, '#4ECDC4', () => this.showRankPanel());
        this.createButton(panel, '周排行', new Vec3(96, 184, 0), 150, 54, '#E8F6F3', () => {
            this.showInfoPanel('周排行', '周排行将在开放数据域周榜字段接入后启用。');
        }, new Color(45, 52, 54));

        const entries = RankManager.openFriendRank();
        this.createRankRows(panel, entries);
        this.createLabel(panel, WXAPI.available ? '微信开放数据域绘制中' : '编辑器预览数据', 20, new Vec3(0, -202, 0), new Color(120, 140, 148), 420);
        this.createButton(panel, '返回', new Vec3(0, -258, 0), 200, 58, '#E8F6F3', () => {
            RankManager.closeRank();
            this.popupLayer?.removeAllChildren();
            this.state = GameState.MAIN_MENU;
        }, new Color(45, 52, 54));
        tween(panel).to(0.2, { scale: Vec3.ONE }).start();
    }

    private createRankRows(parent: Node, entries: RankEntry[]): void {
        entries.slice(0, 5).forEach((entry, index) => {
            const y = 112 - index * 66;
            const row = this.createPanel(parent, new Vec3(0, y, 0), 430, 54, entry.isSelf ? '#E8F6F3' : '#F8F9FA', 16, 255, true);
            this.createLabel(row, `${index + 1}`, 24, new Vec3(-178, 0, 0), new Color(83, 103, 112), 44);
            this.createLabel(row, entry.nickname, 24, new Vec3(-70, 0, 0), new Color(45, 52, 54), 160);
            this.createLabel(row, `${entry.stars}星`, 24, new Vec3(70, 0, 0), new Color(235, 154, 35), 100);
            this.createLabel(row, `关卡${entry.level}`, 22, new Vec3(158, 0, 0), new Color(83, 103, 112), 110);
        });
    }

    private async handleMainShare(): Promise<void> {
        const save = StorageManager.load();
        const result = await ShareManager.share('main_help', { levelId: save.currentLevel });
        WXAPI.showToast(result.message, result.rewarded ? 'success' : 'none');
        this.showMainMenu();
    }

    private async handleResultShare(levelId: number, steps: number, stars: number, notice: Label): Promise<void> {
        const result = await ShareManager.share('result_showoff', { levelId, steps, stars });
        notice.string = result.message;
    }

    private async handleManualSync(): Promise<void> {
        const success = await SDKManager.loginAndSync();
        WXAPI.showToast(success ? '登录与云同步完成' : '正在同步或同步失败', success ? 'success' : 'none');
        this.showSettingsPanel(this.previousStateBeforeSettings);
    }

    private showGmPanel(): void {
        if (!this.popupLayer) {
            return;
        }

        this.state = GameState.SETTINGS;
        this.popupLayer.removeAllChildren();
        this.createPanel(this.popupLayer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, '#000000', 0, 100, true);
        const panel = this.createPanel(this.popupLayer, Vec3.ZERO, 560, 600, '#FFFFFF', 24, 255, true);
        panel.setScale(new Vec3(0.86, 0.86, 1));
        this.createLabel(panel, 'GM 工具', 42, new Vec3(0, 238, 0), new Color(45, 52, 54));
        const summaryBox = this.createPanel(panel, new Vec3(0, 72, 0), 470, 260, '#F8F9FA', 18, 255, true);
        this.createMultilineLabel(summaryBox, StorageManager.getDebugSummary(), 24, Vec3.ZERO, new Color(83, 103, 112), 420, 220);
        this.createButton(panel, '重置存档', new Vec3(0, -128, 0), 260, 64, '#FF7675', () => this.showResetSaveConfirm());
        this.createButton(panel, '返回设置', new Vec3(0, -218, 0), 220, 58, '#E8F6F3', () => this.showSettingsPanel(this.previousStateBeforeSettings));
        tween(panel).to(0.2, { scale: Vec3.ONE }).start();
    }

    private showResetSaveConfirm(): void {
        if (!this.popupLayer) {
            return;
        }

        this.popupLayer.removeAllChildren();
        this.createPanel(this.popupLayer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, '#000000', 0, 125, true);
        const panel = this.createPanel(this.popupLayer, Vec3.ZERO, 500, 300, '#FFFFFF', 24, 255, true);
        this.createLabel(panel, '确认重置存档？', 34, new Vec3(0, 82, 0), new Color(45, 52, 54));
        this.createLabel(panel, '这会把关卡进度、金币、钻石、签到和设置恢复到初始状态。', 22, new Vec3(0, 18, 0), new Color(120, 70, 70), 410);
        this.createButton(panel, '取消', new Vec3(-105, -86, 0), 160, 58, '#E8F6F3', () => this.showGmPanel());
        this.createButton(panel, '确认重置', new Vec3(105, -86, 0), 180, 58, '#FF7675', () => this.resetSaveAndReturn());
    }

    private resetSaveAndReturn(): void {
        StorageManager.resetToDefault();
        void CloudSaveManager.uploadSave();
        this.popupLayer?.removeAllChildren();
        this.showMainMenu();
        this.showInfoPanel('存档已重置', '测试存档已恢复到初始状态。再次开始游戏会从第1关进入。');
    }

    private createToggleRow(parent: Node, labelText: string, position: Vec3, initialValue: boolean, onChange: (enabled: boolean) => void): void {
        this.createLabel(parent, labelText, 30, new Vec3(position.x - 150, position.y, 0), new Color(45, 52, 54), 150);
        let enabled = initialValue;
        const switchNode = this.createToggleButton(
            parent,
            new Vec3(position.x + 155, position.y, 0),
            enabled,
            () => {
                enabled = !enabled;
                onChange(enabled);
                updateVisual(enabled);
            },
        );
        switchNode.name = `Toggle_${labelText}`;

        const label = switchNode.getChildByName('Label')?.getComponent(Label) ?? null;
        const graphics = switchNode.getComponent(Graphics);
        const updateVisual = (value: boolean): void => {
            if (graphics) {
                graphics.clear();
                graphics.fillColor = colorFromHex(value ? '#4ECDC4' : '#DFE6E9');
                graphics.roundRect(-48, -26, 96, 52, 18);
                graphics.fill();
            }
            if (label) {
                label.string = value ? '开' : '关';
                label.color = value ? Color.WHITE : new Color(83, 103, 112);
            }
            tween(switchNode)
                .to(0.05, { scale: new Vec3(0.94, 0.94, 1) })
                .to(0.08, { scale: Vec3.ONE })
                .start();
        };
    }

    private createToggleButton(parent: Node, position: Vec3, enabled: boolean, onClick: () => void): Node {
        const node = this.createPanel(parent, position, 96, 52, enabled ? '#4ECDC4' : '#DFE6E9', 18);
        node.on(Node.EventType.TOUCH_END, onClick);
        this.createLabel(node, enabled ? '开' : '关', 26, Vec3.ZERO, enabled ? Color.WHITE : new Color(83, 103, 112), 84);
        return node;
    }

    private createQuickMenuButton(text: string, position: Vec3, onClick: () => void): void {
        if (!this.viewRoot) {
            return;
        }

        this.createButton(this.viewRoot, text, position, 104, 74, '#FFFFFF', onClick, new Color(45, 52, 54));
    }

    private createStarRating(parent: Node, earnedStars: number, position: Vec3): void {
        const spacing = 80;
        const startX = -spacing;

        for (let i = 0; i < 3; i += 1) {
            const x = startX + i * spacing;
            this.createLabel(parent, '☆', 64, new Vec3(position.x + x, position.y, 0), new Color(178, 190, 195), 76);

            if (i >= earnedStars) {
                continue;
            }

            const star = this.createLabel(parent, '★', 64, new Vec3(position.x + x, position.y, 0), new Color(255, 193, 7), 76);
            const starNode = star.node;
            starNode.setScale(Vec3.ZERO);
            const delay = 0.5 + i * GAME_CONFIG.ANIMATION.STAR_INTERVAL;

            tween(starNode)
                .delay(delay)
                .to(0.25, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
                .to(0.15, { scale: Vec3.ONE }, { easing: 'quadOut' })
                .call(() => this.playStarSparkles(starNode))
                .start();
        }
    }

    private playStarSparkles(parent: Node): void {
        const sparklePositions = [
            new Vec3(0, 46, 0),
            new Vec3(38, 26, 0),
            new Vec3(38, -24, 0),
            new Vec3(0, -44, 0),
            new Vec3(-38, -24, 0),
            new Vec3(-38, 26, 0),
        ];

        sparklePositions.forEach((target, index) => {
            const sparkle = this.createLabel(parent, '✦', 18, Vec3.ZERO, new Color(255, 224, 130), 24);
            const node = sparkle.node;
            node.setScale(Vec3.ZERO);
            tween(node)
                .delay(index * 0.025)
                .to(0.12, { position: target, scale: new Vec3(0.9, 0.9, 1) }, { easing: 'quadOut' })
                .to(0.22, { scale: Vec3.ZERO }, { easing: 'quadIn' })
                .call(() => node.destroy())
                .start();
        });
    }

    private handleDailyCheckIn(): void {
        const save = StorageManager.load();
        const today = this.getLocalDateKey();
        if (save.dailyCheckIn.lastCheckInDate === today) {
            this.showInfoPanel('每日签到', '今日已经签到过了，明天再来领取奖励吧。');
            return;
        }

        const rewards = [
            { coins: 50, diamonds: 0 },
            { coins: 100, diamonds: 0 },
            { coins: 0, diamonds: 10 },
            { coins: 200, diamonds: 0 },
            { coins: 50, diamonds: 0 },
            { coins: 0, diamonds: 20 },
            { coins: 500, diamonds: 0 },
        ];
        const dayIndex = save.dailyCheckIn.consecutiveDays % rewards.length;
        const reward = rewards[dayIndex];

        save.dailyCheckIn.lastCheckInDate = today;
        save.dailyCheckIn.consecutiveDays += 1;
        save.dailyCheckIn.checkInHistory[dayIndex] = true;
        save.coins = Math.min(GAME_CONFIG.ECONOMY.COIN_CAP, save.coins + reward.coins);
        save.diamonds = Math.min(GAME_CONFIG.ECONOMY.DIAMOND_CAP, save.diamonds + reward.diamonds);
        StorageManager.save(save);
        void CloudSaveManager.uploadSave();

        const rewardText = reward.diamonds > 0 ? `${reward.diamonds} 钻石` : `${reward.coins} 金币`;
        this.showInfoPanel('签到成功', `第 ${dayIndex + 1} 天签到奖励：${rewardText}`);
    }

    private getAchievementSummary(): string {
        const save = StorageManager.load();
        const completed = save.statistics.totalLevelsCompleted;
        const threeStars = Object.keys(save.levelStars).filter((key) => save.levelStars[Number(key)] >= 3).length;
        return `当前已通关 ${completed} 关，三星 ${threeStars} 个。成就奖励将在后续版本开放领取。`;
    }

    private getLocalDateKey(): string {
        const date = new Date();
        const year = date.getFullYear();
        const rawMonth = `${date.getMonth() + 1}`;
        const rawDay = `${date.getDate()}`;
        const month = rawMonth.length === 1 ? `0${rawMonth}` : rawMonth;
        const day = rawDay.length === 1 ? `0${rawDay}` : rawDay;
        return `${year}-${month}-${day}`;
    }

    private clearView(): void {
        this.viewRoot?.removeAllChildren();
        this.popupLayer?.removeAllChildren();
        this.bottleLayer = null;
        this.bottles = [];
        this.statusLabel = null;
        this.lastTapIndex = -1;
        this.lastTapTime = 0;
    }

    private showStatus(message: string): void {
        if (!this.statusLabel) {
            return;
        }
        this.statusLabel.string = message;
        const node = this.statusLabel.node;
        tween(node)
            .to(0.08, { scale: new Vec3(1.04, 1.04, 1) })
            .to(0.12, { scale: Vec3.ONE })
            .start();
    }

    private drawBackground(hex: string): void {
        const layer = this.background;
        if (!layer) {
            console.error('[GameManager] background is null in drawBackground');
            return;
        }
        layer.removeAllChildren();
        this.createPanel(layer, Vec3.ZERO, this.canvasSize.width, this.canvasSize.height, hex, 0);

        const wave = new Node('SoftWave');
        layer.addChild(wave);
        wave.setPosition(0, -360);
        const graphics = wave.addComponent(Graphics);
        graphics.fillColor = colorFromHex('#FFFFFF', 95);
        graphics.roundRect(-380, -64, 760, 128, 64);
        graphics.fill();
        wave.angle = -8;
    }

    private createLayer(name: string, parent: Node = this.node): Node {
        const layer = new Node(name);
        parent.addChild(layer);
        const transform = layer.addComponent(UITransform);
        transform.setContentSize(this.canvasSize.width, this.canvasSize.height);
        layer.setPosition(Vec3.ZERO);
        return layer;
    }

    private createPanel(parent: Node, position: Vec3, width: number, height: number, hex: string, radius = 24, alpha = 255, swallow = false): Node {
        const node = new Node('Panel');
        parent.addChild(node);
        node.setPosition(position);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);

        const graphics = node.addComponent(Graphics);
        graphics.fillColor = colorFromHex(hex, alpha);
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        graphics.fill();
        if (swallow) {
            this.swallowTouches(node);
        }
        return node;
    }

    private swallowTouches(node: Node): void {
        const stop = (event: EventTouch): void => {
            event.propagationStopped = true;
        };
        node.on(Node.EventType.TOUCH_START, stop);
        node.on(Node.EventType.TOUCH_MOVE, stop);
        node.on(Node.EventType.TOUCH_END, stop);
        node.on(Node.EventType.TOUCH_CANCEL, stop);
    }

    private createButton(
        parent: Node,
        text: string,
        position: Vec3,
        width: number,
        height: number,
        hex: string,
        onClick: () => void,
        textColor: Color | null = null,
    ): Node {
        const node = this.createPanel(parent, position, width, height, hex, 18);
        node.name = `Button_${text}`;
        node.on(Node.EventType.TOUCH_END, () => {
            tween(node)
                .to(0.05, { scale: new Vec3(0.94, 0.94, 1) })
                .to(0.08, { scale: Vec3.ONE })
                .call(onClick)
                .start();
        });
        this.createLabel(node, text, text.includes('\n') ? 22 : 28, Vec3.ZERO, textColor ?? this.getReadableTextColor(hex), width - 12);
        return node;
    }

    private getReadableTextColor(hex: string): Color {
        const color = colorFromHex(hex);
        const luminance = (color.r * 0.299 + color.g * 0.587 + color.b * 0.114) / 255;
        return luminance > 0.72 ? new Color(45, 52, 54) : Color.WHITE;
    }

    private createLabel(parent: Node, text: string, fontSize: number, position: Vec3, color: Color, width = 520): Label {
        const node = new Node('Label');
        parent.addChild(node);
        node.setPosition(position);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, Math.max(48, fontSize * 2.2));

        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.floor(fontSize * 1.22);
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private createMultilineLabel(parent: Node, text: string, fontSize: number, position: Vec3, color: Color, width: number, height: number): Label {
        const node = new Node('Label');
        parent.addChild(node);
        node.setPosition(position);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);

        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.floor(fontSize * 1.35);
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.LEFT;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.CLAMP;
        return label;
    }
}
