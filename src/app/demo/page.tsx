// Demo Game Page - Offline local play for testing/demo

'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useDemoGameStore } from '@/lib/game/store';
import { Position, positionToIndex } from '@/lib/game/types';
import { isValidTakeover } from '@/lib/game/logic';
import { GameHUD, WinOverlay } from '@/components/game';
import { Button, ThemeToggle } from '@/components/ui';
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

export default function DemoPage() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
    const [selectedCell, setSelectedCell] = useState<Position | null>(null);
    const [isTakeoverMode, setIsTakeoverMode] = useState(false);
    const [showWinOverlay, setShowWinOverlay] = useState(false);

    const {
        board,
        currentTurn,
        takeovers,
        winner,
        winningLine,
        makeMove,
        makeTakeover,
        resetGame
    } = useDemoGameStore();

    // Initialize theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('ttt-theme') as 'dark' | 'light' || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    // Show win overlay when game ends
    useEffect(() => {
        if (winner) {
            const timer = setTimeout(() => setShowWinOverlay(true), 500);
            return () => clearTimeout(timer);
        }
    }, [winner]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('ttt-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleCellClick = useCallback((position: Position) => {
        const index = positionToIndex(position);
        const cellValue = board[index];

        if (isTakeoverMode) {
            // Attempt takeover
            if (cellValue !== null && cellValue !== currentTurn) {
                // Validate that takeover won't win
                const validation = isValidTakeover(board, position, currentTurn, takeovers[currentTurn]);
                if (!validation.valid) {
                    alert(validation.reason);
                    return;
                }

                const result = makeTakeover(position);
                if (result.success) {
                    setIsTakeoverMode(false);
                    setSelectedCell(null);
                } else if (result.error) {
                    alert(result.error);
                }
            }
        } else {
            // Normal move
            if (cellValue === null) {
                const result = makeMove(position);
                if (!result.success && result.error) {
                    alert(result.error);
                }
                setSelectedCell(null);
            }
        }
    }, [board, currentTurn, isTakeoverMode, takeovers, makeMove, makeTakeover]);

    const handleReset = () => {
        resetGame();
        setShowWinOverlay(false);
        setIsTakeoverMode(false);
        setSelectedCell(null);
        setHoveredCell(null);
    };

    // Create player info for HUD
    const players = [1, 2, 3].map(num => ({
        playerNumber: num as 1 | 2 | 3,
        nickname: `Player ${num}`,
        takeoverRemaining: takeovers[num as 1 | 2 | 3],
        isCurrentTurn: num === currentTurn,
        isLocalPlayer: true, // In demo, all players are "local"
    }));

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>

                <div className={styles.headerCenter}>
                    <span className={styles.demoTag}>Demo Mode</span>
                    <span className={styles.headerTitle}>Local Play</span>
                </div>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            {/* Game Area */}
            <main className={styles.main}>
                <div className={styles.gameArea}>
                    {/* 3D Board */}
                    <div className={styles.boardContainer}>
                        <GameBoard
                            board={board}
                            currentTurn={currentTurn}
                            hoveredCell={hoveredCell}
                            selectedCell={selectedCell}
                            winningLine={winningLine}
                            isTakeoverMode={isTakeoverMode}
                            takeoversRemaining={takeovers[currentTurn]}
                            onCellHover={setHoveredCell}
                            onCellClick={handleCellClick}
                            disabled={winner !== null}
                        />

                        {/* Controls hint */}
                        <div className={styles.controlsHint}>
                            <span>🖱️ Drag to rotate</span>
                            <span>⚲ Scroll to zoom</span>
                            <span>⇧ Shift+drag to pan</span>
                        </div>
                    </div>

                    {/* HUD */}
                    <div className={styles.hudContainer}>
                        <GameHUD
                            players={players}
                            currentTurn={currentTurn}
                            localPlayerNumber={currentTurn} // In demo, current player is always "local"
                            isTakeoverMode={isTakeoverMode}
                            onToggleTakeover={() => setIsTakeoverMode(!isTakeoverMode)}
                            winner={winner}
                            onPlayAgain={handleReset}
                        />

                        {/* Reset button */}
                        {!winner && (
                            <div className={styles.extraControls}>
                                <Button variant="ghost" fullWidth onClick={handleReset}>
                                    Reset Game
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Win Overlay */}
            {showWinOverlay && winner && (
                <WinOverlay
                    winner={winner}
                    winnerName={`Player ${winner}`}
                    isLocalWinner={true}
                    onClose={() => setShowWinOverlay(false)}
                />
            )}
        </div>
    );
}
