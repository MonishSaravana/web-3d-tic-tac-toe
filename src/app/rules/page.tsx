import type { Metadata } from 'next';
import RulesContent from './RulesContent';

export const metadata: Metadata = {
    title: '3D Tic Tac Toe rules — all 49 winning lines explained',
    description:
        'The full rules of 3D tic tac toe on a 3×3×3 cube: how the 49 winning lines work, how takeovers work, the pieces, the controls and the strategy that actually wins games.',
    alternates: { canonical: '/rules' },
    openGraph: {
        title: '3D Tic Tac Toe rules — all 49 winning lines explained',
        description:
            'How the 49 winning lines of a 3×3×3 cube work, plus the takeover rule and strategy tips.',
        url: '/rules',
    },
};

export default function RulesPage() {
    return <RulesContent />;
}
