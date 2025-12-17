// Game Types for 3D Tic-Tac-Toe

export type PlayerNumber = 1 | 2 | 3;

export type CellValue = PlayerNumber | null;

// 3x3x3 = 27 cells
export type Board = CellValue[];

export interface Position {
    x: number; // 0-2
    y: number; // 0-2 (layer)
    z: number; // 0-2
}

export interface Move {
    position: Position;
    player: PlayerNumber;
    isTakeover: boolean;
    previousOwner?: PlayerNumber;
    timestamp: number;
}

export interface Player {
    id: string;
    sessionId: string;
    nickname: string;
    playerNumber: PlayerNumber;
    takeoverRemaining: number;
    isReady: boolean;
    isConnected: boolean;
}

export interface WinResult {
    winner: PlayerNumber;
    winningLine: Position[];
}

export type LobbyStatus = 'waiting' | 'playing' | 'finished';

export interface Lobby {
    id: string;
    code: string;
    status: LobbyStatus;
    maxPlayers: number;
    createdAt: string;
    updatedAt: string;
}

export interface GameState {
    id: string;
    lobbyId: string;
    board: Board;
    currentTurn: PlayerNumber;
    winner: PlayerNumber | null;
    winningLine: Position[] | null;
    moveHistory: Move[];
    createdAt: string;
    updatedAt: string;
}

// Initial takeovers per player
export const INITIAL_TAKEOVERS: Record<PlayerNumber, number> = {
    1: 2, // Player 1 has fewer takeovers
    2: 3,
    3: 3,
};

// Player piece types for customization
export type PieceType = 'sphere' | 'cube' | 'octahedron' | 'torus' | 'cone' | 'cylinder';

export interface PieceConfig {
    type: PieceType;
    color: string;
    emissive?: string;
    scale?: number;
}

export const DEFAULT_PIECES: Record<PlayerNumber, PieceConfig> = {
    1: { type: 'sphere', color: '#ef4444', emissive: '#7f1d1d' },      // Red
    2: { type: 'cube', color: '#22c55e', emissive: '#14532d' },        // Green  
    3: { type: 'octahedron', color: '#3b82f6', emissive: '#1e3a8a' },  // Blue
};

// Utility to convert flat index to 3D position
export function indexToPosition(index: number): Position {
    return {
        x: index % 3,
        y: Math.floor(index / 9),
        z: Math.floor((index % 9) / 3),
    };
}

// Utility to convert 3D position to flat index
export function positionToIndex(pos: Position): number {
    return pos.y * 9 + pos.z * 3 + pos.x;
}

// Create empty board
export function createEmptyBoard(): Board {
    return Array(27).fill(null);
}
