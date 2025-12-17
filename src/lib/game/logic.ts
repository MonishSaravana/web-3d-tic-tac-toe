// Game Logic for 3D Tic-Tac-Toe
// Handles win detection, move validation, and takeover rules

import {
    Board,
    Position,
    PlayerNumber,
    WinResult,
    positionToIndex,
    indexToPosition,
} from './types';

// All 49 possible winning lines in a 3x3x3 grid
// Lines are arrays of 3 positions each

function generateWinningLines(): Position[][] {
    const lines: Position[][] = [];

    // Rows (horizontal lines in each layer) - 9 lines per direction × 3 = 27 base lines
    for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
            // X-axis rows
            lines.push([
                { x: 0, y, z },
                { x: 1, y, z },
                { x: 2, y, z },
            ]);
        }
        for (let x = 0; x < 3; x++) {
            // Z-axis rows
            lines.push([
                { x, y, z: 0 },
                { x, y, z: 1 },
                { x, y, z: 2 },
            ]);
        }
    }

    // Columns (vertical pillars) - 9 pillars
    for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
            lines.push([
                { x, y: 0, z },
                { x, y: 1, z },
                { x, y: 2, z },
            ]);
        }
    }

    // Layer diagonals (2D diagonals within each layer) - 4 per layer × 3 layers = 12 lines
    for (let y = 0; y < 3; y++) {
        // XZ plane diagonals
        lines.push([
            { x: 0, y, z: 0 },
            { x: 1, y, z: 1 },
            { x: 2, y, z: 2 },
        ]);
        lines.push([
            { x: 2, y, z: 0 },
            { x: 1, y, z: 1 },
            { x: 0, y, z: 2 },
        ]);
    }

    // Cross-layer diagonals in XY planes - 2 per Z slice × 3 = 6 lines
    for (let z = 0; z < 3; z++) {
        lines.push([
            { x: 0, y: 0, z },
            { x: 1, y: 1, z },
            { x: 2, y: 2, z },
        ]);
        lines.push([
            { x: 2, y: 0, z },
            { x: 1, y: 1, z },
            { x: 0, y: 2, z },
        ]);
    }

    // Cross-layer diagonals in YZ planes - 2 per X slice × 3 = 6 lines
    for (let x = 0; x < 3; x++) {
        lines.push([
            { x, y: 0, z: 0 },
            { x, y: 1, z: 1 },
            { x, y: 2, z: 2 },
        ]);
        lines.push([
            { x, y: 0, z: 2 },
            { x, y: 1, z: 1 },
            { x, y: 2, z: 0 },
        ]);
    }

    // Space diagonals (corner to corner through center) - 4 lines
    lines.push([
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1 },
        { x: 2, y: 2, z: 2 },
    ]);
    lines.push([
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 1, z: 1 },
        { x: 0, y: 2, z: 2 },
    ]);
    lines.push([
        { x: 0, y: 0, z: 2 },
        { x: 1, y: 1, z: 1 },
        { x: 2, y: 2, z: 0 },
    ]);
    lines.push([
        { x: 2, y: 0, z: 2 },
        { x: 1, y: 1, z: 1 },
        { x: 0, y: 2, z: 0 },
    ]);

    return lines;
}

// Cache winning lines since they never change
const WINNING_LINES = generateWinningLines();

/**
 * Check if there's a winner on the board
 */
export function checkWin(board: Board): WinResult | null {
    for (const line of WINNING_LINES) {
        const [p1, p2, p3] = line;
        const v1 = board[positionToIndex(p1)];
        const v2 = board[positionToIndex(p2)];
        const v3 = board[positionToIndex(p3)];

        if (v1 !== null && v1 === v2 && v2 === v3) {
            return {
                winner: v1,
                winningLine: line,
            };
        }
    }
    return null;
}

/**
 * Check if a move to an empty cell is valid
 */
export function isValidMove(
    board: Board,
    position: Position,
    currentPlayer: PlayerNumber
): boolean {
    const index = positionToIndex(position);

    // Check bounds
    if (index < 0 || index >= 27) return false;

    // Cell must be empty for a regular move
    return board[index] === null;
}

/**
 * Check if a takeover is valid
 * - Target cell must contain an opponent's piece
 * - Player must have takeovers remaining
 * - Takeover cannot result in immediate win
 */
export function isValidTakeover(
    board: Board,
    position: Position,
    player: PlayerNumber,
    takeoverCount: number
): { valid: boolean; reason?: string } {
    const index = positionToIndex(position);

    // Check bounds
    if (index < 0 || index >= 27) {
        return { valid: false, reason: 'Invalid position' };
    }

    // Must have takeovers remaining
    if (takeoverCount <= 0) {
        return { valid: false, reason: 'No takeovers remaining' };
    }

    const cellValue = board[index];

    // Cell must contain an opponent's piece
    if (cellValue === null) {
        return { valid: false, reason: 'Cell is empty' };
    }

    if (cellValue === player) {
        return { valid: false, reason: 'Cannot takeover your own piece' };
    }

    // Check if takeover would result in immediate win
    if (wouldResultInWin(board, position, player)) {
        return { valid: false, reason: 'Takeover cannot directly win the game' };
    }

    return { valid: true };
}

/**
 * Check if placing a piece at position would result in a win
 */
export function wouldResultInWin(
    board: Board,
    position: Position,
    player: PlayerNumber
): boolean {
    // Create a copy of the board with the new piece
    const testBoard = [...board];
    testBoard[positionToIndex(position)] = player;

    // Check if this results in a win
    const result = checkWin(testBoard);
    return result !== null && result.winner === player;
}

/**
 * Apply a move to the board and return the new board state
 */
export function applyMove(
    board: Board,
    position: Position,
    player: PlayerNumber
): Board {
    const newBoard = [...board];
    newBoard[positionToIndex(position)] = player;
    return newBoard;
}

/**
 * Get the next player in turn order (1 -> 2 -> 3 -> 1)
 */
export function getNextPlayer(current: PlayerNumber): PlayerNumber {
    return ((current % 3) + 1) as PlayerNumber;
}

/**
 * Get all empty cell positions
 */
export function getEmptyCells(board: Board): Position[] {
    const empty: Position[] = [];
    for (let i = 0; i < 27; i++) {
        if (board[i] === null) {
            empty.push(indexToPosition(i));
        }
    }
    return empty;
}

/**
 * Get all cells owned by a specific player
 */
export function getPlayerCells(board: Board, player: PlayerNumber): Position[] {
    const cells: Position[] = [];
    for (let i = 0; i < 27; i++) {
        if (board[i] === player) {
            cells.push(indexToPosition(i));
        }
    }
    return cells;
}

/**
 * Check if the game is a draw (all cells filled, no winner)
 */
export function isDraw(board: Board): boolean {
    const hasEmptyCells = board.some(cell => cell === null);
    if (hasEmptyCells) return false;

    return checkWin(board) === null;
}

/**
 * Get valid takeover targets for a player
 */
export function getValidTakeoverTargets(
    board: Board,
    player: PlayerNumber,
    takeoverCount: number
): Position[] {
    if (takeoverCount <= 0) return [];

    const targets: Position[] = [];
    for (let i = 0; i < 27; i++) {
        const cellValue = board[i];
        if (cellValue !== null && cellValue !== player) {
            const position = indexToPosition(i);
            const validation = isValidTakeover(board, position, player, takeoverCount);
            if (validation.valid) {
                targets.push(position);
            }
        }
    }
    return targets;
}

// Export winning lines for visualization
export { WINNING_LINES };
