'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button, Input, ThemeToggle, Modal } from '@/components/ui';
import { PieceGlyph } from '@/components/game';
import { FAQ } from '@/lib/faq';
import styles from './page.module.css';

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


export default function HomeClient() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [lobbyCode, setLobbyCode] = useState('');

    useEffect(() => {
        const savedTheme = (localStorage.getItem('ttt-theme') as 'dark' | 'light') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('ttt-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.logo}>
                    3D T<sup>3</sup>
                </Link>

                <nav className={styles.nav}>
                    <Link href="/rules" className={styles.navLink}>
                        Rules
                    </Link>
                    <Link href="/local" className={styles.navLink}>
                        Play
                    </Link>
                    <ThemeToggle theme={theme} onToggle={toggleTheme} />
                </nav>
            </header>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.title}>3D Tic Tac Toe</h1>
                        <p className={styles.tagline}>
                            Tic-tac-toe on a 3×3×3 cube. 27 cells, 49 ways to win, and
                            takeovers that let you steal a square.
                        </p>

                        <div className={styles.playButtons}>
                            <Link href="/local" className={styles.playLink}>
                                <Button variant="primary" size="lg" fullWidth>
                                    Play now
                                </Button>
                            </Link>

                            <div className={styles.onlineButtons}>
                                <Link href="/lobby/create" className={styles.playLink}>
                                    <Button variant="secondary" size="lg" fullWidth>
                                        Play a friend online
                                    </Button>
                                </Link>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    fullWidth
                                    onClick={() => setShowJoinModal(true)}
                                >
                                    Join with a code
                                </Button>
                            </div>

                            <Link href="/tournament/create" className={styles.tournamentLink}>
                                or run a tournament →
                            </Link>
                        </div>

                        <p className={styles.freeNote}>
                            Free · no sign-up · plays in the browser on phone or desktop
                        </p>
                    </div>

                    <div className={styles.heroBoard}>
                        <DemoBoard autoRotate />
                    </div>
                </section>

                <section className={styles.steps} aria-labelledby="how-to-play">
                    <h2 id="how-to-play">How to play</h2>

                    <ol className={styles.stepList}>
                        <li>
                            <span className={styles.stepNumber}>1</span>
                            <h3>Pick a cell</h3>
                            <p>
                                The board is three 3×3 layers stacked into a cube. Tap any empty
                                cell in the flat Layers view, or rotate the 3D cube and tap twice.
                            </p>
                        </li>
                        <li>
                            <span className={styles.stepNumber}>2</span>
                            <h3>Build a line of three</h3>
                            <p>
                                Lines run across, up through the layers, diagonally, or corner to
                                corner through the middle. The centre cell sits on 13 of them.
                            </p>
                        </li>
                        <li>
                            <span className={styles.stepNumber}>3</span>
                            <h3>Steal a square</h3>
                            <p>
                                Spend a takeover to replace an opponent’s piece with your own —
                                just not as the move that wins the game.
                            </p>
                        </li>
                    </ol>
                </section>

                <section className={styles.features} aria-labelledby="whats-different">
                    <h2 id="whats-different">What makes it different</h2>

                    <div className={styles.featureGrid}>
                        <article className={styles.feature}>
                            <h3>49 winning lines</h3>
                            <p>
                                18 rows, 9 pillars, 18 plane diagonals and 4 corner-to-corner
                                space diagonals. Threats arrive from directions a flat board
                                never had.
                            </p>
                        </article>

                        <article className={styles.feature}>
                            <h3>Takeovers</h3>
                            <p>
                                A limited number of times per game you can replace an opponent’s
                                piece. It cannot be the winning move, so it is a tool for
                                breaking up threats, not a shortcut.
                            </p>
                        </article>

                        <article className={styles.feature}>
                            <h3>Two or three players</h3>
                            <p>
                                Play the computer, pass one device around, or share a room code.
                                With three players every block helps someone else.
                            </p>
                        </article>
                    </div>

                    <div className={styles.pieceLegend}>
                        {([1, 2, 3] as const).map(player => (
                            <span key={player} className={styles.legendItem}>
                                <PieceGlyph player={player} size={20} />
                                Player {player}
                            </span>
                        ))}
                    </div>
                </section>

                <section className={styles.faq} aria-labelledby="faq-heading">
                    <h2 id="faq-heading">Questions</h2>

                    <div className={styles.faqList}>
                        {FAQ.map(item => (
                            <details key={item.q} className={styles.faqItem}>
                                <summary>{item.q}</summary>
                                <p>{item.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className={styles.finalCta}>
                    <h2>Ready to play?</h2>
                    <Link href="/local">
                        <Button variant="primary" size="lg">
                            Start a game
                        </Button>
                    </Link>
                    <Link href="/rules" className={styles.fullRulesLink}>
                        Read the full rules and all 49 lines →
                    </Link>
                </section>
            </main>

            <footer className={styles.footer}>
                <p>3D T³ — tic-tac-toe with a third dimension</p>
                <p className={styles.credit}>
                    Built by{' '}
                    <a href="https://monishsaravana.com" target="_blank" rel="noopener noreferrer">
                        Monish Saravana
                    </a>
                </p>
            </footer>

            <Modal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                title="Join a game"
            >
                <div className={styles.modalContent}>
                    <p>Enter the six-character room code your friend sent you.</p>

                    <Input
                        label="Room code"
                        placeholder="ABC123"
                        value={lobbyCode}
                        onChange={e => setLobbyCode(e.target.value.toUpperCase().slice(0, 6))}
                        maxLength={6}
                        fullWidth
                        autoFocus
                    />

                    <Link
                        href={lobbyCode.length === 6 ? `/lobby/${lobbyCode}` : '#'}
                        onClick={e => lobbyCode.length !== 6 && e.preventDefault()}
                    >
                        <Button variant="primary" fullWidth disabled={lobbyCode.length !== 6}>
                            Join
                        </Button>
                    </Link>
                </div>
            </Modal>
        </div>
    );
}
