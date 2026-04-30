import { _decorator, Color, Component, Graphics, Node, Tween, tween, UITransform, Vec3 } from 'cc';
import { colorFromHex } from '../Utils/ColorUtils';

const { ccclass } = _decorator;

@ccclass('Bottle')
export class Bottle extends Component {
    private index = 0;
    private capacity = 4;
    private colors: string[] = [];
    private state: number[] = [];
    private selected = false;
    private clickHandler: ((index: number) => void) | null = null;
    private graphics: Graphics | null = null;

    /** 基础位置（未选中时的位置） */
    private basePosition = Vec3.ZERO;
    /** 选中时的上浮偏移 */
    private static readonly SELECTED_OFFSET = 14;

    initialize(index: number, capacity: number, colors: string[], onClick: (index: number) => void): void {
        this.index = index;
        this.capacity = capacity;
        this.colors = colors;
        this.clickHandler = onClick;

        let transform = this.getComponent(UITransform);
        if (!transform) {
            transform = this.addComponent(UITransform);
        }
        transform.setContentSize(112, 240);

        this.graphics = this.getComponent(Graphics) ?? this.addComponent(Graphics);
        this.node.off(Node.EventType.TOUCH_END);
        this.node.on(Node.EventType.TOUCH_END, this.handleTouch, this);

        // 记录初始位置作为基础位置
        this.basePosition = this.node.position.clone();
    }

    setState(state: number[]): void {
        this.state = state.slice();
        this.render();
    }

    getTopColorId(): number | null {
        return this.state.length > 0 ? this.state[this.state.length - 1] : null;
    }

    getTopColorCount(): number {
        const top = this.getTopColorId();
        if (top === null) {
            return 0;
        }

        let count = 0;
        for (let i = this.state.length - 1; i >= 0; i -= 1) {
            if (this.state[i] !== top) {
                break;
            }
            count += 1;
        }
        return count;
    }

    getRemainingSpace(): number {
        return this.capacity - this.state.length;
    }

    isEmpty(): boolean {
        return this.state.length === 0;
    }

    isUniform(): boolean {
        return this.state.length === 0 || this.state.every((item) => item === this.state[0]);
    }

    setSelected(selected: boolean): void {
        if (this.selected === selected) {
            return;
        }
        this.selected = selected;

        // 停止当前节点上的所有 tween，避免冲突
        Tween.stopAllByTarget(this.node);

        const targetY = this.basePosition.y + (selected ? Bottle.SELECTED_OFFSET : 0);
        tween(this.node)
            .to(0.12, { position: new Vec3(this.basePosition.x, targetY, 0) })
            .start();

        this.render();
    }

    playShake(): void {
        // 停止当前节点上的所有 tween，避免与选中动画冲突
        Tween.stopAllByTarget(this.node);

        // 计算当前基准Y（根据选中状态）
        const baseY = this.basePosition.y + (this.selected ? Bottle.SELECTED_OFFSET : 0);

        tween(this.node)
            .to(0.05, { position: new Vec3(this.basePosition.x - 12, baseY, 0) })
            .to(0.05, { position: new Vec3(this.basePosition.x + 12, baseY, 0) })
            .to(0.05, { position: new Vec3(this.basePosition.x - 8, baseY, 0) })
            .to(0.05, { position: new Vec3(this.basePosition.x, baseY, 0) })
            .start();
    }

    private handleTouch(): void {
        this.clickHandler?.(this.index);
    }

    private render(): void {
        const graphics = this.graphics;
        if (!graphics) {
            return;
        }

        const width = 94;
        const height = 212;
        const x = -width / 2;
        const y = -height / 2;
        const wall = 7;
        const liquidGap = 3;
        const liquidWidth = width - wall * 2;
        const liquidHeight = (height - 24 - liquidGap * (this.capacity - 1)) / this.capacity;

        graphics.clear();

        // 选中状态外发光
        if (this.selected) {
            graphics.fillColor = new Color(255, 211, 92, 70);
            graphics.roundRect(x - 13, y - 15, width + 26, height + 30, 22);
            graphics.fill();
        }

        // 液体块
        for (let i = 0; i < this.state.length; i += 1) {
            const colorId = this.state[i];
            const liquidY = y + wall + i * (liquidHeight + liquidGap);
            graphics.fillColor = colorFromHex(this.colors[colorId - 1] ?? '#9AA6B2', 238);
            graphics.roundRect(x + wall, liquidY, liquidWidth, liquidHeight, 8);
            graphics.fill();
        }

        // 瓶身外框
        graphics.lineWidth = 5;
        graphics.strokeColor = new Color(255, 255, 255, 210);
        graphics.roundRect(x, y, width, height, 18);
        graphics.stroke();

        // 瓶身内框
        graphics.lineWidth = 2;
        graphics.strokeColor = new Color(105, 132, 145, 130);
        graphics.roundRect(x + 2, y + 2, width - 4, height - 4, 16);
        graphics.stroke();
    }
}
