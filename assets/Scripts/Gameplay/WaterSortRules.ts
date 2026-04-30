import { PourAction } from '../Data/GameData';

export function cloneState(state: number[][]): number[][] {
    return state.map((bottle) => bottle.slice());
}

export function getTopColor(state: number[][], index: number): number | null {
    const bottle = state[index];
    return bottle.length > 0 ? bottle[bottle.length - 1] : null;
}

export function getTopColorCount(state: number[][], index: number): number {
    const bottle = state[index];
    if (bottle.length === 0) {
        return 0;
    }

    const top = bottle[bottle.length - 1];
    let count = 0;
    for (let i = bottle.length - 1; i >= 0; i -= 1) {
        if (bottle[i] !== top) {
            break;
        }
        count += 1;
    }
    return count;
}

export function canPour(state: number[][], capacity: number, fromIndex: number, toIndex: number): boolean {
    if (fromIndex === toIndex || !state[fromIndex] || !state[toIndex]) {
        return false;
    }
    if (state[fromIndex].length === 0 || state[toIndex].length >= capacity) {
        return false;
    }

    const fromTop = getTopColor(state, fromIndex);
    const toTop = getTopColor(state, toIndex);
    const space = capacity - state[toIndex].length;

    if (space <= 0) {
        return false;
    }

    // 允许“部分倒入”：只要颜色匹配（或目标为空）且目标有空间即可。
    return toTop === null || fromTop === toTop;
}

export function pour(state: number[][], capacity: number, fromIndex: number, toIndex: number): PourAction | null {
    if (!canPour(state, capacity, fromIndex, toIndex)) {
        return null;
    }

    const beforeState = cloneState(state);
    const nextState = cloneState(state);
    const colorId = nextState[fromIndex][nextState[fromIndex].length - 1];
    const count = Math.min(getTopColorCount(nextState, fromIndex), capacity - nextState[toIndex].length);

    for (let i = 0; i < count; i += 1) {
        nextState[toIndex].push(nextState[fromIndex].pop()!);
    }

    return {
        fromIndex,
        toIndex,
        colorId,
        count,
        beforeState,
        afterState: nextState,
    };
}

export function isSolved(state: number[][]): boolean {
    const occupiedColors = new Set<number>();

    for (const bottle of state) {
        if (bottle.length === 0) {
            continue;
        }

        const colorId = bottle[0];
        if (bottle.some((item) => item !== colorId)) {
            return false;
        }
        if (occupiedColors.has(colorId)) {
            return false;
        }
        occupiedColors.add(colorId);
    }

    return true;
}

export function findHint(state: number[][], capacity: number): [number, number] | null {
    let bestMove: [number, number] | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let from = 0; from < state.length; from += 1) {
        for (let to = 0; to < state.length; to += 1) {
            const action = pour(state, capacity, from, to);
            if (!action) {
                continue;
            }

            const score = heuristic(action.afterState, capacity);
            if (score < bestScore) {
                bestScore = score;
                bestMove = [from, to];
            }
        }
    }

    return bestMove;
}

function heuristic(state: number[][], capacity: number): number {
    let score = 0;
    for (const bottle of state) {
        score += new Set(bottle).size;
        if (bottle.length > 0 && bottle.length < capacity) {
            score += 0.25;
        }
    }
    return score;
}

