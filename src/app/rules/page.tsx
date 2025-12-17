// Rules Page - Game rules and how to play

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle, Card } from '@/components/ui';
import styles from './page.module.css';

export default function RulesPage() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('ttt-theme') as 'dark' | 'light' || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('ttt-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>

                <h1 className={styles.headerTitle}>Game Rules</h1>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            {/* Content */}
            <main className={styles.main}>
                <div className={styles.content}>
                    <section className={styles.section}>
                        <h2>Overview</h2>
                        <p>
                            3D Tic-Tac-Toe is a multiplayer strategy game played on a <strong>3×3×3 grid</strong>,
                            where three players compete to align three of their symbols consecutively in any
                            direction—horizontal, vertical, diagonal, or spanning across layers.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Objective</h2>
                        <p>
                            Be the first player to get <strong>three of your pieces in a row</strong>.
                            Winning lines can be formed:
                        </p>
                        <ul className={styles.list}>
                            <li>Horizontally within any layer</li>
                            <li>Vertically within any layer</li>
                            <li>Diagonally within any layer</li>
                            <li>Vertically across all three layers (pillars)</li>
                            <li>Diagonally across all three layers (3D diagonals)</li>
                        </ul>
                        <p>
                            There are <strong>49 possible winning lines</strong> in total!
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Players & Pieces</h2>
                        <div className={styles.playersGrid}>
                            <Card padding="md">
                                <div className={styles.playerInfo}>
                                    <span className={styles.pieceIcon} style={{ color: '#ffffff' }}>●</span>
                                    <div>
                                        <strong>Player 1</strong>
                                        <span>Sphere • 2 Takeovers</span>
                                    </div>
                                </div>
                            </Card>
                            <Card padding="md">
                                <div className={styles.playerInfo}>
                                    <span className={styles.pieceIcon} style={{ color: '#888888' }}>■</span>
                                    <div>
                                        <strong>Player 2</strong>
                                        <span>Cube • 3 Takeovers</span>
                                    </div>
                                </div>
                            </Card>
                            <Card padding="md">
                                <div className={styles.playerInfo}>
                                    <span className={styles.pieceIcon} style={{ color: '#444444' }}>◆</span>
                                    <div>
                                        <strong>Player 3</strong>
                                        <span>Octahedron • 3 Takeovers</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2>Turn Order</h2>
                        <p>
                            Players take turns in order: <strong>Player 1 → Player 2 → Player 3 → Player 1...</strong>
                        </p>
                        <p>
                            On your turn, you can either:
                        </p>
                        <ol className={styles.list}>
                            <li><strong>Place a piece</strong> on any empty cell</li>
                            <li><strong>Use a takeover</strong> to replace an opponent's piece with your own</li>
                        </ol>
                    </section>

                    <section className={styles.section}>
                        <h2>The Takeover Mechanic</h2>
                        <Card variant="outlined" padding="lg" className={styles.highlightCard}>
                            <h3>⚡ Takeover Rules</h3>
                            <ul className={styles.list}>
                                <li>Each player starts with a limited number of takeovers (Player 1: 2, Players 2 & 3: 3)</li>
                                <li>A takeover allows you to <strong>replace an opponent's piece</strong> with your own</li>
                                <li>You <strong>cannot takeover your own pieces</strong></li>
                                <li className={styles.important}>
                                    <strong>You cannot use a takeover to directly win the game!</strong>
                                    <br />
                                    <small>If a takeover would complete a winning line, it's not allowed.</small>
                                </li>
                                <li>Once used, takeovers are gone—use them wisely!</li>
                            </ul>
                        </Card>
                    </section>

                    <section className={styles.section}>
                        <h2>Controls</h2>
                        <div className={styles.controlsGrid}>
                            <div className={styles.control}>
                                <span className={styles.controlIcon}>🖱️</span>
                                <div>
                                    <strong>Rotate</strong>
                                    <span>Click and drag</span>
                                </div>
                            </div>
                            <div className={styles.control}>
                                <span className={styles.controlIcon}>⚲</span>
                                <div>
                                    <strong>Zoom</strong>
                                    <span>Scroll wheel</span>
                                </div>
                            </div>
                            <div className={styles.control}>
                                <span className={styles.controlIcon}>⇧</span>
                                <div>
                                    <strong>Pan</strong>
                                    <span>Shift + drag</span>
                                </div>
                            </div>
                            <div className={styles.control}>
                                <span className={styles.controlIcon}>👆</span>
                                <div>
                                    <strong>Select Cell</strong>
                                    <span>Click on cell</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2>Tips & Strategy</h2>
                        <ul className={styles.list}>
                            <li>Control the center of the board—it's part of more winning lines</li>
                            <li>Watch both opponents, not just one</li>
                            <li>Save takeovers for critical moments</li>
                            <li>Block winning attempts, but don't forget your own offense</li>
                            <li>Think in 3D—check all layers for threats and opportunities</li>
                        </ul>
                    </section>

                    <div className={styles.cta}>
                        <Link href="/demo" className={styles.ctaButton}>
                            Try Demo Mode
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
