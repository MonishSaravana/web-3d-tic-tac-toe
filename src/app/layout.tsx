import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: "3D T³ | Tic-Tac-Toe in Three Dimensions",
  description: "3D T³ - Tic-Tac-Toe in three dimensions! Play on a 3×3×3 cube with 49 ways to win. Strategic takeovers, 2-3 players, online or local multiplayer.",
  keywords: ["3D T3", "T cubed", "3D Tic-Tac-Toe", "multiplayer game", "online game", "strategy game", "board game"],
  authors: [{ name: "3D T³" }],
  openGraph: {
    title: "3D T³ | Tic-Tac-Toe in Three Dimensions",
    description: "Play Tic-Tac-Toe on a 3×3×3 cube! 49 ways to win, strategic takeovers, 2-3 players.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2576947283789645"
          crossOrigin="anonymous"
        />
      </head>
      <body className={spaceMono.variable} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
