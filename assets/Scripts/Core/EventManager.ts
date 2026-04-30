type Handler<T = unknown> = (payload: T) => void;

interface HandlerEntry {
    handler: Handler;
    once: boolean;
}

export class EventManager {
    private static handlers = new Map<string, Set<HandlerEntry>>();

    static on<T>(eventName: string, handler: Handler<T>): void {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, new Set());
        }
        this.handlers.get(eventName)!.add({ handler: handler as Handler, once: false });
    }

    static once<T>(eventName: string, handler: Handler<T>): void {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, new Set());
        }
        this.handlers.get(eventName)!.add({ handler: handler as Handler, once: true });
    }

    static off<T>(eventName: string, handler: Handler<T>): void {
        const set = this.handlers.get(eventName);
        if (!set) return;
        for (const entry of set) {
            if (entry.handler === handler) {
                set.delete(entry);
                break;
            }
        }
    }

    static offAll(eventName: string): void {
        this.handlers.delete(eventName);
    }

    static emit<T>(eventName: string, payload?: T): void {
        const set = this.handlers.get(eventName);
        if (!set) return;
        const toRemove: HandlerEntry[] = [];
        set.forEach((entry) => {
            entry.handler(payload);
            if (entry.once) {
                toRemove.push(entry);
            }
        });
        toRemove.forEach((entry) => set.delete(entry));
    }

    static clear(): void {
        this.handlers.clear();
    }
}

