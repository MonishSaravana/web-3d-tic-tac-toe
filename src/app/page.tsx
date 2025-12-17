// Home Page - Landing page with 3D interactive demo

'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button, Input, Card, Modal, ThemeToggle } from '@/components/ui';
import styles from './page.module.css';

// Dynamic import for the 3D board to avoid SSR issues
const DemoBoard = dynamic(
  () => import('@/components/three/GameBoard').then(mod => ({ default: mod.DemoBoard })),
  {
    ssr: false,
    loading: () => (
      <div className={styles.boardPlaceholder}>
        <div className={styles.loadingSpinner} />
      </div>
    ),
  }
);

export default function HomePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');
  const [nickname, setNickname] = useState('');

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('ttt-theme') as 'dark' | 'light' || 'dark';
    const savedNickname = localStorage.getItem('ttt-nickname') || '';
    setTheme(savedTheme);
    setNickname(savedNickname);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('ttt-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    localStorage.setItem('ttt-nickname', value);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◆</span>
          <span>3D TTT</span>
        </div>
        <nav className={styles.nav}>
          <Link href="/demo" className={styles.navLink}>Demo</Link>
          <Link href="/rules" className={styles.navLink}>Rules</Link>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </nav>
      </header>

      {/* Hero Section */}
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              3D Tic-Tac-Toe
            </h1>
            <p className={styles.subtitle}>
              A multiplayer strategy game on a 3×3×3 grid.
              <br />
              Three players. Unique takeover mechanics. Pure strategy.
            </p>

            {/* Nickname input */}
            <div className={styles.nicknameInput}>
              <Input
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                maxLength={20}
              />
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
              <Link href="/demo">
                <Button variant="primary" size="lg">
                  Play Demo
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowJoinModal(true)}
              >
                Join Lobby
              </Button>
            </div>

            <div className={styles.actionsDivider}>
              <span>or</span>
            </div>

            <Link href="/lobby/create">
              <Button variant="ghost" size="lg" fullWidth>
                Create New Lobby
              </Button>
            </Link>
          </div>

          {/* 3D Demo Board */}
          <div className={styles.heroBoard}>
            <DemoBoard autoRotate />
          </div>
        </div>

        {/* Features */}
        <section className={styles.features}>
          <Card hover padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>🎮</div>
            <h3>3 Player Battles</h3>
            <p>Compete against two opponents in a strategic three-way match.</p>
          </Card>

          <Card hover padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>Takeover Mechanic</h3>
            <p>Use limited takeovers to steal opponent pieces. But be strategic—you can't win with a takeover!</p>
          </Card>

          <Card hover padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>🌐</div>
            <h3>Real-time Multiplayer</h3>
            <p>Play online with friends. Create or join lobbies instantly.</p>
          </Card>

          <Card hover padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>🔄</div>
            <h3>Interactive 3D</h3>
            <p>Rotate, zoom, and pan the 3D board for the perfect view.</p>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          Built with Next.js & Three.js
        </p>
      </footer>

      {/* Join Lobby Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Lobby"
        size="sm"
      >
        <div className={styles.joinForm}>
          <Input
            label="Lobby Code"
            placeholder="Enter 6-character code"
            value={lobbyCode}
            onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
            maxLength={6}
            fullWidth
          />
          <Button
            variant="primary"
            fullWidth
            disabled={lobbyCode.length !== 6}
            onClick={() => {
              // Navigate to lobby
              window.location.href = `/lobby/${lobbyCode}`;
            }}
          >
            Join
          </Button>
        </div>
      </Modal>
    </div>
  );
}
