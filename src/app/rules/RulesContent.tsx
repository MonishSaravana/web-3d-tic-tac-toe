// Rules page content (client-side only for the theme toggle).

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle, Card } from '@/components/ui';
import { DEFAULT_PIECES } from '@/lib/game/types';
import { PieceGlyph } from '@/components/game';
import styles from './page.module.css';

export default function RulesContent() {
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
                    Home
                </Link>

                <Link href="/" className={styles.logo}>T<sup>3</sup></Link>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            {/* Content */}
            <main className={styles.main}>
                <div className={styles.content}>
                    <h1>Game Rules</h1>

                    {/* Overview */}
                    <section className={styles.section}>
                        <h2>🎯 Objective</h2>
                        <p>
                            Be the first to get <strong>3 of your pieces in a row</strong> on a 3×3×3 grid.
                            Lines can form in any direction — including through the center of the cube!
                        </p>
                    </section>

                    {/* Winning Lines */}
                    <section className={styles.section}>
                        <h2>✨ Winning Lines (49 Total)</h2>
                        <p>There are 49 straight lines of three cells in a 3×3×3 cube, and any one of them wins:</p>

                        <div className={styles.lineGrid}>
                            <Card padding="md" className={styles.lineCard}>
                                <span className={styles.lineCount}>18</span>
                                <span className={styles.lineType}>Rows</span>
                                <span className={styles.lineDesc}>Straight lines across each layer, both directions</span>
                            </Card>

                            <Card padding="md" className={styles.lineCard}>
                                <span className={styles.lineCount}>9</span>
                                <span className={styles.lineType}>Pillars</span>
                                <span className={styles.lineDesc}>Straight up through all three layers</span>
                            </Card>

                            <Card padding="md" className={styles.lineCard}>
                                <span className={styles.lineCount}>18</span>
                                <span className={styles.lineType}>Plane diagonals</span>
                                <span className={styles.lineDesc}>Corner to corner inside any flat slice of the cube</span>
                            </Card>

                            <Card padding="md" className={styles.lineCard}>
                                <span className={styles.lineCount}>4</span>
                                <span className={styles.lineType}>Space diagonals</span>
                                <span className={styles.lineDesc}>Cube corner to cube corner through the centre</span>
                            </Card>
                        </div>

                        {/* Visual diagram */}
                        <div className={styles.diagram}>
                            <div className={styles.diagramGrid}>
                                {/* 3x3x3 visualization */}
                                <div className={styles.layer}>
                                    <span className={styles.layerLabel}>Top Layer</span>
                                    <div className={styles.miniGrid}>
                                        {[...Array(9)].map((_, i) => <div key={i} className={styles.cell} />)}
                                    </div>
                                </div>
                                <div className={styles.layer}>
                                    <span className={styles.layerLabel}>Middle Layer</span>
                                    <div className={styles.miniGrid}>
                                        {[...Array(9)].map((_, i) => (
                                            <div key={i} className={`${styles.cell} ${i === 4 ? styles.center : ''}`} />
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.layer}>
                                    <span className={styles.layerLabel}>Bottom Layer</span>
                                    <div className={styles.miniGrid}>
                                        {[...Array(9)].map((_, i) => <div key={i} className={styles.cell} />)}
                                    </div>
                                </div>
                            </div>
                            <p className={styles.diagramCaption}>
                                The center cell is the most powerful — it's part of 13 winning lines!
                            </p>
                        </div>
                    </section>

                    {/* Players & Pieces */}
                    <section className={styles.section}>
                        <h2>👥 Players & Pieces</h2>
                        <p>Games take 2 or 3 players. Each one has a distinct shape as well as a colour, so the board stays readable without relying on colour alone:</p>

                        <div className={styles.playersGrid}>
                            <Card padding="md" className={styles.playerCard}>
                                <PieceGlyph player={1} size={28} />
                                <div>
                                    <strong>Player 1</strong>
                                    <span>Red circle</span>
                                </div>
                            </Card>
                            <Card padding="md" className={styles.playerCard}>
                                <PieceGlyph player={2} size={28} />
                                <div>
                                    <strong>Player 2</strong>
                                    <span>Green square</span>
                                </div>
                            </Card>
                            <Card padding="md" className={styles.playerCard}>
                                <PieceGlyph player={3} size={28} />
                                <div>
                                    <strong>Player 3</strong>
                                    <span>Blue diamond</span>
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* Takeover Mechanic */}
                    <section className={styles.section}>
                        <h2>⚡ The Takeover Mechanic</h2>

                        <Card variant="elevated" padding="lg" className={styles.takeoverCard}>
                            <h3>What is a Takeover?</h3>
                            <p>
                                Instead of placing a new piece on an empty cell, you can <strong>replace an opponent's
                                    piece</strong> with your own. This powerful ability lets you disrupt their strategy!
                            </p>

                            <div className={styles.takeoverRules}>
                                <div className={styles.ruleItem}>
                                    <span className={styles.ruleIcon}>✅</span>
                                    <span>Each player starts with <strong>3 takeovers</strong> per game (adjustable in the game options)</span>
                                </div>
                                <div className={styles.ruleItem}>
                                    <span className={styles.ruleIcon}>✅</span>
                                    <span>Can only takeover <strong>opponent's pieces</strong>, not your own</span>
                                </div>
                                <div className={styles.ruleItem}>
                                    <span className={styles.ruleIcon}>✅</span>
                                    <span>Takeover counts as your turn</span>
                                </div>
                                <div className={`${styles.ruleItem} ${styles.warning}`}>
                                    <span className={styles.ruleIcon}>🚫</span>
                                    <span><strong>Cannot takeover to win!</strong> If the takeover would complete a winning line, it's blocked.</span>
                                </div>
                            </div>

                            <div className={styles.takeoverExample}>
                                <h4>Example:</h4>
                                <div className={styles.exampleRow}>
                                    <div className={styles.exampleCell}>
                                        <span style={{ color: DEFAULT_PIECES[1].color }}>●</span>
                                        <span style={{ color: DEFAULT_PIECES[2].color }}>■</span>
                                        <span>?</span>
                                    </div>
                                    <span className={styles.arrow}>→</span>
                                    <div className={styles.exampleCell}>
                                        <span style={{ color: DEFAULT_PIECES[1].color }}>●</span>
                                        <span style={{ color: DEFAULT_PIECES[1].color }}>●</span>
                                        <span>🚫</span>
                                    </div>
                                </div>
                                <p>Red cannot takeover Green if it would create Red-Red-Red (instant win blocked)</p>
                            </div>
                        </Card>
                    </section>

                    {/* Controls */}
                    <section className={styles.section}>
                        <h2>🎮 Controls</h2>
                        <p>
                            The board is a cube you look into and turn. Reading it in three
                            dimensions is the game, so there is no flattened view to fall back
                            on — every cell is reachable by rotating.
                        </p>

                        <div className={styles.controlsGrid}>
                            <div className={styles.control}>
                                <span className={styles.controlIcon}>⟳</span>
                                <div>
                                    <strong>Rotate</strong>
                                    <span>Drag anywhere on the board</span>
                                </div>
                            </div>
                            <div className={styles.control}>
                                <span className={styles.controlIcon}>⌕</span>
                                <div>
                                    <strong>Zoom</strong>
                                    <span>Scroll, or pinch on a touch screen</span>
                                </div>
                            </div>
                            <div className={styles.control}>
                                <span className={styles.controlIcon}>◎</span>
                                <div>
                                    <strong>Place a piece</strong>
                                    <span>Click a cell marker — a drag never places</span>
                                </div>
                            </div>
                            <div className={styles.control}>
                                <span className={styles.controlIcon}>↺</span>
                                <div>
                                    <strong>Undo</strong>
                                    <span>Takes back your last move in a local game</span>
                                </div>
                            </div>
                        </div>

                        <p>
                            Each layer is labelled in the scene, and the cell under your cursor
                            is named below the board, so you always know where in the cube you
                            are aiming.
                        </p>
                    </section>

                    {/* Tips */}
                    <section className={styles.section}>
                        <h2>💡 Strategy Tips</h2>
                        <ul className={styles.tips}>
                            <li><strong>Control the center!</strong> It's part of 13 winning lines.</li>
                            <li>Watch all three dimensions — threats can come from any direction.</li>
                            <li>Save takeovers for crucial defensive or offensive plays.</li>
                            <li>With 3 players, temporary alliances form naturally. Use them wisely!</li>
                            <li>Setting up multiple winning threats forces opponents into tough choices.</li>
                        </ul>
                    </section>

                    <div className={styles.cta}>
                        <Link href="/local" className={styles.ctaButton}>
                            Play now →
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
