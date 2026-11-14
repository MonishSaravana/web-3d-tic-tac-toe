import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { FAQ } from '@/lib/faq';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
    alternates: { canonical: '/' },
};

const gameSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: '3D Tic Tac Toe (3D T³)',
    alternateName: ['3D T3', '3D Noughts and Crosses', '3x3x3 Tic Tac Toe'],
    url: SITE_URL,
    description:
        'Free browser 3D tic tac toe played on a 3×3×3 cube with 49 winning lines, a takeover mechanic and 2–3 players. Play the computer or a friend online.',
    genre: ['Strategy', 'Board game', 'Puzzle'],
    gamePlatform: ['Web browser', 'Android', 'iOS'],
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    playMode: ['SinglePlayer', 'MultiPlayer'],
    numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3 },
    inLanguage: 'en',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: 'Monish Saravana', url: 'https://monishsaravana.com' },
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
};

export default function HomePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <HomeClient />
        </>
    );
}
