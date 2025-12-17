// Create Tournament Page

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, ThemeToggle, Card } from '@/components/ui';
import styles from './page.module.css';

export default function CreateTournamentPage() {
    const router = useRouter();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [nickname, setNickname] = useState('');
    const [tournamentName, setTournamentName] = useState('');
    const [playerCount, setPlayerCount] = useState<4 | 8>(4);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleCreate = useCallback(async () => {
        if (!nickname.trim()) {
            setError('Please enter a nickname');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const { createTournament, joinTournament } = await import('@/lib/supabase');

            // Create tournament
            const { tournament, error: createError } = await createTournament(
                tournamentName.trim() || 'Tournament',
                playerCount
            );

            if (createError || !tournament) {
                setError(createError || 'Failed to create tournament');
                setIsCreating(false);
                return;
            }

            // Join as first participant
            localStorage.setItem('ttt-nickname', nickname.trim());
            await joinTournament(tournament.code, nickname.trim());

            // Redirect to tournament lobby
            router.push(`/tournament/${tournament.code}`);
        } catch (err) {
            setError('Failed to create tournament');
            setIsCreating(false);
        }
    }, [nickname, tournamentName, playerCount, router]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Home
                </Link>

                <span className={styles.headerTitle}>Create Tournament</span>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            <main className={styles.main}>
                <Card padding="lg" className={styles.createCard}>
                    <div className={styles.icon}>🏆</div>
                    <h2>New Tournament</h2>
                    <p>Create a bracket-style tournament and invite friends to compete!</p>

                    <div className={styles.form}>
                        <Input
                            label="Your Nickname"
                            placeholder="Enter nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={20}
                            fullWidth
                        />

                        <Input
                            label="Tournament Name (optional)"
                            placeholder="e.g., Friday Night Showdown"
                            value={tournamentName}
                            onChange={(e) => setTournamentName(e.target.value)}
                            maxLength={50}
                            fullWidth
                        />

                        <div className={styles.playerCountSection}>
                            <label>Number of Players</label>
                            <div className={styles.playerCountOptions}>
                                <button
                                    className={`${styles.countOption} ${playerCount === 4 ? styles.active : ''}`}
                                    onClick={() => setPlayerCount(4)}
                                >
                                    <span className={styles.countNum}>4</span>
                                    <span className={styles.countLabel}>2 rounds</span>
                                </button>
                                <button
                                    className={`${styles.countOption} ${playerCount === 8 ? styles.active : ''}`}
                                    onClick={() => setPlayerCount(8)}
                                >
                                    <span className={styles.countNum}>8</span>
                                    <span className={styles.countLabel}>3 rounds</span>
                                </button>
                            </div>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={isCreating}
                            disabled={!nickname.trim()}
                            onClick={handleCreate}
                        >
                            Create Tournament 🏆
                        </Button>
                    </div>
                </Card>
            </main>
        </div>
    );
}
