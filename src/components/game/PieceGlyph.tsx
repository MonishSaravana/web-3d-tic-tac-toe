// Flat vector marks for each player, used by the 2D board, the HUD and the
// rules page so a player reads the same everywhere.

import { PlayerNumber, DEFAULT_PIECES } from '@/lib/game/types';

interface PieceGlyphProps {
    player: PlayerNumber;
    size?: number;
    /** Outline only — used for move previews. */
    ghost?: boolean;
    className?: string;
}

export function PieceGlyph({ player, size = 24, ghost = false, className }: PieceGlyphProps) {
    const color = DEFAULT_PIECES[player].color;
    const fill = ghost ? 'none' : color;
    const common = {
        fill,
        stroke: color,
        strokeWidth: ghost ? 1.6 : 1,
        strokeLinejoin: 'round' as const,
        opacity: ghost ? 0.85 : 1,
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            {player === 1 && <circle cx="12" cy="12" r="7.5" {...common} />}
            {player === 2 && <rect x="4.75" y="4.75" width="14.5" height="14.5" rx="2.5" {...common} />}
            {player === 3 && <path d="M12 3.5 20.5 12 12 20.5 3.5 12Z" {...common} />}
        </svg>
    );
}

/** Text fallback for places that cannot take an SVG (document titles, aria text). */
export function pieceSymbol(player: PlayerNumber): string {
    switch (DEFAULT_PIECES[player].type) {
        case 'sphere':
            return '●';
        case 'cube':
            return '■';
        default:
            return '◆';
    }
}

export const PLAYER_SHAPE_NAME: Record<PlayerNumber, string> = {
    1: 'Red circle',
    2: 'Green square',
    3: 'Blue diamond',
};
