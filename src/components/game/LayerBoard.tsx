// Flat view of the 3x3x3 board: the three layers side by side.
//
// This is the view that works everywhere — no WebGL, no camera to fight, every
// cell visible and tappable at once. It is the default on phones and the
// fallback whenever the 3D canvas cannot run.

'use client';

import { useCallback } from 'react';
import {
    Board,
    Position,
    PlayerNumber,
    positionToIndex,
} from '@/lib/game/types';
import { PieceGlyph, PLAYER_SHAPE_NAME } from './PieceGlyph';
import styles from './LayerBoard.module.css';

interface LayerBoardProps {
    board: Board;
    currentTurn: PlayerNumber;
    winningLine: Position[] | null;
    isTakeoverMode: boolean;
    takeoversRemaining: number;
    pendingMove: Position | null;
    onCellClick: (position: Position) => void;
    disabled?: boolean;
    /** Highlights the cell the computer just played. */
    lastMove?: Position | null;
}

const LAYER_LABELS = ['Bottom layer', 'Middle layer', 'Top layer'];

export function LayerBoard({
    board,
    currentTurn,
    winningLine,
    isTakeoverMode,
    takeoversRemaining,
    pendingMove,
    onCellClick,
    disabled = false,
    lastMove = null,
}: LayerBoardProps) {
    const samePos = (a: Position | null, b: Position) =>
        !!a && a.x === b.x && a.y === b.y && a.z === b.z;

    const isWinning = useCallback(
        (pos: Position) =>
            !!winningLine &&
            winningLine.some(w => w.x === pos.x && w.y === pos.y && w.z === pos.z),
        [winningLine]
    );

    const canPlay = (pos: Position): boolean => {
        if (disabled) return false;
        const value = board[positionToIndex(pos)];
        if (isTakeoverMode) {
            return takeoversRemaining > 0 && value !== null && value !== currentTurn;
        }
        return value === null;
    };

    return (
        <div className={styles.board} data-takeover={isTakeoverMode || undefined}>
            {[0, 1, 2].map(y => (
                <section key={y} className={styles.layer} aria-label={LAYER_LABELS[y]}>
                    <h3 className={styles.layerLabel}>
                        <span className={styles.layerNumber}>{y + 1}</span>
                        <span className={styles.layerName}>{LAYER_LABELS[y].split(' ')[0]}</span>
                    </h3>

                    <div className={styles.grid} role="grid" aria-label={LAYER_LABELS[y]}>
                        {[0, 1, 2].map(z =>
                            [0, 1, 2].map(x => {
                                const pos: Position = { x, y, z };
                                const value = board[positionToIndex(pos)];
                                const playable = canPlay(pos);
                                const pending = samePos(pendingMove, pos);
                                const describeCell = `Layer ${y + 1}, row ${z + 1}, column ${x + 1}`;

                                return (
                                    <button
                                        key={`${x}-${z}`}
                                        type="button"
                                        role="gridcell"
                                        className={styles.cell}
                                        data-playable={playable || undefined}
                                        data-pending={pending || undefined}
                                        data-winning={isWinning(pos) || undefined}
                                        data-last={samePos(lastMove, pos) || undefined}
                                        data-takeover-target={
                                            (isTakeoverMode && playable) || undefined
                                        }
                                        disabled={!playable && !pending}
                                        onClick={() => playable && onCellClick(pos)}
                                        aria-label={
                                            value
                                                ? `${describeCell}: ${PLAYER_SHAPE_NAME[value]}`
                                                : `${describeCell}: empty`
                                        }
                                    >
                                        {value !== null && <PieceGlyph player={value} size={30} />}

                                        {value === null && !pending && (
                                            <span className={styles.dot} aria-hidden="true" />
                                        )}

                                        {pending && (
                                            <span className={styles.ghost}>
                                                <PieceGlyph player={currentTurn} size={30} ghost />
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </section>
            ))}
        </div>
    );
}
