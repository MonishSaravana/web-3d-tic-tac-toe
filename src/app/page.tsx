// 3D T³ Home Page
// Clean design with Local/Online play options and visual how-to-play section

'use client';

import { useState, useEffect, useId } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button, Input, ThemeToggle, Card, Modal } from '@/components/ui';
import styles from './page.module.css';

// Dynamic import for 3D demo board (no SSR needed for Three.js)
const DemoBoard = dynamic(
  () => import('@/components/three/GameBoard').then(mod => ({ default: mod.DemoBoard })),
  {
    ssr: false,
    loading: () => (
      <div className={styles.boardLoading}>
        <div className={styles.spinner} />
      </div>
    ),
  }
);

export default function HomePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [nickname, setNickname] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');

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
        <Link href="/" className={styles.logo}>
          3D T<sup>3</sup>
        </Link>

        <nav className={styles.nav}>
          <Link href="/rules" className={styles.navLink}>Rules</Link>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </nav>
      </header>

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              3D T<sup>3</sup>
            </h1>
            <p className={styles.tagline}>
              Tic-Tac-Toe in Three Dimensions
            </p>
            <p className={styles.subtitle}>
              2-3 Players • Strategic Takeovers • 49 Ways to Win
            </p>

            {/* Nickname Input */}
            <div className={styles.nicknameRow}>
              <Input
                placeholder="Enter nickname"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                maxLength={15}
                className={styles.nicknameInput}
              />
            </div>

            {/* Play Buttons */}
            <div className={styles.playButtons}>
              <Link href="/local" className={styles.playLink}>
                <Button variant="primary" size="lg" fullWidth disabled={!nickname.trim()}>
                  🎮 Local Play
                </Button>
              </Link>

              <div className={styles.onlineButtons}>
                <Link href="/lobby/create" className={styles.playLink}>
                  <Button variant="secondary" size="lg" fullWidth disabled={!nickname.trim()}>
                    ➕ Create Game
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled={!nickname.trim()}
                  onClick={() => setShowJoinModal(true)}
                >
                  🔗 Join Game
                </Button>
              </div>
            </div>
          </div>

          {/* 3D Demo Board */}
          <div className={styles.heroBoard}>
            <DemoBoard autoRotate />
          </div>
        </section>

        {/* How to Play Section - Visual & Clear */}
        <section className={styles.howToPlay}>
          <h2>What is 3D T³?</h2>
          <p className={styles.introText}>
            Classic Tic-Tac-Toe... but in <strong>3 dimensions</strong>. Instead of a flat 3×3 grid,
            you play on a <strong>3×3×3 cube</strong> — 27 cells stacked in 3 layers!
          </p>

          {/* Visual explanation */}
          <div className={styles.visualExplain}>
            <div className={styles.gridVisual}>
              <div className={styles.layerStack}>
                <div className={styles.visualLayer}>
                  <span className={styles.layerNum}>3</span>
                  <div className={styles.miniLayer}>
                    {[...Array(9)].map((_, i) => <div key={i} className={styles.miniCell} />)}
                  </div>
                </div>
                <div className={styles.visualLayer}>
                  <span className={styles.layerNum}>2</span>
                  <div className={styles.miniLayer}>
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className={`${styles.miniCell} ${i === 4 ? styles.centerCell : ''}`} />
                    ))}
                  </div>
                </div>
                <div className={styles.visualLayer}>
                  <span className={styles.layerNum}>1</span>
                  <div className={styles.miniLayer}>
                    {[...Array(9)].map((_, i) => <div key={i} className={styles.miniCell} />)}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.explainText}>
              <h3>3 Layers, 27 Cells, 49 Winning Lines</h3>
              <ul>
                <li>Win by getting <strong>3 in a row</strong> in ANY direction</li>
                <li>Lines can go horizontal, vertical, diagonal, or <strong>through layers</strong></li>
                <li>The <span className={styles.centerHighlight}>center cell</span> is key — it's part of 13 winning lines!</li>
              </ul>
            </div>
          </div>

          {/* Key mechanics */}
          <div className={styles.mechanicsGrid}>
            <div className={styles.mechanic}>
              <div className={styles.mechanicIcon}>⚡</div>
              <h4>Takeovers</h4>
              <p>Replace an opponent's piece with yours! Each player gets 5 takeovers per game to disrupt strategies.</p>
            </div>

            <div className={styles.mechanic}>
              <div className={styles.mechanicIcon}>🚫</div>
              <h4>No Instant Wins</h4>
              <p>You can't use a takeover to directly complete a winning line — pure strategy required!</p>
            </div>

            <div className={styles.mechanic}>
              <div className={styles.mechanicIcon}>🌐</div>
              <h4>Multiplayer</h4>
              <p>Play locally on one device or create an online lobby with a shareable code.</p>
            </div>
          </div>

          <Link href="/rules" className={styles.fullRulesLink}>
            📖 See all 49 winning lines & full rules →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>3D T³ — A strategic twist on a classic</p>
      </footer>

      {/* Join Lobby Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Game"
      >
        <div className={styles.modalContent}>
          <p>Enter the 6-character lobby code to join a game.</p>

          <Input
            label="Lobby Code"
            placeholder="ABC123"
            value={lobbyCode}
            onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
            maxLength={6}
            fullWidth
          />

          <Link
            href={lobbyCode.length === 6 ? `/lobby/${lobbyCode}` : '#'}
            onClick={(e) => lobbyCode.length !== 6 && e.preventDefault()}
          >
            <Button
              variant="primary"
              fullWidth
              disabled={lobbyCode.length !== 6}
            >
              Join Lobby
            </Button>
          </Link>
        </div>
      </Modal>
    </div>
  );
}
