// Local Multiplayer Game Page
// Same device play with configurable settings

'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Position, PlayerNumber, positionToIndex, DEFAULT_PIECES } from '@/lib/game/types';
import { isValidTakeover } from '@/lib/game/logic';
import { GameHUD, WinOverlay } from '@/components/game';
import { Button, ThemeToggle, Card, Modal } from '@/components/ui';
import { playPlace, playTakeover, playWin, playError, sounds } from '@/lib/sounds';
import styles from './page.module.css';

// Dynamic import for 3D board
const GameBoard = dynamic(
    () => import('@/components/three/GameBoard').then(mod => ({ default: mod.GameBoard })),
    {
        ssr: false,
        loading: () => (
            <div className={styles.boardLoading}>
                <div className={styles.spinner} />
                <span>Loading 3D Board...</span>
            </div>
        ),
    }
);

type PlayerCount = 2 | 3;

interface GameSettings {
    playerCount: PlayerCount;
    takeoversPer: number;
    confirmMoves: boolean;
}

interface LocalGameState {
    board: (PlayerNumber | null)[];
    currentTurn: PlayerNumber;
    takeovers: Record<PlayerNumber, number>;
    winner: PlayerNumber | null;
    winningLine: Position[] | null;
    pendingMove: Position | null;
}

const DEFAULT_SETTINGS: GameSettings = {
    playerCount: 2,
    takeoversPer: 5,
    confirmMoves: true,
};

function createInitialState(settings: GameSettings): LocalGameState {
    const takeovers: Record<PlayerNumber, number> = {
        1: settings.takeoversPer,
        2: settings.takeoversPer,
        3: settings.playerCount === 3 ? settings.takeoversPer : 0,
    };

    return {
        board: Array(27).fill(null),
        currentTurn: 1,
        takeovers,
        winner: null,
        winningLine: null,
        pendingMove: null,
    };
}

export default function LocalGamePage() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [gameStarted, setGameStarted] = useState(false);
    const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
    const [game, setGame] = useState<LocalGameState>(() => createInitialState(DEFAULT_SETTINGS));

    const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
    const [selectedCell, setSelectedCell] = useState<Position | null>(null);
    const [isTakeoverMode, setIsTakeoverMode] = useState(false);
    const [showWinOverlay, setShowWinOverlay] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Initialize theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('ttt-theme') as 'dark' | 'light' || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        setSoundEnabled(sounds.isEnabled());
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('ttt-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const toggleSound = () => {
        const newEnabled = !soundEnabled;
        setSoundEnabled(newEnabled);
        sounds.setEnabled(newEnabled);
    };

    const startGame = () => {
        setGame(createInitialState(settings));
        setGameStarted(true);
        setShowWinOverlay(false);
        setIsTakeoverMode(false);
    };

    const getNextPlayer = (current: PlayerNumber): PlayerNumber => {
        if (settings.playerCount === 2) {
            return current === 1 ? 2 : 1;
        }
        return current === 3 ? 1 : (current + 1) as PlayerNumber;
    };

    // Import game logic dynamically to check win
    const handleCellClick = useCallback(async (position: Position) => {
        if (game.winner) return;

        const { checkWin, isValidMove, applyMove } = await import('@/lib/game/logic');

        const board = game.board;
        const index = positionToIndex(position);
        const cellValue = board[index];
        const currentPlayer = game.currentTurn;

        if (isTakeoverMode) {
            if (cellValue !== null && cellValue !== currentPlayer) {
                const validation = isValidTakeover(board, position, currentPlayer, game.takeovers[currentPlayer]);
                if (!validation.valid) {
                    playError();
                    alert(validation.reason);
                    return;
                }

                const newBoard = applyMove(board, position, currentPlayer);
                playTakeover();

                setGame(prev => ({
                    ...prev,
                    board: newBoard,
                    currentTurn: getNextPlayer(currentPlayer),
                    takeovers: {
                        ...prev.takeovers,
                        [currentPlayer]: prev.takeovers[currentPlayer] - 1,
                    },
                }));

                setIsTakeoverMode(false);
                setSelectedCell(null);
            }
        } else {
            if (cellValue === null) {
                if (!isValidMove(board, position, currentPlayer)) {
                    return;
                }

                const newBoard = applyMove(board, position, currentPlayer);
                const winResult = checkWin(newBoard);

                playPlace();

                if (winResult) {
                    setGame(prev => ({
                        ...prev,
                        board: newBoard,
                        winner: winResult.winner,
                        winningLine: winResult.winningLine,
                    }));
                    setTimeout(() => {
                        playWin();
                        setShowWinOverlay(true);
                    }, 500);
                } else {
                    setGame(prev => ({
                        ...prev,
                        board: newBoard,
                        currentTurn: getNextPlayer(currentPlayer),
                    }));
                }

                setSelectedCell(null);
            }
        }
    }, [game, isTakeoverMode, settings.playerCount]);

    const resetGame = () => {
        setGame(createInitialState(settings));
        setShowWinOverlay(false);
        setIsTakeoverMode(false);
        setHoveredCell(null);
        setSelectedCell(null);
    };

    const backToSettings = () => {
        setGameStarted(false);
        resetGame();
    };

    // Create player info for HUD
    const players = Array.from({ length: settings.playerCount }, (_, i) => {
        const num = (i + 1) as PlayerNumber;
        return {
            playerNumber: num,
            nickname: `Player ${num}`,
            takeoverRemaining: game.takeovers[num],
            isCurrentTurn: num === game.currentTurn,
            isLocalPlayer: true,
        };
    });

    // Settings screen
    if (!gameStarted) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backLink}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Home
                    </Link>

                    <span className={styles.headerTitle}>Local Game</span>

                    <ThemeToggle theme={theme} onToggle={toggleTheme} />
                </header>

                <main className={styles.settingsMain}>
                    <Card padding="lg" className={styles.settingsCard}>
                        <h2>Game Settings</h2>

                        <div className={styles.settingGroup}>
                            <label>Players</label>
                            <div className={styles.buttonGroup}>
                                <button
                                    className={`${styles.optionBtn} ${settings.playerCount === 2 ? styles.active : ''}`}
                                    onClick={() => setSettings(s => ({ ...s, playerCount: 2 }))}
                                >
                                    2 Players
                                </button>
                                <button
                                    className={`${styles.optionBtn} ${settings.playerCount === 3 ? styles.active : ''}`}
                                    onClick={() => setSettings(s => ({ ...s, playerCount: 3 }))}
                                >
                                    3 Players
                                </button>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <label>Takeovers per Player</label>
                            <div className={styles.buttonGroup}>
                                {[3, 5, 7].map(n => (
                                    <button
                                        key={n}
                                        className={`${styles.optionBtn} ${settings.takeoversPer === n ? styles.active : ''}`}
                                        onClick={() => setSettings(s => ({ ...s, takeoversPer: n }))}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <span className={styles.settingHint}>5 recommended</span>
                        </div>

                        <div className={styles.settingGroup}>
                            <label>Sound Effects</label>
                            <button
                                className={`${styles.optionBtn} ${styles.fullWidth} ${soundEnabled ? styles.active : ''}`}
                                onClick={toggleSound}
                            >
                                {soundEnabled ? '🔊 Enabled' : '🔇 Disabled'}
                            </button>
                        </div>

                        <Button variant="primary" size="lg" fullWidth onClick={startGame}>
                            Start Game
                        </Button>
                    </Card>
                </main>
            </div>
        );
    }

    // Game screen
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backLink} onClick={backToSettings}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Settings
                </button>

                <div className={styles.headerCenter}>
                    <span className={styles.turnIndicator}>
                        Player {game.currentTurn}'s Turn
                    </span>
                </div>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            <main className={styles.main}>
                <div className={styles.gameArea}>
                    {/* 3D Board */}
                    <div className={styles.boardContainer}>
                        <GameBoard
                            board={game.board}
                            currentTurn={game.currentTurn}
                            hoveredCell={hoveredCell}
                            selectedCell={selectedCell}
                            winningLine={game.winningLine}
                            isTakeoverMode={isTakeoverMode}
                            takeoversRemaining={game.takeovers[game.currentTurn]}
                            onCellHover={setHoveredCell}
                            onCellClick={handleCellClick}
                            disabled={game.winner !== null}
                        />

                        <div className={styles.controlsHint}>
                            <span>🖱️ Drag to rotate</span>
                            <span>⚲ Scroll to zoom</span>
                        </div>
                    </div>

                    {/* HUD */}
                    <div className={styles.hudContainer}>
                        <GameHUD
                            players={players}
                            currentTurn={game.currentTurn}
                            localPlayerNumber={game.currentTurn}
                            isTakeoverMode={isTakeoverMode}
                            onToggleTakeover={() => setIsTakeoverMode(!isTakeoverMode)}
                            winner={game.winner}
                            onPlayAgain={resetGame}
                        />

                        {!game.winner && (
                            <div className={styles.extraControls}>
                                <Button variant="ghost" fullWidth onClick={resetGame}>
                                    Reset Game
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {showWinOverlay && game.winner && (
                <WinOverlay
                    winner={game.winner}
                    winnerName={`Player ${game.winner}`}
                    isLocalWinner={true}
                    onClose={() => setShowWinOverlay(false)}
                />
            )}
        </div>
    );
}
