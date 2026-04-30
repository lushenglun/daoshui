import { assetManager, JsonAsset, resources } from 'cc';
import { ChapterConfig, LevelConfig } from '../Data/LevelConfig';
import { PourAction } from '../Data/GameData';
import { canPour, cloneState, findHint, isSolved, pour } from './WaterSortRules';

export class LevelManager {
    private readonly chapterIds = [1, 2, 3, 4];
    private readonly chapterCache = new Map<number, ChapterConfig>();
    /**
     * 章节 JSON 的固定 UUID（来自 `assets/Resources/Levels/chapter*.json.meta`）
     * 用于在 `resources.load` 失效时的兜底加载（避免受 resources 目录识别/缓存影响）。
     */
    private readonly chapterJsonUuids: Record<number, string> = {
        1: '3167b351-5c05-4506-819c-53f144374693',
        2: 'e390a4f1-fbd5-443f-bcfd-0b02ef8f6056',
        3: 'fa501ecb-6327-4a08-bc03-aa29d4159856',
        4: '8d6e686f-1820-4be6-8ae8-36799fd8fb89',
    };
    currentChapter: ChapterConfig | null = null;
    currentLevel: LevelConfig | null = null;
    currentState: number[][] = [];
    initialState: number[][] = [];
    undoStack: PourAction[] = [];
    steps = 0;

    async loadLevel(levelId: number): Promise<LevelConfig> {
        const result = await this.findLevel(levelId);

        if (!result) {
            throw new Error(`Level ${levelId} not found in bundled chapters.`);
        }

        const { chapter, level } = result;
        this.currentChapter = chapter;
        this.currentLevel = level;
        this.initialState = cloneState(level.initialState);
        this.currentState = cloneState(level.initialState);
        this.undoStack = [];
        this.steps = 0;
        return level;
    }

    canPour(fromIndex: number, toIndex: number): boolean {
        return this.currentLevel
            ? canPour(this.currentState, this.currentLevel.bottleCapacity, fromIndex, toIndex)
            : false;
    }

    pour(fromIndex: number, toIndex: number): PourAction | null {
        if (!this.currentLevel) {
            return null;
        }

        const action = pour(this.currentState, this.currentLevel.bottleCapacity, fromIndex, toIndex);
        if (!action) {
            return null;
        }

        this.currentState = cloneState(action.afterState);
        this.undoStack.push(action);
        this.steps += 1;
        return action;
    }

    undo(): PourAction | null {
        const action = this.undoStack.pop();
        if (!action) {
            return null;
        }

        this.currentState = cloneState(action.beforeState);
        this.steps = Math.max(0, this.steps - 1);
        return action;
    }

    reset(): void {
        this.currentState = cloneState(this.initialState);
        this.undoStack = [];
        this.steps = 0;
    }

    checkWin(): boolean {
        return isSolved(this.currentState);
    }

    getHint(): [number, number] | null {
        if (!this.currentLevel) {
            return null;
        }
        return findHint(this.currentState, this.currentLevel.bottleCapacity);
    }

    getValidTargets(fromIndex: number): number[] {
        if (!this.currentLevel) {
            return [];
        }

        const targets: number[] = [];
        for (let toIndex = 0; toIndex < this.currentState.length; toIndex += 1) {
            if (this.canPour(fromIndex, toIndex)) {
                targets.push(toIndex);
            }
        }
        return targets;
    }

    async getMaxBundledLevelId(): Promise<number> {
        let maxLevelId = 0;
        for (const chapterId of this.chapterIds) {
            const chapter = await this.loadChapter(chapterId);
            for (const level of chapter.levels) {
                maxLevelId = Math.max(maxLevelId, level.levelId);
            }
        }
        return maxLevelId;
    }

    getLoadedLevelCount(): number {
        let count = 0;
        this.chapterCache.forEach((chapter) => {
            count += chapter.levels.length;
        });
        return count;
    }

    private async findLevel(levelId: number): Promise<{ chapter: ChapterConfig; level: LevelConfig } | null> {
        for (const chapterId of this.chapterIds) {
            const chapter = await this.loadChapter(chapterId);
            const level = chapter.levels.find((item) => item.levelId === levelId);
            if (level) {
                return { chapter, level };
            }
        }
        return null;
    }

    private loadChapter(chapterId: number): Promise<ChapterConfig> {
        const cached = this.chapterCache.get(chapterId);
        if (cached) {
            return Promise.resolve(cached);
        }
        return new Promise((resolve, reject) => {
            const path = `Levels/chapter${chapterId}`;
            resources.load(path, JsonAsset, (error, asset) => {
                if (!error && asset?.json) {
                    const chapter = asset.json as ChapterConfig;
                    this.chapterCache.set(chapterId, chapter);
                    resolve(chapter);
                    return;
                }

                // 兜底：按 UUID 直接加载 JsonAsset（绕过 resources 目录识别问题）
                const uuid = this.chapterJsonUuids[chapterId];
                if (!uuid) {
                    const detail = error ? String(error) : 'Unknown error';
                    reject(new Error(
                        `Chapter ${chapterId} could not be loaded from resources path "${path}". ` +
                        `Please ensure the JSON is under "assets/resources/Levels/". Detail: ${detail}`
                    ));
                    return;
                }

                assetManager.loadAny({ uuid }, JsonAsset, (fallbackError, fallbackAsset) => {
                    if (fallbackError || !fallbackAsset?.json) {
                        const detail = fallbackError ? String(fallbackError) : (error ? String(error) : 'Unknown error');
                        reject(new Error(
                            `Chapter ${chapterId} could not be loaded. ` +
                            `Tried resources path "${path}" and UUID "${uuid}". Detail: ${detail}`
                        ));
                        return;
                    }
                    const chapter = fallbackAsset.json as ChapterConfig;
                    this.chapterCache.set(chapterId, chapter);
                    resolve(chapter);
                });
            });
        });
    }
}
