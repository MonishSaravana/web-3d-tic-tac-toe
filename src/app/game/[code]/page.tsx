// Online Multiplayer Game Page

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Position, PlayerNumber, Board, positionToIndex } from '@/lib/game/types';
import { checkWin, isValidMove, isValidTakeover, applyMove, getNextPlayer } from '@/lib/game/logic';
import { GameHUD, WinOverlay, GameTimer, MoveTimer } from '@/components/game';
import { Button, ThemeToggle } from '@/components/ui';
import styles from './page.module.css';

// Types for Supabase data
interface DbLobby {
    id: string;
    code: string;
    status: 'waiting' | 'playing' | 'finished';
    max_players: number;
    time_mode?: 'unlimited' | 'per_move' | 'time_bank';
    time_per_move?: number;
    time_bank?: number;
}

interface DbPlayer {
    id: string;
    lobby_id: string;
    session_id: string;
    nickname: string;
    player_number: number | null;
    takeovers_remaining: number;
    is_ready: boolean;
}

interface DbGame {
    id: string;
    lobby_id: string;
    board: (number | null)[];
    current_turn: number;
    winner: number | null;
}

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

export default function OnlineGamePage() {
    const router = useRouter();
    const params = useParams();
    const lobbyCode = (params.code as string)?.toUpperCase();

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [lobby, setLobby] = useState<DbLobby | null>(null);
    const [players, setPlayers] = useState<DbPlayer[]>([]);
    const [game, setGame] = useState<DbGame | null>(null);
    const [localPlayer, setLocalPlayer] = useState<DbPlayer | null>(null);

    const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
    const [selectedCell, setSelectedCell] = useState<Position | null>(null);
    const [isTakeoverMode, setIsTakeoverMode] = useState(false);
    const [showWinOverlay, setShowWinOverlay] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const channelRef = useRef<any>(null);

    // Initialize theme and load game
    useEffect(() => {
        const savedTheme = localStorage.getItem('ttt-theme') as 'dark' | 'light' || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);

        if (!lobbyCode) return;

        const loadGame = async () => {
            const { getLobbyByCode, getLobbyPlayers, getGameByLobby, getSessionId } = await import('@/lib/supabase');

            const lobbyData = await getLobbyByCode(lobbyCode);
            if (!lobbyData) {
                setError('Lobby not found');
                return;
            }

            if (lobbyData.status !== 'playing') {
                router.push(`/lobby/${lobbyCode}`);
                return;
            }

            setLobby(lobbyData);

            const playersData = await getLobbyPlayers(lobbyData.id);
            setPlayers(playersData);

            const sessionId = getSessionId();
            const me = playersData.find((p: DbPlayer) => p.session_id === sessionId);
            setLocalPlayer(me || null);

            const gameData = await getGameByLobby(lobbyData.id);
            setGame(gameData);
        };

        loadGame();
    }, [lobbyCode, router]);

    // Subscribe to real-time game updates
    useEffect(() => {
        if (!game || !lobby) return;

        const setupSubscription = async () => {
            const { subscribeGame, getSessionId } = await import('@/lib/supabase');

            const channel = subscribeGame(
                game.id,
                lobby.id,
                (updatedGame: DbGame) => {
                    setGame(updatedGame);
                    // Show win overlay when game ends
                    if (updatedGame.winner && !game?.winner) {
                        setTimeout(() => setShowWinOverlay(true), 500);
                    }
                },
                (updatedPlayers: DbPlayer[]) => {
                    setPlayers(updatedPlayers);
                    const sessionId = getSessionId();
                    const me = updatedPlayers.find((p: DbPlayer) => p.session_id === sessionId);
                    if (me) setLocalPlayer(me);
                }
            );

            channelRef.current = channel;
        };

        setupSubscription();

        return () => {
            if (channelRef.current) {
                import('@/lib/supabase').then(({ unsubscribe }) => {
                    unsubscribe(channelRef.current);
                });
            }
        };
    }, [game?.id, lobby?.id]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('ttt-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleCellClick = useCallback(async (position: Position) => {
        if (!game || !localPlayer) return;
        if (game.current_turn !== localPlayer.player_number) return;
        if (game.winner) return;

        const { makeMove, updatePlayerTakeovers } = await import('@/lib/supabase');

        // Cast board from DB format to our Board type
        const board = game.board as Board;
        const index = positionToIndex(position);
        const cellValue = board[index];
        const currentPlayer = localPlayer.player_number as PlayerNumber;

        if (isTakeoverMode) {
            // Takeover logic
            if (cellValue !== null && cellValue !== currentPlayer) {
                const validation = isValidTakeover(board, position, currentPlayer, localPlayer.takeovers_remaining);
                if (!validation.valid) {
                    alert(validation.reason);
                    return;
                }

                const newBoard = applyMove(board, position, currentPlayer);
                const nextTurn = getNextPlayer(currentPlayer);

                // Update game state in Supabase
                await makeMove(game.id, newBoard, nextTurn, null);
                await updatePlayerTakeovers(localPlayer.id, localPlayer.takeovers_remaining - 1);

                setIsTakeoverMode(false);
                setSelectedCell(null);
            }
        } else {
            // Regular move
            if (cellValue === null) {
                if (!isValidMove(board, position, currentPlayer)) {
                    return;
                }

                const newBoard = applyMove(board, position, currentPlayer);
                const winResult = checkWin(newBoard);
                const nextTurn = winResult ? currentPlayer : getNextPlayer(currentPlayer);

                await makeMove(game.id, newBoard, nextTurn, winResult?.winner || null);
                setSelectedCell(null);
            }
        }
    }, [game, localPlayer, isTakeoverMode]);

    const handleLeaveGame = () => {
        router.push('/');
    };

    // Prepare data for HUD
    const hudPlayers = players.map(p => ({
        playerNumber: p.player_number as PlayerNumber,
        nickname: p.nickname,
        takeoverRemaining: p.takeovers_remaining,
        isCurrentTurn: p.player_number === game?.current_turn,
        isLocalPlayer: p.id === localPlayer?.id,
    }));

    // Calculate winning line positions
    const winningLine = game?.winner ? null : null; // TODO: Store winning line in DB or recalculate

    const myTakeovers = localPlayer?.takeovers_remaining ?? 0;
    const isMyTurn = game?.current_turn === localPlayer?.player_number;
    const winner = game?.winner as PlayerNumber | null;
    const winnerPlayer = winner ? players.find(p => p.player_number === winner) : null;

    if (error) {
        return (
            <div className={styles.container}>
                <main className={styles.errorMain}>
                    <h2>Error</h2>
                    <p>{error}</p>
                    <Link href="/">
                        <Button variant="primary">Go Home</Button>
                    </Link>
                </main>
            </div>
        );
    }

    if (!game) {
        return (
            <div className={styles.container}>
                <main className={styles.loadingMain}>
                    <div className={styles.spinner} />
                    <span>Loading game...</span>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.lobbyCode}>Game: {lobbyCode}</span>
                </div>

                <div className={styles.headerCenter}>
                    <GameTimer isRunning={!winner} />
                    {isMyTurn && !winner && (
                        <span className={styles.yourTurn}>Your Turn!</span>
                    )}
                </div>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            {/* Game Area */}
            <main className={styles.main}>
                <div className={styles.gameArea}>
                    {/* 3D Board */}
                    <div className={styles.boardContainer}>
                        <GameBoard
                            board={game.board as Board}
                            currentTurn={game.current_turn as PlayerNumber}
                            hoveredCell={hoveredCell}
                            selectedCell={selectedCell}
                            winningLine={winningLine}
                            isTakeoverMode={isTakeoverMode}
                            takeoversRemaining={myTakeovers}
                            onCellHover={setHoveredCell}
                            onCellClick={handleCellClick}
                            disabled={!isMyTurn || winner !== null}
                        />

                        <div className={styles.controlsHint}>
                            <span>🖱️ Drag to rotate</span>
                            <span>⚲ Scroll to zoom</span>
                        </div>
                    </div>

                    {/* HUD */}
                    <div className={styles.hudContainer}>
                        {/* Move Timer - shows when timer is enabled */}
                        {!winner && lobby?.time_mode && lobby.time_mode !== 'unlimited' && (
                            <MoveTimer
                                mode={lobby.time_mode}
                                timePerMove={lobby.time_per_move ?? 30}
                                timeRemaining={lobby.time_bank ?? 120}
                                isActive={isMyTurn}
                                onTimeUp={async () => {
                                    if (!isMyTurn || !game) return;
                                    // Skip turn when timer runs out
                                    const { makeMove } = await import('@/lib/supabase');
                                    const nextTurn = getNextPlayer(game.current_turn as PlayerNumber);
                                    await makeMove(game.id, game.board, nextTurn, null);
                                }}
                            />
                        )}

                        <GameHUD
                            players={hudPlayers}
                            currentTurn={game.current_turn as PlayerNumber}
                            localPlayerNumber={localPlayer?.player_number as PlayerNumber | null}
                            isTakeoverMode={isTakeoverMode}
                            onToggleTakeover={() => setIsTakeoverMode(!isTakeoverMode)}
                            winner={winner}
                            onLeaveGame={handleLeaveGame}
                        />
                    </div>
                </div>
            </main>

            {/* Win Overlay */}
            {showWinOverlay && winner && winnerPlayer && (
                <WinOverlay
                    winner={winner}
                    winnerName={winnerPlayer.nickname}
                    isLocalWinner={winner === localPlayer?.player_number}
                    onClose={() => setShowWinOverlay(false)}
                />
            )}
        </div>
    );
}
