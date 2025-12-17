// Game HUD Component - Shows player info, turn indicator, and takeover controls

'use client';

import { PlayerNumber, INITIAL_TAKEOVERS, DEFAULT_PIECES } from '@/lib/game/types';
import { Button } from '@/components/ui/Button';
import styles from './GameHUD.module.css';

interface PlayerInfo {
    playerNumber: PlayerNumber;
    nickname: string;
    takeoverRemaining: number;
    isCurrentTurn: boolean;
    isLocalPlayer: boolean;
}

interface GameHUDProps {
    players: PlayerInfo[];
    currentTurn: PlayerNumber;
    localPlayerNumber: PlayerNumber | null;
    isTakeoverMode: boolean;
    onToggleTakeover: () => void;
    winner: PlayerNumber | null;
    onPlayAgain?: () => void;
    onLeaveGame?: () => void;
}

export function GameHUD({
    players,
    currentTurn,
    localPlayerNumber,
    isTakeoverMode,
    onToggleTakeover,
    winner,
    onPlayAgain,
    onLeaveGame,
}: GameHUDProps) {
    const isMyTurn = localPlayerNumber === currentTurn;
    const myTakeoverCount = players.find(p => p.playerNumber === localPlayerNumber)?.takeoverRemaining ?? 0;

    const getPieceIcon = (player: PlayerNumber) => {
        const config = DEFAULT_PIECES[player];
        switch (config.type) {
            case 'sphere': return '●';
            case 'cube': return '■';
            case 'octahedron': return '◆';
            default: return '○';
        }
    };

    return (
        <div className={styles.hud}>
            {/* Game Status */}
            <div className={styles.status}>
                {winner ? (
                    <div className={styles.winnerBanner}>
                        <span className={styles.winnerIcon}>{getPieceIcon(winner)}</span>
                        <span>
                            <strong>Player {winner}</strong> wins!
                        </span>
                    </div>
                ) : (
                    <div className={styles.turnIndicator}>
                        <span className={styles.turnIcon} style={{ color: DEFAULT_PIECES[currentTurn].color }}>
                            {getPieceIcon(currentTurn)}
                        </span>
                        <span>
                            {isMyTurn ? (
                                <strong>Your turn</strong>
                            ) : (
                                <>Player <strong>{currentTurn}</strong>'s turn</>
                            )}
                        </span>
                    </div>
                )}
            </div>

            {/* Players list */}
            <div className={styles.players}>
                {[1, 2, 3].map((num) => {
                    const player = players.find(p => p.playerNumber === num);
                    const isWaiting = !player;
                    const isCurrent = num === currentTurn;
                    const isLocal = num === localPlayerNumber;

                    return (
                        <div
                            key={num}
                            className={`${styles.playerCard} ${isCurrent ? styles.active : ''} ${isLocal ? styles.local : ''}`}
                        >
                            <div className={styles.playerHeader}>
                                <span
                                    className={styles.pieceIcon}
                                    style={{ color: DEFAULT_PIECES[num as PlayerNumber].color }}
                                >
                                    {getPieceIcon(num as PlayerNumber)}
                                </span>
                                <span className={styles.playerName}>
                                    {isWaiting ? 'Waiting...' : player?.nickname || `Player ${num}`}
                                    {isLocal && <span className={styles.youBadge}>You</span>}
                                </span>
                            </div>

                            {!isWaiting && player && (
                                <div className={styles.playerStats}>
                                    <span className={styles.takeovers}>
                                        <span className={styles.takeoverIcon}>⚡</span>
                                        {player.takeoverRemaining}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            {!winner && isMyTurn && localPlayerNumber && (
                <div className={styles.controls}>
                    <Button
                        variant={isTakeoverMode ? 'danger' : 'secondary'}
                        onClick={onToggleTakeover}
                        disabled={myTakeoverCount <= 0}
                        fullWidth
                    >
                        {isTakeoverMode ? (
                            <>Cancel Takeover</>
                        ) : (
                            <>⚡ Takeover ({myTakeoverCount})</>
                        )}
                    </Button>

                    {isTakeoverMode && (
                        <p className={styles.takeoverHint}>
                            Click an opponent's piece to take it over.
                            <br />
                            <small>Note: Takeovers cannot directly win the game.</small>
                        </p>
                    )}
                </div>
            )}

            {/* Game over actions */}
            {winner && (
                <div className={styles.gameOverActions}>
                    {onPlayAgain && (
                        <Button variant="primary" onClick={onPlayAgain} fullWidth>
                            Play Again
                        </Button>
                    )}
                    {onLeaveGame && (
                        <Button variant="secondary" onClick={onLeaveGame} fullWidth>
                            Leave Game
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// Win overlay that appears when someone wins
interface WinOverlayProps {
    winner: PlayerNumber;
    winnerName: string;
    isLocalWinner: boolean;
    onClose: () => void;
}

export function WinOverlay({ winner, winnerName, isLocalWinner, onClose }: WinOverlayProps) {
    return (
        <div className={styles.winOverlay} onClick={onClose}>
            <div className={styles.winContent}>
                <div className={styles.winEmoji}>
                    {isLocalWinner ? '🎉' : '😔'}
                </div>
                <h2 className={styles.winTitle}>
                    {isLocalWinner ? 'You Win!' : `${winnerName} Wins!`}
                </h2>
                <p className={styles.winSubtitle}>
                    {isLocalWinner
                        ? 'Congratulations on your victory!'
                        : 'Better luck next time!'}
                </p>
                <span
                    className={styles.winnerPiece}
                    style={{ color: DEFAULT_PIECES[winner].color }}
                >
                    {DEFAULT_PIECES[winner].type === 'sphere' ? '●' :
                        DEFAULT_PIECES[winner].type === 'cube' ? '■' : '◆'}
                </span>
            </div>
        </div>
    );
}
