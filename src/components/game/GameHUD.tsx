// Game HUD - player cards, turn indicator and (optionally) the takeover control.

'use client';

import { PlayerNumber } from '@/lib/game/types';
import { Button } from '@/components/ui/Button';
import { PieceGlyph } from './PieceGlyph';
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
    isDraw?: boolean;
    onPlayAgain?: () => void;
    onLeaveGame?: () => void;
    /** Pages that put the takeover button under the board hide it here. */
    showControls?: boolean;
    /** Pages that show their own status line above the board hide it here. */
    showStatus?: boolean;
}

export function GameHUD({
    players,
    currentTurn,
    localPlayerNumber,
    isTakeoverMode,
    onToggleTakeover,
    winner,
    isDraw = false,
    onPlayAgain,
    onLeaveGame,
    showControls = true,
    showStatus = true,
}: GameHUDProps) {
    const isMyTurn = localPlayerNumber === currentTurn;
    const myTakeoverCount =
        players.find(p => p.playerNumber === localPlayerNumber)?.takeoverRemaining ?? 0;
    const isOver = winner !== null || isDraw;

    return (
        <div className={styles.hud}>
            {showStatus && (
                <div className={styles.status}>
                    {isOver ? (
                        <div className={styles.winnerBanner}>
                            {winner !== null && <PieceGlyph player={winner} size={20} />}
                            <span>
                                {isDraw ? (
                                    <strong>Draw</strong>
                                ) : (
                                    <>
                                        <strong>
                                            {players.find(p => p.playerNumber === winner)?.nickname ??
                                                `Player ${winner}`}
                                        </strong>{' '}
                                        wins!
                                    </>
                                )}
                            </span>
                        </div>
                    ) : (
                        <div className={styles.turnIndicator}>
                            <PieceGlyph player={currentTurn} size={20} />
                            <span>
                                {isMyTurn ? (
                                    <strong>Your turn</strong>
                                ) : (
                                    <>
                                        {players.find(p => p.playerNumber === currentTurn)?.nickname ??
                                            `Player ${currentTurn}`}
                                        ’s turn
                                    </>
                                )}
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div className={styles.players}>
                {players.map(player => {
                    const isCurrent = player.playerNumber === currentTurn && !isOver;
                    const isLocal = player.playerNumber === localPlayerNumber;

                    return (
                        <div
                            key={player.playerNumber}
                            className={`${styles.playerCard} ${isCurrent ? styles.active : ''} ${isLocal ? styles.local : ''}`}
                        >
                            <div className={styles.playerHeader}>
                                <PieceGlyph player={player.playerNumber} size={18} />
                                <span className={styles.playerName}>
                                    {player.nickname}
                                    {isLocal && <span className={styles.youBadge}>You</span>}
                                </span>
                            </div>

                            <div className={styles.playerStats}>
                                <span
                                    className={styles.takeovers}
                                    title={`${player.takeoverRemaining} takeovers left`}
                                >
                                    <span className={styles.takeoverIcon} aria-hidden="true">
                                        ⚡
                                    </span>
                                    {player.takeoverRemaining}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showControls && !isOver && isMyTurn && localPlayerNumber && (
                <div className={styles.controls}>
                    <Button
                        variant={isTakeoverMode ? 'danger' : 'secondary'}
                        onClick={onToggleTakeover}
                        disabled={myTakeoverCount <= 0}
                        fullWidth
                    >
                        {isTakeoverMode ? 'Cancel takeover' : `⚡ Takeover (${myTakeoverCount})`}
                    </Button>

                    {isTakeoverMode && (
                        <p className={styles.takeoverHint}>
                            Pick an opponent piece to replace.
                            <br />
                            <small>A takeover can’t be the move that wins.</small>
                        </p>
                    )}
                </div>
            )}

            {isOver && (onPlayAgain || onLeaveGame) && (
                <div className={styles.gameOverActions}>
                    {onPlayAgain && (
                        <Button variant="primary" onClick={onPlayAgain} fullWidth>
                            Play again
                        </Button>
                    )}
                    {onLeaveGame && (
                        <Button variant="secondary" onClick={onLeaveGame} fullWidth>
                            Leave game
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

interface WinOverlayProps {
    winner: PlayerNumber | null;
    winnerName: string;
    /** True when the viewer themself won — drives the “You win!” wording. */
    isLocalWinner: boolean;
    /** Hot-seat games have no “you”, so they celebrate either way. */
    neutral?: boolean;
    isDraw?: boolean;
    onPlayAgain?: () => void;
    onClose: () => void;
}

export function WinOverlay({
    winner,
    winnerName,
    isLocalWinner,
    neutral = false,
    isDraw = false,
    onPlayAgain,
    onClose,
}: WinOverlayProps) {
    const celebrates = neutral || isLocalWinner;

    const title = isDraw
        ? 'Draw'
        : neutral || !isLocalWinner
            ? `${winnerName} wins!`
            : 'You win!';

    const subtitle = isDraw
        ? 'All 27 cells filled with no line of three.'
        : celebrates
            ? 'Three in a row through the cube.'
            : 'Close one — go again?';

    return (
        <div className={styles.winOverlay} onClick={onClose} role="presentation">
            <div
                className={styles.winContent}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className={styles.winEmoji} aria-hidden="true">
                    {isDraw ? '🤝' : celebrates ? '🎉' : '😤'}
                </div>
                <h2 className={styles.winTitle}>{title}</h2>
                <p className={styles.winSubtitle}>{subtitle}</p>

                {winner !== null && !isDraw && (
                    <span className={styles.winnerPiece}>
                        <PieceGlyph player={winner} size={44} />
                    </span>
                )}

                <div className={styles.winActions}>
                    {onPlayAgain && (
                        <Button variant="primary" onClick={onPlayAgain}>
                            Play again
                        </Button>
                    )}
                    <Button variant="ghost" onClick={onClose}>
                        See the board
                    </Button>
                </div>
            </div>
        </div>
    );
}
