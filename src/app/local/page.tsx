import type { Metadata } from 'next';
import LocalGame from './LocalGame';

export const metadata: Metadata = {
    title: 'Play 3D Tic Tac Toe — against the computer or a friend',
    description:
        'Play 3D tic tac toe free in your browser. Take on the computer on easy, medium or hard, or pass one device between 2–3 players. No sign-up, no download.',
    alternates: { canonical: '/local' },
    openGraph: {
        title: 'Play 3D Tic Tac Toe — against the computer or a friend',
        description:
            'Free 3D tic tac toe on a 3×3×3 cube. Play the computer or pass-and-play with friends.',
        url: '/local',
    },
};

export default function LocalPage() {
    return <LocalGame />;
}
