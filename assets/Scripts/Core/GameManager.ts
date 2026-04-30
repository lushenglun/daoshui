import {
    _decorator,
    Color,
    Component,
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
    private totalLevelCount = 0;

    private background: Node | null = null;
    private viewRoot: Node | null = null;
    private bottleLayer: Node | null = null;
    private popupLayer: Node | null = null;
    private stepLabel: Label | null = null;
    private levelLabel: Label | null = null;
    private coinLabel: Label | null = null;
    private bottles: Bottle[] = [];

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
        this.createButton(this.viewRoot, '选择关卡', new Vec3(0, 56, 0), 240, 68, '#45B7D1', () => this.showLevelSelect());
        this.createButton(this.viewRoot, '分享求助', new Vec3(0, -44, 0), 240, 68, '#96CEB4', () => {
            WXAPI.showToast('微信环境中可分享', 'none');
        });

        this.createLabel(this.viewRoot, `金币 ${StorageManager.load().coins}`, 28, new Vec3(0, -188, 0), new Color(64, 82, 90));
        this.createLabel(this.viewRoot, 'v1.0 核心玩法版', 22, new Vec3(0, -520, 0), new Color(120, 140, 148));
    }

    private showLevelSelect(): void {
        this.state = GameState.LEVEL_SELECT;
        this.clearView();
        this.drawBackground('#E8F6F3');

        if (!this.viewRoot) {
            console.error('[GameManager] viewRoot is null in showLevelSelect');
            return;
        }

        this.createButton(this.viewRoot, '<', new Vec3(-300, 520, 0), 72, 58, '#4ECDC4', () => this.showMainMenu());
        this.createLabel(this.viewRoot, '选择关卡', 42, new Vec3(0, 520, 0), new Color(45, 52, 54));

        const save = StorageManager.load();
        // 总关卡数从已加载的章节数据中获取，若未加载则使用默认值150
        const totalLevels = this.levelManager.currentChapter
            ? this.getTotalLevelCount()
            : 150;
        const maxLevel = Math.min(totalLevels, Math.max(25, save.currentLevel + 8));
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

    private getTotalLevelCount(): number {
        if (this.totalLevelCount > 0) {
            return this.totalLevelCount;
        }
        // 从已加载的关卡数据中统计
        const chapterIds = [1, 2, 3, 4];
        let count = 0;
        for (const chapterId of chapterIds) {
            const asset = this.levelManager['chapterCache']?.get?.(chapterId);
            if (asset) {
                count += asset.levels?.length ?? 0;
            }
        }
        // 若未缓存则使用默认值
        this.totalLevelCount = count > 0 ? count : 150;
        return this.totalLevelCount;
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

        this.createButton(this.viewRoot, '<', new Vec3(-310, 540, 0), 64, 54, '#FFFFFF', () => this.showLevelSelect());
        this.levelLabel = this.createLabel(this.viewRoot, '', 34, new Vec3(0, 545, 0), new Color(45, 52, 54));
        this.coinLabel = this.createLabel(this.viewRoot, '', 24, new Vec3(250, 545, 0), new Color(64, 82, 90));

        this.stepLabel = this.createLabel(this.viewRoot, '', 28, new Vec3(0, 475, 0), new Color(64, 82, 90));
        this.createButton(this.viewRoot, '撤销', new Vec3(-190, 410, 0), 128, 56, '#FFFFFF', () => this.undo());
        this.createButton(this.viewRoot, '提示', new Vec3(0, 410, 0), 128, 56, '#FFFFFF', () => this.showHint());
        this.createButton(this.viewRoot, '重置', new Vec3(190, 410, 0), 128, 56, '#FFFFFF', () => this.resetLevel());

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
        if (this.selectedBottle < 0) {
            if (state.length === 0) {
                return;
            }
            this.selectBottle(index);
            return;
        }

        if (this.selectedBottle === index) {
            this.selectBottle(-1);
            return;
        }

        if (!this.levelManager.canPour(this.selectedBottle, index)) {
            this.bottles[index]?.playShake();
            WXAPI.vibrateShort();
            return;
        }

        const fromIndex = this.selectedBottle;
        const action = this.levelManager.pour(fromIndex, index);
        if (!action) {
            return;
        }

        this.isAnimating = true;
        const fromPos = this.bottles[fromIndex].node.position.clone();
        const toPos = this.bottles[index].node.position.clone();
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
            WXAPI.showToast('没有可撤销的步骤', 'none');
            return;
        }
        this.selectBottle(-1);
        this.refreshGameplay();
    }

    private showHint(): void {
        if (this.state !== GameState.PLAYING || this.isAnimating) {
            return;
        }
        const hint = this.levelManager.getHint();
        if (!hint) {
            WXAPI.showToast('暂时没有提示', 'none');
            return;
        }
        this.selectBottle(hint[0]);
        this.bottles[hint[1]]?.playShake();
    }

    private resetLevel(): void {
        if (this.state !== GameState.PLAYING) {
            return;
        }
        this.selectBottle(-1);
        this.levelManager.reset();
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

        const popup = this.createPanel(this.popupLayer, new Vec3(0, 0, 0), 520, 560, '#FFFFFF');
        popup.setScale(new Vec3(0.75, 0.75, 1));
        this.createLabel(popup, '通关成功', 46, new Vec3(0, 190, 0), new Color(45, 52, 54));
        this.createLabel(popup, '★'.repeat(result.stars), 52, new Vec3(0, 115, 0), new Color(255, 193, 7));
        this.createLabel(popup, `步数 ${this.levelManager.steps} / 最优 ${level.minSteps}`, 28, new Vec3(0, 42, 0), new Color(83, 103, 112));
        this.createLabel(popup, `获得金币 +${result.coins}`, 30, new Vec3(0, -28, 0), new Color(235, 154, 35));
        this.createButton(popup, '下一关', new Vec3(0, -125, 0), 220, 66, '#4ECDC4', () => {
            this.popupLayer?.removeAllChildren();
            this.startLevel(level.levelId + 1);
        });
        this.createButton(popup, '选关', new Vec3(0, -210, 0), 180, 58, '#EAF4F4', () => {
            this.popupLayer?.removeAllChildren();
            this.showLevelSelect();
        }, new Color(45, 52, 54));

        tween(popup).to(0.22, { scale: Vec3.ONE }).start();
    }

    private clearView(): void {
        this.viewRoot?.removeAllChildren();
        this.popupLayer?.removeAllChildren();
        this.bottleLayer = null;
        this.bottles = [];
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

    private createPanel(parent: Node, position: Vec3, width: number, height: number, hex: string, radius = 24): Node {
        const node = new Node('Panel');
        parent.addChild(node);
        node.setPosition(position);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);

        const graphics = node.addComponent(Graphics);
        graphics.fillColor = colorFromHex(hex);
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        graphics.fill();
        return node;
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
}
