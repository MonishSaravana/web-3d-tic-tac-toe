// Zustand Store for Game State Management
'use client';

import { create } from 'zustand';
import {
    Board,
    Position,
    PlayerNumber,
    Player,
    Move,
    GameState,
    Lobby,
    LobbyStatus,
    createEmptyBoard,
    INITIAL_TAKEOVERS,
    positionToIndex,
} from './types';
import {
    checkWin,
    isValidMove,
    isValidTakeover,
    applyMove,
    getNextPlayer,
} from './logic';

// Session ID management
function getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = localStorage.getItem('ttt-session-id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('ttt-session-id', sessionId);
    }
    return sessionId;
}

interface UIState {
    hoveredCell: Position | null;
    selectedCell: Position | null;
    isTakeoverMode: boolean;
    showSettings: boolean;
    theme: 'dark' | 'light';
}

interface GameStore {
    // Session
    sessionId: string;
    nickname: string;

    // Lobby state
    lobby: Lobby | null;
    players: Player[];

    // Game state
    game: GameState | null;
    localPlayer: Player | null;

    // UI state
    ui: UIState;

    // Actions - Session
    initSession: () => void;
    setNickname: (name: string) => void;

    // Actions - Lobby
    setLobby: (lobby: Lobby | null) => void;
    setPlayers: (players: Player[]) => void;
    addPlayer: (player: Player) => void;
    removePlayer: (playerId: string) => void;
    updatePlayer: (playerId: string, updates: Partial<Player>) => void;

    // Actions - Game
    setGame: (game: GameState | null) => void;
    updateBoard: (board: Board) => void;
    makeMove: (position: Position) => { success: boolean; error?: string };
    makeTakeover: (position: Position) => { success: boolean; error?: string };

    // Actions - UI
    setHoveredCell: (position: Position | null) => void;
    setSelectedCell: (position: Position | null) => void;
    toggleTakeoverMode: () => void;
    setTakeoverMode: (enabled: boolean) => void;
    toggleSettings: () => void;
    toggleTheme: () => void;

    // Computed
    isMyTurn: () => boolean;
    canMakeMove: () => boolean;
    getMyTakeoversRemaining: () => number;
}

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial state
    sessionId: '',
    nickname: '',

    lobby: null,
    players: [],

    game: null,
    localPlayer: null,

    ui: {
        hoveredCell: null,
        selectedCell: null,
        isTakeoverMode: false,
        showSettings: false,
        theme: 'dark',
    },

    // Session actions
    initSession: () => {
        const sessionId = getSessionId();
        const savedNickname = typeof window !== 'undefined'
            ? localStorage.getItem('ttt-nickname') || ''
            : '';
        const savedTheme = typeof window !== 'undefined'
            ? (localStorage.getItem('ttt-theme') as 'dark' | 'light') || 'dark'
            : 'dark';

        set({
            sessionId,
            nickname: savedNickname,
            ui: { ...get().ui, theme: savedTheme }
        });

        // Apply theme to document
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    },

    setNickname: (nickname) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('ttt-nickname', nickname);
        }
        set({ nickname });
    },

    // Lobby actions
    setLobby: (lobby) => set({ lobby }),

    setPlayers: (players) => {
        const { sessionId } = get();
        const localPlayer = players.find(p => p.sessionId === sessionId) || null;
        set({ players, localPlayer });
    },

    addPlayer: (player) => {
        const { players, sessionId } = get();
        const newPlayers = [...players, player];
        const localPlayer = player.sessionId === sessionId ? player : get().localPlayer;
        set({ players: newPlayers, localPlayer });
    },

    removePlayer: (playerId) => {
        const { players } = get();
        set({ players: players.filter(p => p.id !== playerId) });
    },

    updatePlayer: (playerId, updates) => {
        const { players, sessionId } = get();
        const newPlayers = players.map(p =>
            p.id === playerId ? { ...p, ...updates } : p
        );
        const localPlayer = newPlayers.find(p => p.sessionId === sessionId) || null;
        set({ players: newPlayers, localPlayer });
    },

    // Game actions
    setGame: (game) => set({ game }),

    updateBoard: (board) => {
        const { game } = get();
        if (game) {
            set({ game: { ...game, board } });
        }
    },

    makeMove: (position) => {
        const { game, localPlayer } = get();

        if (!game || !localPlayer) {
            return { success: false, error: 'Game not initialized' };
        }

        if (game.currentTurn !== localPlayer.playerNumber) {
            return { success: false, error: 'Not your turn' };
        }

        if (!isValidMove(game.board, position, localPlayer.playerNumber)) {
            return { success: false, error: 'Invalid move' };
        }

        // Apply move locally (optimistic update)
        const newBoard = applyMove(game.board, position, localPlayer.playerNumber);
        const winResult = checkWin(newBoard);
        const nextTurn = winResult ? game.currentTurn : getNextPlayer(game.currentTurn);

        const newMove: Move = {
            position,
            player: localPlayer.playerNumber,
            isTakeover: false,
            timestamp: Date.now(),
        };

        set({
            game: {
                ...game,
                board: newBoard,
                currentTurn: nextTurn,
                winner: winResult?.winner || null,
                winningLine: winResult?.winningLine || null,
                moveHistory: [...game.moveHistory, newMove],
            },
            ui: { ...get().ui, selectedCell: null },
        });

        return { success: true };
    },

    makeTakeover: (position) => {
        const { game, localPlayer, players } = get();

        if (!game || !localPlayer) {
            return { success: false, error: 'Game not initialized' };
        }

        if (game.currentTurn !== localPlayer.playerNumber) {
            return { success: false, error: 'Not your turn' };
        }

        const validation = isValidTakeover(
            game.board,
            position,
            localPlayer.playerNumber,
            localPlayer.takeoverRemaining
        );

        if (!validation.valid) {
            return { success: false, error: validation.reason };
        }

        // Get previous owner
        const index = positionToIndex(position);
        const previousOwner = game.board[index] as PlayerNumber;

        // Apply takeover locally
        const newBoard = applyMove(game.board, position, localPlayer.playerNumber);
        const nextTurn = getNextPlayer(game.currentTurn);

        const newMove: Move = {
            position,
            player: localPlayer.playerNumber,
            isTakeover: true,
            previousOwner,
            timestamp: Date.now(),
        };

        // Update local player's takeover count
        const newPlayers = players.map(p =>
            p.id === localPlayer.id
                ? { ...p, takeoverRemaining: p.takeoverRemaining - 1 }
                : p
        );

        set({
            game: {
                ...game,
                board: newBoard,
                currentTurn: nextTurn,
                moveHistory: [...game.moveHistory, newMove],
            },
            players: newPlayers,
            localPlayer: { ...localPlayer, takeoverRemaining: localPlayer.takeoverRemaining - 1 },
            ui: { ...get().ui, selectedCell: null, isTakeoverMode: false },
        });

        return { success: true };
    },

    // UI actions
    setHoveredCell: (position) => {
        set({ ui: { ...get().ui, hoveredCell: position } });
    },

    setSelectedCell: (position) => {
        set({ ui: { ...get().ui, selectedCell: position } });
    },

    toggleTakeoverMode: () => {
        const { ui } = get();
        set({ ui: { ...ui, isTakeoverMode: !ui.isTakeoverMode } });
    },

    setTakeoverMode: (enabled) => {
        set({ ui: { ...get().ui, isTakeoverMode: enabled } });
    },

    toggleSettings: () => {
        const { ui } = get();
        set({ ui: { ...ui, showSettings: !ui.showSettings } });
    },

    toggleTheme: () => {
        const { ui } = get();
        const newTheme = ui.theme === 'dark' ? 'light' : 'dark';

        if (typeof window !== 'undefined') {
            localStorage.setItem('ttt-theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
        }

        set({ ui: { ...ui, theme: newTheme } });
    },

    // Computed values
    isMyTurn: () => {
        const { game, localPlayer } = get();
        return game !== null && localPlayer !== null && game.currentTurn === localPlayer.playerNumber;
    },

    canMakeMove: () => {
        const { game, localPlayer } = get();
        return game !== null &&
            localPlayer !== null &&
            game.currentTurn === localPlayer.playerNumber &&
            game.winner === null;
    },

    getMyTakeoversRemaining: () => {
        const { localPlayer } = get();
        return localPlayer?.takeoverRemaining ?? 0;
    },
}));

// Demo/offline game store for testing
export const useDemoGameStore = create<{
    board: Board;
    currentTurn: PlayerNumber;
    takeovers: Record<PlayerNumber, number>;
    winner: PlayerNumber | null;
    winningLine: Position[] | null;
    moveHistory: Move[];

    makeMove: (position: Position) => { success: boolean; error?: string };
    makeTakeover: (position: Position) => { success: boolean; error?: string };
    resetGame: () => void;
}>((set, get) => ({
    board: createEmptyBoard(),
    currentTurn: 1,
    takeovers: { ...INITIAL_TAKEOVERS },
    winner: null,
    winningLine: null,
    moveHistory: [],

    makeMove: (position) => {
        const { board, currentTurn, winner } = get();

        if (winner !== null) {
            return { success: false, error: 'Game is over' };
        }

        if (!isValidMove(board, position, currentTurn)) {
            return { success: false, error: 'Invalid move' };
        }

        const newBoard = applyMove(board, position, currentTurn);
        const winResult = checkWin(newBoard);

        const newMove: Move = {
            position,
            player: currentTurn,
            isTakeover: false,
            timestamp: Date.now(),
        };

        set({
            board: newBoard,
            currentTurn: winResult ? currentTurn : getNextPlayer(currentTurn),
            winner: winResult?.winner || null,
            winningLine: winResult?.winningLine || null,
            moveHistory: [...get().moveHistory, newMove],
        });

        return { success: true };
    },

    makeTakeover: (position) => {
        const { board, currentTurn, takeovers, winner } = get();

        if (winner !== null) {
            return { success: false, error: 'Game is over' };
        }

        const validation = isValidTakeover(board, position, currentTurn, takeovers[currentTurn]);

        if (!validation.valid) {
            return { success: false, error: validation.reason };
        }

        const index = positionToIndex(position);
        const previousOwner = board[index] as PlayerNumber;

        const newBoard = applyMove(board, position, currentTurn);

        const newMove: Move = {
            position,
            player: currentTurn,
            isTakeover: true,
            previousOwner,
            timestamp: Date.now(),
        };

        set({
            board: newBoard,
            currentTurn: getNextPlayer(currentTurn),
            takeovers: { ...takeovers, [currentTurn]: takeovers[currentTurn] - 1 },
            moveHistory: [...get().moveHistory, newMove],
        });

        return { success: true };
    },

    resetGame: () => {
        set({
            board: createEmptyBoard(),
            currentTurn: 1,
            takeovers: { ...INITIAL_TAKEOVERS },
            winner: null,
            winningLine: null,
            moveHistory: [],
        });
    },
}));
