import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "3D Tic-Tac-Toe | Multiplayer Strategy Game",
  description: "Play 3D Tic-Tac-Toe online with friends! A multiplayer strategy game on a 3×3×3 grid with unique takeover mechanics. Create or join lobbies and compete in real-time.",
  keywords: ["3D Tic-Tac-Toe", "multiplayer game", "online game", "strategy game", "board game"],
  authors: [{ name: "3D TTT" }],
  openGraph: {
    title: "3D Tic-Tac-Toe | Multiplayer Strategy Game",
    description: "Play 3D Tic-Tac-Toe online with friends! A multiplayer strategy game on a 3×3×3 grid.",
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
      </head>
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
