// Shared between the rendered FAQ section and the FAQPage structured data, so
// the markup and the schema can never drift apart.

export interface FaqItem {
    q: string;
    a: string;
}

export const FAQ: FaqItem[] = [
    {
        q: 'How do you win at 3D tic tac toe?',
        a: 'Get three of your marks in a straight line anywhere in the 3×3×3 cube. The line can run across a layer, straight up through all three layers, diagonally within a layer, or corner-to-corner through the middle of the cube — 49 lines in total.',
    },
    {
        q: 'Is 3D tic tac toe a solved game?',
        a: 'The plain 3×3×3 version is a first-player win with perfect play, which is why this version adds takeovers: each player can replace an opponent’s piece a limited number of times, so an early centre grab is no longer decisive.',
    },
    {
        q: 'Can I play 3D tic tac toe against the computer?',
        a: 'Yes. Pick “vs Computer” and choose easy, medium or hard. Hard blocks every immediate threat and hunts for forks, so it is genuinely hard to beat.',
    },
    {
        q: 'Can three people play?',
        a: 'Yes — 3-player games are supported both on one device and online. With three players, temporary alliances matter as much as the lines you build.',
    },
    {
        q: 'Do I need an account or a download?',
        a: 'No. It runs in the browser, it is free, and nothing is installed. Online games just need a six-character room code to share.',
    },
];
