// Single-device play: against the computer, or 2-3 people sharing a screen.
//
// The board is the cube, always. Reading it in three dimensions is the game,
// so there is no flat mode to retreat to — the flat board appears only if the
// browser cannot run WebGL at all.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
    Board,
    Position,
    PlayerNumber,
    positionToIndex,
    createEmptyBoard,
} from '@/lib/game/types';
import { checkWin, isValidTakeover, applyMove, getValidTakeoverTargets } from '@/lib/game/logic';
import { nextAiMove, Difficulty } from '@/lib/game/ai';
import { GameHUD, WinOverlay, MoveTimer, LayerBoard, PieceGlyph } from '@/components/game';
import { Button, ThemeToggle, Modal } from '@/components/ui';
import { playPlace, playTakeover, playWin, playError, sounds } from '@/lib/sounds';
import styles from './page.module.css';

const GameBoard3D = dynamic(
    () => import('@/components/three/GameBoard').then(mod => ({ default: mod.GameBoard })),
    {
        ssr: false,
        loading: () => (
            <div className={styles.boardLoading}>
                <div className={styles.spinner} />
                <span>Building the cube…</span>
            </div>
        ),
    }
);

type Mode = 'cpu' | 'local2' | 'local3';
type TimerMode = 'unlimited' | 'per_move' | 'time_bank';

const LAYER_NAMES = ['Bottom', 'Middle', 'Top'];

interface Settings {
    mode: Mode;
    difficulty: Difficulty;
    takeoversPer: number;
    timerMode: TimerMode;
    timePerMove: number;
    timeBank: number;
}

interface GameState {
    board: Board;
    currentTurn: PlayerNumber;
    takeovers: Record<PlayerNumber, number>;
    winner: PlayerNumber | null;
    winningLine: Position[] | null;
    draw: boolean;
    lastMove: Position | null;
    timeRemaining: Record<PlayerNumber, number>;
    flagged: PlayerNumber[];
}

const DEFAULT_SETTINGS: Settings = {
    mode: 'cpu',
    difficulty: 'medium',
    takeoversPer: 3,
    timerMode: 'unlimited',
    timePerMove: 30,
    timeBank: 120,
};

const AI_PLAYER: PlayerNumber = 2;

function playerCountFor(mode: Mode): 2 | 3 {
    return mode === 'local3' ? 3 : 2;
}

function createGame(settings: Settings): GameState {
    const count = playerCountFor(settings.mode);
    const per = settings.takeoversPer;
    return {
        board: createEmptyBoard(),
        currentTurn: 1,
        takeovers: { 1: per, 2: per, 3: count === 3 ? per : 0 },
        winner: null,
        winningLine: null,
        draw: false,
        lastMove: null,
        timeRemaining: {
            1: settings.timeBank,
            2: settings.timeBank,
            3: count === 3 ? settings.timeBank : 0,
        },
        flagged: [],
    };
}

function nextTurn(from: PlayerNumber, count: 2 | 3, flagged: PlayerNumber[]): PlayerNumber {
    let candidate = from;
    for (let step = 0; step < count; step++) {
        candidate = ((candidate % count) + 1) as PlayerNumber;
        if (!flagged.includes(candidate)) return candidate;
    }
    return from;
}

function boardIsFull(board: Board): boolean {
    return board.every(cell => cell !== null);
}

function describeCell(pos: Position): string {
    return `${LAYER_NAMES[pos.y]} layer · row ${pos.z + 1}, column ${pos.x + 1}`;
}

export default function LocalGame() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [game, setGame] = useState<GameState>(() => createGame(DEFAULT_SETTINGS));
    const [history, setHistory] = useState<GameState[]>([]);
    const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
    const [isTakeoverMode, setIsTakeoverMode] = useState(false);
    const [showWinOverlay, setShowWinOverlay] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [aiThinking, setAiThinking] = useState(false);
    const [noWebgl, setNoWebgl] = useState(false);

    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const playerCount = playerCountFor(settings.mode);
    const isOver = game.winner !== null || game.draw;
    const isAiTurn = settings.mode === 'cpu' && game.currentTurn === AI_PLAYER && !isOver;

    // --- preferences -------------------------------------------------------

    useEffect(() => {
        const savedTheme = (localStorage.getItem('ttt-theme') as 'dark' | 'light') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        setSoundEnabled(sounds.isEnabled());
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('ttt-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    const toggleSound = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        sounds.setEnabled(next);
    };

    const showToast = useCallback((message: string) => {
        setToast(message);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2600);
    }, []);

    useEffect(() => () => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
    }, []);

    // --- game control ------------------------------------------------------

    const newGame = useCallback((next: Settings = settings) => {
        setGame(createGame(next));
        setHistory([]);
        setHoveredCell(null);
        setIsTakeoverMode(false);
        setShowWinOverlay(false);
        setAiThinking(false);
    }, [settings]);

    const updateSettings = (patch: Partial<Settings>) => {
        const next = { ...settings, ...patch };
        setSettings(next);
        newGame(next);
    };

    const commitMove = useCallback(
        (position: Position, takeover: boolean) => {
            setGame(prev => {
                if (prev.winner !== null || prev.draw) return prev;

                const player = prev.currentTurn;
                const board = applyMove(prev.board, position, player);
                const result = checkWin(board);
                const count = playerCountFor(settings.mode);

                const takeovers = takeover
                    ? { ...prev.takeovers, [player]: prev.takeovers[player] - 1 }
                    : prev.takeovers;

                // A takeover can never complete a line (the rules block it), so
                // only a placement can end the game.
                if (result) {
                    return {
                        ...prev,
                        board,
                        takeovers,
                        winner: result.winner,
                        winningLine: result.winningLine,
                        lastMove: position,
                    };
                }

                if (boardIsFull(board)) {
                    return { ...prev, board, takeovers, draw: true, lastMove: position };
                }

                return {
                    ...prev,
                    board,
                    takeovers,
                    currentTurn: nextTurn(player, count, prev.flagged),
                    lastMove: position,
                };
            });

            if (takeover) playTakeover();
            else playPlace();

            setHoveredCell(null);
            setIsTakeoverMode(false);
        },
        [settings.mode]
    );

    const attemptMove = useCallback(
        (position: Position) => {
            if (isOver || isAiTurn) return;

            const value = game.board[positionToIndex(position)];
            const player = game.currentTurn;

            if (isTakeoverMode) {
                const check = isValidTakeover(game.board, position, player, game.takeovers[player]);
                if (!check.valid) {
                    playError();
                    showToast(check.reason ?? 'You cannot take that cell.');
                    return;
                }
            } else if (value !== null) {
                return;
            }

            setHistory(prev => [...prev, game]);
            commitMove(position, isTakeoverMode);
        },
        [game, isTakeoverMode, isOver, isAiTurn, commitMove, showToast]
    );

    const undo = () => {
        if (history.length === 0) return;
        // Only human moves are recorded, so one step already rewinds past the
        // computer's reply.
        setGame(history[history.length - 1]);
        setHistory(history.slice(0, -1));
        setIsTakeoverMode(false);
        setShowWinOverlay(false);
    };

    // --- win / draw feedback ----------------------------------------------

    useEffect(() => {
        if (game.winner !== null || game.draw) {
            const t = setTimeout(() => {
                if (game.winner !== null) playWin();
                setShowWinOverlay(true);
            }, 650);
            return () => clearTimeout(t);
        }
    }, [game.winner, game.draw]);

    // --- computer opponent -------------------------------------------------

    useEffect(() => {
        if (!isAiTurn) {
            setAiThinking(false);
            return;
        }

        setAiThinking(true);
        let cancelled = false;

        const timer = setTimeout(() => {
            if (cancelled) return;

            const move = nextAiMove(
                game.board,
                AI_PLAYER,
                [1],
                game.takeovers[AI_PLAYER],
                settings.difficulty
            );

            setAiThinking(false);
            if (!move) return;
            commitMove(move.position, move.isTakeover);
        }, 560);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [isAiTurn, game, settings.difficulty, commitMove]);

    // --- time bank ---------------------------------------------------------

    useEffect(() => {
        if (settings.timerMode !== 'time_bank' || isOver) return;

        const id = setInterval(() => {
            setGame(prev => {
                if (prev.winner !== null || prev.draw) return prev;
                const player = prev.currentTurn;
                const left = prev.timeRemaining[player] - 1;

                if (left > 0) {
                    return { ...prev, timeRemaining: { ...prev.timeRemaining, [player]: left } };
                }

                const flagged = [...prev.flagged, player];
                const count = playerCountFor(settings.mode);
                const survivors = ([1, 2, 3] as PlayerNumber[])
                    .slice(0, count)
                    .filter(p => !flagged.includes(p));

                if (survivors.length === 1) {
                    return {
                        ...prev,
                        timeRemaining: { ...prev.timeRemaining, [player]: 0 },
                        flagged,
                        winner: survivors[0],
                    };
                }

                return {
                    ...prev,
                    timeRemaining: { ...prev.timeRemaining, [player]: 0 },
                    flagged,
                    currentTurn: nextTurn(player, count, flagged),
                };
            });
        }, 1000);

        return () => clearInterval(id);
    }, [settings.timerMode, settings.mode, isOver]);

    // --- derived -----------------------------------------------------------

    const takeoverTargets = useMemo(
        () =>
            getValidTakeoverTargets(
                game.board,
                game.currentTurn,
                game.takeovers[game.currentTurn]
            ),
        [game.board, game.currentTurn, game.takeovers]
    );

    const players = useMemo(
        () =>
            Array.from({ length: playerCount }, (_, i) => {
                const num = (i + 1) as PlayerNumber;
                const isComputer = settings.mode === 'cpu' && num === AI_PLAYER;
                return {
                    playerNumber: num,
                    nickname: isComputer ? 'Computer' : `Player ${num}`,
                    takeoverRemaining: game.takeovers[num],
                    isCurrentTurn: num === game.currentTurn,
                    isLocalPlayer: !isComputer,
                };
            }),
        [playerCount, settings.mode, game.takeovers, game.currentTurn]
    );

    const turnLabel = settings.mode === 'cpu'
        ? game.currentTurn === AI_PLAYER
            ? 'Computer is thinking…'
            : 'Your turn'
        : `Player ${game.currentTurn}'s turn`;

    const winnerName =
        game.winner === null
            ? ''
            : settings.mode === 'cpu'
                ? game.winner === AI_PLAYER ? 'Computer' : 'You'
                : `Player ${game.winner}`;

    const readout = isOver
        ? null
        : hoveredCell
            ? describeCell(hoveredCell)
            : isTakeoverMode
                ? 'Pick an opponent piece to replace'
                : 'Drag to rotate · scroll to zoom · click a cell to play it';

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Home
                </Link>

                <span className={styles.headerTitle}>3D Tic Tac Toe</span>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            <div className={styles.setupBar}>
                <div className={styles.pillGroup} role="group" aria-label="Opponent">
                    <button
                        className={`${styles.pill} ${settings.mode === 'cpu' ? styles.pillActive : ''}`}
                        onClick={() => updateSettings({ mode: 'cpu' })}
                    >
                        vs Computer
                    </button>
                    <button
                        className={`${styles.pill} ${settings.mode === 'local2' ? styles.pillActive : ''}`}
                        onClick={() => updateSettings({ mode: 'local2' })}
                    >
                        2 Players
                    </button>
                    <button
                        className={`${styles.pill} ${settings.mode === 'local3' ? styles.pillActive : ''}`}
                        onClick={() => updateSettings({ mode: 'local3' })}
                    >
                        3 Players
                    </button>
                </div>

                {settings.mode === 'cpu' && (
                    <div className={styles.pillGroup} role="group" aria-label="Difficulty">
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map(level => (
                            <button
                                key={level}
                                className={`${styles.pill} ${settings.difficulty === level ? styles.pillActive : ''}`}
                                onClick={() => updateSettings({ difficulty: level })}
                            >
                                {level[0].toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>
                )}

                <div className={styles.setupSpacer} />

                <button
                    className={styles.iconButton}
                    onClick={() => setShowOptions(true)}
                    aria-label="Game options"
                    title="Game options"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                    </svg>
                </button>
            </div>

            <main className={styles.main}>
                <div className={styles.gameArea}>
                    <div className={styles.boardColumn}>
                        <div className={styles.turnBar} data-over={isOver || undefined}>
                            {isOver ? (
                                <span className={styles.turnText}>
                                    {game.draw
                                        ? 'Draw — the cube is full'
                                        : `${winnerName} ${winnerName === 'You' ? 'win' : 'wins'}!`}
                                </span>
                            ) : (
                                <>
                                    <PieceGlyph player={game.currentTurn} size={20} />
                                    <span className={styles.turnText}>{turnLabel}</span>
                                    {aiThinking && <span className={styles.thinkingDots} aria-hidden="true" />}
                                </>
                            )}
                        </div>

                        <div className={styles.boardStage}>
                            {noWebgl ? (
                                <div className={styles.fallbackBoard}>
                                    <p className={styles.fallbackNote}>
                                        This browser can’t render 3D, so here is the cube opened
                                        out into its three layers.
                                    </p>
                                    <LayerBoard
                                        board={game.board}
                                        currentTurn={game.currentTurn}
                                        winningLine={game.winningLine}
                                        isTakeoverMode={isTakeoverMode}
                                        takeoversRemaining={game.takeovers[game.currentTurn]}
                                        pendingMove={null}
                                        lastMove={game.lastMove}
                                        onCellClick={attemptMove}
                                        disabled={isOver || isAiTurn}
                                    />
                                </div>
                            ) : (
                                <div className={styles.canvasFrame}>
                                    <GameBoard3D
                                        board={game.board}
                                        currentTurn={game.currentTurn}
                                        hoveredCell={hoveredCell}
                                        selectedCell={null}
                                        winningLine={game.winningLine}
                                        isTakeoverMode={isTakeoverMode}
                                        takeoversRemaining={game.takeovers[game.currentTurn]}
                                        onCellHover={setHoveredCell}
                                        onCellClick={attemptMove}
                                        disabled={isOver || isAiTurn}
                                        onContextLost={() => setNoWebgl(true)}
                                    />
                                </div>
                            )}
                        </div>

                        {readout && !noWebgl && (
                            <p className={styles.readout} aria-live="polite">
                                {readout}
                            </p>
                        )}

                        <div className={styles.actionBar}>
                            <Button
                                variant={isTakeoverMode ? 'danger' : 'secondary'}
                                onClick={() => {
                                    if (!isTakeoverMode && takeoverTargets.length === 0) {
                                        showToast(
                                            game.takeovers[game.currentTurn] === 0
                                                ? 'No takeovers left.'
                                                : 'No opponent piece can be taken over right now.'
                                        );
                                        return;
                                    }
                                    setIsTakeoverMode(!isTakeoverMode);
                                }}
                                disabled={isOver || isAiTurn}
                            >
                                {isTakeoverMode
                                    ? 'Cancel takeover'
                                    : `Takeover (${game.takeovers[game.currentTurn]})`}
                            </Button>

                            <Button variant="ghost" onClick={undo} disabled={history.length === 0}>
                                Undo
                            </Button>

                            <Button variant="ghost" onClick={() => newGame()}>
                                New game
                            </Button>
                        </div>
                    </div>

                    <aside className={styles.hudContainer}>
                        {settings.timerMode !== 'unlimited' && !isOver && (
                            <MoveTimer
                                mode={settings.timerMode}
                                timePerMove={settings.timePerMove}
                                timeRemaining={game.timeRemaining[game.currentTurn]}
                                isActive
                                onTimeUp={() => {
                                    if (settings.timerMode !== 'per_move') return;
                                    showToast(`Player ${game.currentTurn} ran out of time.`);
                                    setGame(prev => ({
                                        ...prev,
                                        currentTurn: nextTurn(prev.currentTurn, playerCount, prev.flagged),
                                    }));
                                }}
                            />
                        )}

                        <GameHUD
                            players={players}
                            currentTurn={game.currentTurn}
                            localPlayerNumber={settings.mode === 'cpu' ? 1 : game.currentTurn}
                            isTakeoverMode={isTakeoverMode}
                            onToggleTakeover={() => setIsTakeoverMode(!isTakeoverMode)}
                            winner={game.winner}
                            isDraw={game.draw}
                            onPlayAgain={() => newGame()}
                            showControls={false}
                            showStatus={false}
                        />

                        <Link href="/rules" className={styles.rulesLink}>
                            How the 49 winning lines work →
                        </Link>
                    </aside>
                </div>
            </main>

            {toast && (
                <div className={styles.toast} role="status">
                    {toast}
                </div>
            )}

            {showWinOverlay && (game.winner !== null || game.draw) && (
                <WinOverlay
                    winner={game.winner}
                    winnerName={winnerName}
                    isLocalWinner={settings.mode === 'cpu' && game.winner === 1}
                    neutral={settings.mode !== 'cpu'}
                    isDraw={game.draw}
                    onPlayAgain={() => newGame()}
                    onClose={() => setShowWinOverlay(false)}
                />
            )}

            <Modal isOpen={showOptions} onClose={() => setShowOptions(false)} title="Game options">
                <div className={styles.optionsBody}>
                    <div className={styles.settingGroup}>
                        <label>Takeovers per player</label>
                        <div className={styles.numberInput}>
                            <button
                                className={styles.numBtn}
                                onClick={() =>
                                    updateSettings({ takeoversPer: Math.max(0, settings.takeoversPer - 1) })
                                }
                                aria-label="Fewer takeovers"
                            >
                                −
                            </button>
                            <span className={styles.numValue}>{settings.takeoversPer}</span>
                            <button
                                className={styles.numBtn}
                                onClick={() =>
                                    updateSettings({ takeoversPer: Math.min(9, settings.takeoversPer + 1) })
                                }
                                aria-label="More takeovers"
                            >
                                +
                            </button>
                        </div>
                        <span className={styles.settingHint}>Changing this starts a new game.</span>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>Move timer</label>
                        <div className={styles.pillGroup}>
                            <button
                                className={`${styles.pill} ${settings.timerMode === 'unlimited' ? styles.pillActive : ''}`}
                                onClick={() => updateSettings({ timerMode: 'unlimited' })}
                            >
                                None
                            </button>
                            <button
                                className={`${styles.pill} ${settings.timerMode === 'per_move' ? styles.pillActive : ''}`}
                                onClick={() => updateSettings({ timerMode: 'per_move' })}
                            >
                                Per move
                            </button>
                            <button
                                className={`${styles.pill} ${settings.timerMode === 'time_bank' ? styles.pillActive : ''}`}
                                onClick={() => updateSettings({ timerMode: 'time_bank' })}
                            >
                                Time bank
                            </button>
                        </div>
                    </div>

                    {settings.timerMode === 'per_move' && (
                        <div className={styles.settingGroup}>
                            <label>Seconds per move</label>
                            <div className={styles.pillGroup}>
                                {[15, 30, 60].map(n => (
                                    <button
                                        key={n}
                                        className={`${styles.pill} ${settings.timePerMove === n ? styles.pillActive : ''}`}
                                        onClick={() => updateSettings({ timePerMove: n })}
                                    >
                                        {n}s
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {settings.timerMode === 'time_bank' && (
                        <div className={styles.settingGroup}>
                            <label>Time bank per player</label>
                            <div className={styles.pillGroup}>
                                {[60, 120, 300].map(n => (
                                    <button
                                        key={n}
                                        className={`${styles.pill} ${settings.timeBank === n ? styles.pillActive : ''}`}
                                        onClick={() => updateSettings({ timeBank: n })}
                                    >
                                        {n >= 60 ? `${n / 60} min` : `${n}s`}
                                    </button>
                                ))}
                            </div>
                            <span className={styles.settingHint}>Run out and you lose the game.</span>
                        </div>
                    )}

                    <div className={styles.settingGroup}>
                        <label>Sound effects</label>
                        <button
                            className={`${styles.pill} ${styles.pillWide} ${soundEnabled ? styles.pillActive : ''}`}
                            onClick={toggleSound}
                        >
                            {soundEnabled ? 'On' : 'Off'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
