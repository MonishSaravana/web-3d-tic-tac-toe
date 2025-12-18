// Create Lobby Page with Settings

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

    // Lobby settings
    const [isPublic, setIsPublic] = useState(false);
    const [maxPlayers, setMaxPlayers] = useState<2 | 3>(3);
    const [defaultTakeovers, setDefaultTakeovers] = useState(3);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Timer settings
    const [timerMode, setTimerMode] = useState<'unlimited' | 'per_move' | 'time_bank'>('unlimited');
    const [timePerMove, setTimePerMove] = useState(30);
    const [timeBank, setTimeBank] = useState(120);

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
            const { createLobbyWithSettings, joinLobby, isSupabaseConfigured } = await import('@/lib/supabase');

            if (!isSupabaseConfigured()) {
                setError('Supabase is not configured. Please set up environment variables.');
                setIsCreating(false);
                return;
            }

            // Create lobby with settings
            const { lobby, error: createError } = await createLobbyWithSettings({
                isPublic,
                maxPlayers,
                defaultTakeovers,
                timeMode: timerMode,
                timePerMove,
                timeBank,
            });

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

            router.push(`/lobby/${lobby.code}`);
        } catch (err) {
            console.error('Error creating lobby:', err);
            setError('An unexpected error occurred');
            setIsCreating(false);
        }
    }, [nickname, isPublic, maxPlayers, defaultTakeovers, timerMode, timePerMove, timeBank, router]);

    // Quick Play - find or create public lobby
    const handleQuickPlay = useCallback(async () => {
        if (!nickname.trim()) {
            setError('Please enter a nickname');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const { findPublicLobby, createLobbyWithSettings, joinLobby, isSupabaseConfigured } = await import('@/lib/supabase');

            if (!isSupabaseConfigured()) {
                setError('Supabase is not configured.');
                setIsCreating(false);
                return;
            }

            // Try to find existing public lobby
            let lobby = await findPublicLobby();

            if (!lobby) {
                // Create a new public lobby
                const { lobby: newLobby, error: createError } = await createLobbyWithSettings({
                    isPublic: true,
                    maxPlayers: 2,
                    defaultTakeovers: 5,
                });

                if (createError || !newLobby) {
                    setError(createError || 'Failed to create lobby');
                    setIsCreating(false);
                    return;
                }
                lobby = newLobby;
            }

            // Join the lobby
            const { player, error: joinError } = await joinLobby(lobby.code, nickname.trim());

            if (joinError || !player) {
                setError(joinError || 'Failed to join lobby');
                setIsCreating(false);
                return;
            }

            router.push(`/lobby/${lobby.code}`);
        } catch (err) {
            console.error('Error with quick play:', err);
            setError('An unexpected error occurred');
            setIsCreating(false);
        }
    }, [nickname, router]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>

                <h1 className={styles.headerTitle}>Create Game</h1>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            <main className={styles.main}>
                <Card padding="lg" className={styles.card}>
                    <div className={styles.icon}>🎮</div>

                    <h2>Create a New Game</h2>
                    <p className={styles.description}>
                        Set up your game and invite friends to play.
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

                        {/* Quick settings */}
                        <div className={styles.settingRow}>
                            <label>Players</label>
                            <div className={styles.optionButtons}>
                                <button
                                    className={`${styles.optionBtn} ${maxPlayers === 2 ? styles.active : ''}`}
                                    onClick={() => setMaxPlayers(2)}
                                >
                                    2
                                </button>
                                <button
                                    className={`${styles.optionBtn} ${maxPlayers === 3 ? styles.active : ''}`}
                                    onClick={() => setMaxPlayers(3)}
                                >
                                    3
                                </button>
                            </div>
                        </div>

                        <div className={styles.settingRow}>
                            <label>Visibility</label>
                            <div className={styles.optionButtons}>
                                <button
                                    className={`${styles.optionBtn} ${!isPublic ? styles.active : ''}`}
                                    onClick={() => setIsPublic(false)}
                                >
                                    🔒 Private
                                </button>
                                <button
                                    className={`${styles.optionBtn} ${isPublic ? styles.active : ''}`}
                                    onClick={() => setIsPublic(true)}
                                >
                                    🌐 Public
                                </button>
                            </div>
                        </div>

                        {/* Advanced settings toggle */}
                        <button
                            className={styles.advancedToggle}
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {showAdvanced ? '▲' : '▼'} Advanced Settings
                        </button>

                        {showAdvanced && (
                            <div className={styles.advancedSettings}>
                                <div className={styles.settingRow}>
                                    <label>Takeovers per Player</label>
                                    <div className={styles.optionButtons}>
                                        {[3, 5, 7, 10].map(n => (
                                            <button
                                                key={n}
                                                className={`${styles.optionBtn} ${defaultTakeovers === n ? styles.active : ''}`}
                                                onClick={() => setDefaultTakeovers(n)}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.settingRow}>
                                    <label>Move Timer</label>
                                    <div className={styles.optionButtons}>
                                        <button
                                            className={`${styles.optionBtn} ${timerMode === 'unlimited' ? styles.active : ''}`}
                                            onClick={() => setTimerMode('unlimited')}
                                        >
                                            ∞ None
                                        </button>
                                        <button
                                            className={`${styles.optionBtn} ${timerMode === 'per_move' ? styles.active : ''}`}
                                            onClick={() => setTimerMode('per_move')}
                                        >
                                            ⏱ Per Move
                                        </button>
                                        <button
                                            className={`${styles.optionBtn} ${timerMode === 'time_bank' ? styles.active : ''}`}
                                            onClick={() => setTimerMode('time_bank')}
                                        >
                                            🏦 Time Bank
                                        </button>
                                    </div>
                                </div>

                                {timerMode === 'per_move' && (
                                    <div className={styles.settingRow}>
                                        <label>Seconds Per Move</label>
                                        <div className={styles.optionButtons}>
                                            {[15, 30, 60].map(n => (
                                                <button
                                                    key={n}
                                                    className={`${styles.optionBtn} ${timePerMove === n ? styles.active : ''}`}
                                                    onClick={() => setTimePerMove(n)}
                                                >
                                                    {n}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {timerMode === 'time_bank' && (
                                    <div className={styles.settingRow}>
                                        <label>Time Bank (Total)</label>
                                        <div className={styles.optionButtons}>
                                            {[60, 120, 300].map(n => (
                                                <button
                                                    key={n}
                                                    className={`${styles.optionBtn} ${timeBank === n ? styles.active : ''}`}
                                                    onClick={() => setTimeBank(n)}
                                                >
                                                    {n >= 60 ? `${n / 60}m` : `${n}s`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && <div className={styles.error}>{error}</div>}

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

                    <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        disabled={!nickname.trim() || isCreating}
                        onClick={handleQuickPlay}
                    >
                        ⚡ Quick Play
                    </Button>
                    <p className={styles.quickPlayHint}>
                        Instantly join or create a public game
                    </p>
                </Card>
            </main>
        </div>
    );
}
