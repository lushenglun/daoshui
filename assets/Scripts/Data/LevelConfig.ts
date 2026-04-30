export interface ChapterTheme {
    backgroundColor: string;
    bottleStyle: string;
    liquidStyle: string;
}

export interface LevelConfig {
    levelId: number;
    difficulty: number;
    bottleCount: number;
    bottleCapacity: number;
    emptyBottleCount: number;
    initialState: number[][];
    minSteps: number;
    targetSteps: number;
    tutorial: boolean;
    tutorialText?: string;
}

export interface ChapterConfig {
    chapterId: number;
    chapterName: string;
    unlockLevel: number;
    theme: ChapterTheme;
    colorPalette: string[];
    levels: LevelConfig[];
}

