import { Color, Graphics, Node, tween, UITransform, Vec3 } from 'cc';
import { colorFromHex } from '../Utils/ColorUtils';

export class PourController {
    static playFlow(parent: Node, from: Vec3, to: Vec3, colorHex: string, count: number): Promise<void> {
        const flow = new Node('PourFlow');
        parent.addChild(flow);
        flow.setPosition(from);

        const transform = flow.addComponent(UITransform);
        transform.setContentSize(28, Math.max(56, count * 34));

        const graphics = flow.addComponent(Graphics);
        const height = transform.contentSize.height;
        graphics.fillColor = colorFromHex(colorHex, 220);
        graphics.roundRect(-10, -height / 2, 20, height, 10);
        graphics.fill();
        graphics.strokeColor = new Color(255, 255, 255, 80);
        graphics.lineWidth = 2;
        graphics.moveTo(7, -height / 2 + 8);
        graphics.lineTo(7, height / 2 - 8);
        graphics.stroke();

        return new Promise((resolve) => {
            tween(flow)
                .to(0.22, { position: to, angle: -18 })
                .to(0.12, { scale: new Vec3(0.7, 0.7, 1) })
                .call(() => {
                    flow.destroy();
                    resolve();
                })
                .start();
        });
    }
}
