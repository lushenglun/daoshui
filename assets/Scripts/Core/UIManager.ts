import { Node } from 'cc';

export class UIManager {
    private static popupRoot: Node | null = null;

    static bindPopupRoot(root: Node): void {
        this.popupRoot = root;
    }

    static clearPopups(): void {
        this.popupRoot?.removeAllChildren();
    }
}

