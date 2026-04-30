import { StorageManager } from '../Core/StorageManager';
import { WXAPI } from './WXAPI';

export interface RankEntry {
    nickname: string;
    stars: number;
    level: number;
    isSelf: boolean;
}

export class RankManager {
    static openFriendRank(): RankEntry[] {
        const save = StorageManager.load();
        const self: RankEntry = {
            nickname: '我',
            stars: StorageManager.getTotalStars(save),
            level: save.currentLevel,
            isSelf: true,
        };

        WXAPI.postOpenDataContextMessage({
            type: 'showFriendRank',
            metric: 'totalStars',
            self,
        });

        return [
            self,
            { nickname: '好友A', stars: Math.max(0, self.stars - 2), level: Math.max(1, self.level - 1), isSelf: false },
            { nickname: '好友B', stars: Math.max(0, self.stars - 5), level: Math.max(1, self.level - 2), isSelf: false },
        ].sort((a, b) => b.stars - a.stars || b.level - a.level);
    }

    static closeRank(): void {
        WXAPI.postOpenDataContextMessage({ type: 'hideFriendRank' });
    }
}
