// Create Lobby Page

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, ThemeToggle, Card } from '@/components/ui';
import styles from './page.module.css';

export default function CreateLobbyPage() {
    const router = useRouter();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [nickname, setNickname] = useState('');
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

    const handleNicknameChange = (value: string) => {
        setNickname(value);
        localStorage.setItem('ttt-nickname', value);
    };

    const handleCreateLobby = useCallback(async () => {
        if (!nickname.trim()) {
            setError('Please enter a nickname');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            // Dynamic import to avoid build-time initialization
            const { createLobby, joinLobby, isSupabaseConfigured } = await import('@/lib/supabase');

            if (!isSupabaseConfigured()) {
                setError('Supabase is not configured. Please set up environment variables.');
                setIsCreating(false);
                return;
            }

            // Create lobby
            const { lobby, error: createError } = await createLobby();

            if (createError || !lobby) {
                setError(createError || 'Failed to create lobby');
                setIsCreating(false);
                return;
            }

            // Join the lobby as first player
            const { player, error: joinError } = await joinLobby(lobby.code, nickname.trim());

            if (joinError || !player) {
                setError(joinError || 'Failed to join lobby');
                setIsCreating(false);
                return;
            }

            // Navigate to lobby waiting room
            router.push(`/lobby/${lobby.code}`);
        } catch (err) {
            console.error('Error creating lobby:', err);
            setError('An unexpected error occurred');
            setIsCreating(false);
        }
    }, [nickname, router]);

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

                <h1 className={styles.headerTitle}>Create Lobby</h1>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            {/* Content */}
            <main className={styles.main}>
                <Card padding="lg" className={styles.card}>
                    <div className={styles.icon}>🎮</div>

                    <h2>Create a New Game</h2>
                    <p className={styles.description}>
                        Create a lobby and invite friends to join with the code.
                    </p>

                    <div className={styles.form}>
                        <Input
                            label="Your Nickname"
                            placeholder="Enter your nickname"
                            value={nickname}
                            onChange={(e) => handleNicknameChange(e.target.value)}
                            maxLength={20}
                            fullWidth
                        />

                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={isCreating}
                            disabled={!nickname.trim()}
                            onClick={handleCreateLobby}
                        >
                            Create Lobby
                        </Button>
                    </div>

                    <div className={styles.divider}>
                        <span>or</span>
                    </div>

                    <Link href="/" className={styles.altLink}>
                        Join an existing lobby
                    </Link>
                </Card>
            </main>
        </div>
    );
}
