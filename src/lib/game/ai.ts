// Computer opponent for 3D Tic-Tac-Toe.
//
// The board is small (27 cells) but the branching factor is high enough that a
// full search is wasteful, so this uses a threat-based heuristic:
//   1. Win immediately if a winning cell exists.
//   2. Block the opponent's immediate win.
//   3. Otherwise score every cell by the lines it participates in, preferring
//      cells that build our own lines and deny the opponent's.
// Difficulty is applied as noise on top of the ranking, plus how often the
// computer bothers to look for forks and spend takeovers.

import {
    Board,
    Position,
    PlayerNumber,
    positionToIndex,
    indexToPosition,
} from './types';
import { WINNING_LINES, isValidTakeover, checkWin } from './logic';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AiMove {
    position: Position;
    isTakeover: boolean;
}

// Lines that pass through each cell index, precomputed once.
const LINES_THROUGH_CELL: number[][] = (() => {
    const map: number[][] = Array.from({ length: 27 }, () => []);
    WINNING_LINES.forEach((line, lineIndex) => {
        for (const pos of line) {
            map[positionToIndex(pos)].push(lineIndex);
        }
    });
    return map;
})();

const LINE_INDICES: number[][] = WINNING_LINES.map(line =>
    line.map(positionToIndex)
);

function emptyIndices(board: Board): number[] {
    const out: number[] = [];
    for (let i = 0; i < 27; i++) if (board[i] === null) out.push(i);
    return out;
}

/** Cells that would immediately complete a line for `player`. */
function winningCells(board: Board, player: PlayerNumber): number[] {
    const out: number[] = [];
    for (const cells of LINE_INDICES) {
        let mine = 0;
        let empty = -1;
        let blocked = false;
        for (const cell of cells) {
            const value = board[cell];
            if (value === player) mine++;
            else if (value === null) empty = cell;
            else {
                blocked = true;
                break;
            }
        }
        if (!blocked && mine === 2 && empty >= 0 && !out.includes(empty)) {
            out.push(empty);
        }
    }
    return out;
}

/** How many distinct immediate wins `player` would have after taking `cell`. */
function threatCountAfter(board: Board, cell: number, player: PlayerNumber): number {
    const next = [...board];
    next[cell] = player;
    return winningCells(next, player).length;
}

// A line is worth more the closer it is to completion. Exponential weighting
// makes "two of mine plus a gap" dominate "one of mine".
const LINE_VALUE = [0, 1, 8, 0];

function positionalBonus(index: number): number {
    const pos = indexToPosition(index);
    if (pos.x === 1 && pos.y === 1 && pos.z === 1) return 6; // cube centre: 13 lines
    const extremes = [pos.x, pos.y, pos.z].filter(v => v !== 1).length;
    if (extremes === 3) return 3; // corners: 7 lines each
    if (extremes === 0) return 0;
    return extremes === 1 ? 2 : 1;
}

function scoreCell(
    board: Board,
    cell: number,
    me: PlayerNumber,
    opponents: PlayerNumber[]
): number {
    let score = positionalBonus(cell);

    for (const lineIndex of LINES_THROUGH_CELL[cell]) {
        const cells = LINE_INDICES[lineIndex];
        let mine = 0;
        const theirs = new Map<PlayerNumber, number>();

        for (const c of cells) {
            if (c === cell) continue;
            const value = board[c];
            if (value === null) continue;
            if (value === me) mine++;
            else theirs.set(value, (theirs.get(value) ?? 0) + 1);
        }

        if (theirs.size === 0) {
            // Line is still ours to take.
            score += LINE_VALUE[mine + 1] * 2;
        } else if (mine === 0 && theirs.size === 1) {
            // Pure opponent line — taking this cell denies it.
            const [count] = [...theirs.values()];
            score += LINE_VALUE[count + 1];
        }
        // Mixed lines are dead for everyone; worth nothing.
    }

    // Deny the strongest opponent a fork.
    for (const opponent of opponents) {
        score += threatCountAfter(board, cell, opponent) * 3;
    }

    return score;
}

const NOISE: Record<Difficulty, number> = {
    easy: 14,
    medium: 4,
    hard: 0,
};

/** Chance the computer overlooks a block it could make. */
const BLUNDER_CHANCE: Record<Difficulty, number> = {
    easy: 0.45,
    medium: 0.12,
    hard: 0,
};

export function chooseAiMove(
    board: Board,
    me: PlayerNumber,
    opponents: PlayerNumber[],
    takeoversRemaining: number,
    difficulty: Difficulty = 'medium'
): AiMove | null {
    const empties = emptyIndices(board);
    if (empties.length === 0) return null;

    const blunders = Math.random() < BLUNDER_CHANCE[difficulty];

    // 1. Take an immediate win.
    const myWins = winningCells(board, me).filter(cell => board[cell] === null);
    if (myWins.length > 0 && !blunders) {
        return { position: indexToPosition(myWins[0]), isTakeover: false };
    }

    // 2. Block an opponent about to win.
    if (!blunders) {
        for (const opponent of opponents) {
            const theirWins = winningCells(board, opponent).filter(
                cell => board[cell] === null
            );
            if (theirWins.length > 0) {
                return { position: indexToPosition(theirWins[0]), isTakeover: false };
            }
        }
    }

    // 3. Rank the remaining cells.
    const noise = NOISE[difficulty];
    let best = empties[0];
    let bestScore = -Infinity;

    for (const cell of empties) {
        let score = scoreCell(board, cell, me, opponents);

        if (difficulty !== 'easy') {
            // Reward forks: two live threats at once is usually winning.
            const forks = threatCountAfter(board, cell, me);
            if (forks >= 2) score += 40;
            else if (forks === 1) score += 6;
        }

        if (noise > 0) score += Math.random() * noise;

        if (score > bestScore) {
            bestScore = score;
            best = cell;
        }
    }

    // 4. Consider spending a takeover when a placement alone cannot stop a fork.
    if (takeoversRemaining > 0 && difficulty !== 'easy' && !blunders) {
        const takeover = chooseTakeover(board, me, opponents, takeoversRemaining, bestScore);
        if (takeover) return takeover;
    }

    return { position: indexToPosition(best), isTakeover: false };
}

function chooseTakeover(
    board: Board,
    me: PlayerNumber,
    opponents: PlayerNumber[],
    takeoversRemaining: number,
    bestPlacementScore: number
): AiMove | null {
    let best: { cell: number; score: number } | null = null;

    for (let cell = 0; cell < 27; cell++) {
        const owner = board[cell];
        if (owner === null || owner === me) continue;
        if (!opponents.includes(owner)) continue;

        const position = indexToPosition(cell);
        if (!isValidTakeover(board, position, me, takeoversRemaining).valid) continue;

        // Value = what the opponent loses + what we gain.
        const after = [...board];
        after[cell] = me;

        const ownerThreatsBefore = winningCells(board, owner).length;
        const ownerThreatsAfter = winningCells(after, owner).length;
        const denial = (ownerThreatsBefore - ownerThreatsAfter) * 25;

        const gain = scoreCell(board, cell, me, opponents) * 0.6;
        const score = denial + gain;

        if (!best || score > best.score) best = { cell, score };
    }

    // Takeovers are scarce, so only spend one when it clearly beats placing.
    if (best && best.score > bestPlacementScore + 20) {
        return { position: indexToPosition(best.cell), isTakeover: true };
    }
    return null;
}

/** Convenience wrapper used by the UI: never returns a move once the game is over. */
export function nextAiMove(
    board: Board,
    me: PlayerNumber,
    opponents: PlayerNumber[],
    takeoversRemaining: number,
    difficulty: Difficulty
): AiMove | null {
    if (checkWin(board)) return null;
    return chooseAiMove(board, me, opponents, takeoversRemaining, difficulty);
}
