import type { Metadata, Viewport } from 'next';
import { Space_Mono } from 'next/font/google';
import Script from 'next/script';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const spaceMono = Space_Mono({
    weight: ['400', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-mono',
});

const DESCRIPTION =
    'Play 3D tic tac toe free in your browser. A 3×3×3 cube with 27 cells and 49 ways to win, plus takeovers that let you steal a square. Take on the computer or play a friend online — no sign-up, no download.';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: '3D Tic Tac Toe — play free online on a 3×3×3 cube',
        template: '%s | 3D T³',
    },
    description: DESCRIPTION,
    applicationName: '3D T³',
    keywords: [
        '3D tic tac toe',
        '3d tic tac toe online',
        'play 3d tic tac toe',
        '3x3x3 tic tac toe',
        'tic tac toe 3d game',
        '3D noughts and crosses',
        'qubic',
        'tic tac toe vs computer',
        '3 player tic tac toe',
        '3D T3',
    ],
    authors: [{ name: 'Monish Saravana', url: 'https://monishsaravana.com' }],
    creator: 'Monish Saravana',
    category: 'games',
    alternates: { canonical: '/' },
    openGraph: {
        type: 'website',
        siteName: '3D T³',
        url: SITE_URL,
        title: '3D Tic Tac Toe — play free online on a 3×3×3 cube',
        description: DESCRIPTION,
        locale: 'en_US',
        images: [
            {
                url: '/og.png',
                width: 1200,
                height: 630,
                alt: '3D Tic Tac Toe — three stacked 3×3 layers with a winning line of three',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '3D Tic Tac Toe — play free online on a 3×3×3 cube',
        description:
            'Tic-tac-toe on a 3×3×3 cube: 27 cells, 49 ways to win, and takeovers. Play the computer or a friend.',
        images: ['/og.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: '48x48' },
            { url: '/icon.svg', type: 'image/svg+xml' },
        ],
        apple: '/apple-icon.png',
    },
    manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
        { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    ],
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-theme="dark" suppressHydrationWarning>
            <head>
                {/* Apply the saved theme before paint so the page never flashes. */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `try{var t=localStorage.getItem('ttt-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`,
                    }}
                />
            </head>
            <body className={spaceMono.variable} suppressHydrationWarning>
                {children}

                <Script
                    id="adsbygoogle"
                    strategy="afterInteractive"
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2576947283789645"
                    crossOrigin="anonymous"
                />
            </body>
        </html>
    );
}
