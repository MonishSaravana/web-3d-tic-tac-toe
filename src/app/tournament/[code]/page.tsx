// Tournament Lobby & Bracket Page

'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, ThemeToggle, Card } from '@/components/ui';
import { getSessionId } from '@/lib/supabase/lobby';
import styles from './page.module.css';

interface Tournament {
    id: string;
    code: string;
    name: string;
    host_session_id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    player_count: number;
    current_round: number;
    winner_id: string | null;
}

interface Participant {
    id: string;
    tournament_id: string;
    session_id: string;
    nickname: string;
    seed: number | null;
    eliminated: boolean;
    placement: number | null;
}

interface Match {
    id: string;
    tournament_id: string;
    round: number;
    match_order: number;
    player1_id: string | null;
    player2_id: string | null;
    winner_id: string | null;
    lobby_code: string | null;
    status: 'pending' | 'ready' | 'in_progress' | 'completed';
}

export default function TournamentLobbyPage({ params }: { params: Promise<{ code: string }> }) {
    const { code: tournamentCode } = use(params);
    const router = useRouter();

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
    const [nickname, setNickname] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // Initialize
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

    // Load tournament data
    useEffect(() => {
        async function loadTournament() {
            const { getTournamentByCode, getTournamentParticipants, getTournamentMatches } = await import('@/lib/supabase');

            const t = await getTournamentByCode(tournamentCode);
            if (!t) {
                setError('Tournament not found');
                return;
            }

            setTournament(t);
            const p = await getTournamentParticipants(t.id);
            setParticipants(p);

            const sessionId = getSessionId();
            const local = p.find(part => part.session_id === sessionId);
            if (local) {
                setLocalParticipant(local);
                setHasJoined(true);
            }

            if (t.status !== 'waiting') {
                const m = await getTournamentMatches(t.id);
                setMatches(m);
            }
        }

        loadTournament();
    }, [tournamentCode]);

    // Real-time subscription
    useEffect(() => {
        if (!tournament) return;

        let channel: any;

        async function subscribe() {
            const { subscribeTournament } = await import('@/lib/supabase');

            channel = subscribeTournament(
                tournament!.id,
                (t) => setTournament(t),
                (p) => {
                    setParticipants(p);
                    const sessionId = getSessionId();
                    const local = p.find(part => part.session_id === sessionId);
                    setLocalParticipant(local || null);
                },
                (m) => setMatches(m)
            );
        }

        subscribe();

        return () => {
            if (channel) {
                import('@/lib/supabase').then(({ unsubscribe }) => {
                    unsubscribe(channel);
                });
            }
        };
    }, [tournament?.id]);

    // Join tournament
    const handleJoin = useCallback(async () => {
        if (!nickname.trim()) return;

        setIsJoining(true);
        setError(null);

        const { joinTournament } = await import('@/lib/supabase');
        const { participant, error: joinError } = await joinTournament(tournamentCode, nickname.trim());

        if (joinError || !participant) {
            setError(joinError || 'Failed to join');
            setIsJoining(false);
            return;
        }

        localStorage.setItem('ttt-nickname', nickname.trim());
        setLocalParticipant(participant);
        setHasJoined(true);
        setIsJoining(false);
    }, [nickname, tournamentCode]);

    // Start tournament (host only)
    const handleStart = useCallback(async () => {
        if (!tournament) return;

        const { startTournament } = await import('@/lib/supabase');
        const { success, error: startError } = await startTournament(tournament.id);

        if (!success) {
            setError(startError || 'Failed to start');
        }
    }, [tournament]);

    // Leave tournament
    const handleLeave = useCallback(async () => {
        if (localParticipant) {
            const { leaveTournament } = await import('@/lib/supabase');
            await leaveTournament(localParticipant.id);
        }
        router.push('/');
    }, [localParticipant, router]);

    const copyCode = () => {
        navigator.clipboard.writeText(tournamentCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyLink = () => {
        const url = typeof window !== 'undefined'
            ? `${window.location.origin}/tournament/${tournamentCode}`
            : '';
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const isHost = tournament?.host_session_id === getSessionId();

    // Helper to get participant by ID
    const getParticipant = (id: string | null) => participants.find(p => p.id === id);

    // Group matches by round
    const matchesByRound: Record<number, Match[]> = {};
    matches.forEach(m => {
        if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
        matchesByRound[m.round].push(m);
    });
    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

    // Waiting screen
    if (!hasJoined && tournament?.status === 'waiting') {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backLink}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Home
                    </Link>
                    <span className={styles.headerTitle}>Join Tournament</span>
                    <ThemeToggle theme={theme} onToggle={toggleTheme} />
                </header>

                <main className={styles.main}>
                    <Card padding="lg" className={styles.joinCard}>
                        <div className={styles.icon}>🏆</div>
                        <h2>{tournament?.name || 'Tournament'}</h2>
                        <p>Code: <strong>{tournamentCode}</strong></p>

                        <div className={styles.form}>
                            <Input
                                label="Your Nickname"
                                placeholder="Enter nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                maxLength={20}
                                fullWidth
                            />

                            {error && <div className={styles.error}>{error}</div>}

                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={isJoining}
                                disabled={!nickname.trim()}
                                onClick={handleJoin}
                            >
                                Join Tournament
                            </Button>
                        </div>
                    </Card>
                </main>
            </div>
        );
    }

    // Loading
    if (!tournament) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>Loading tournament...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Home
                </Link>
                <span className={styles.headerTitle}>{tournament.name}</span>
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            <main className={styles.main}>
                {tournament.status === 'waiting' ? (
                    /* Waiting room */
                    <div className={styles.waitingRoom}>
                        <Card padding="md" className={styles.codeCard}>
                            <span className={styles.codeLabel}>Tournament Code</span>
                            <div className={styles.codeDisplay}>{tournamentCode}</div>
                            <div className={styles.shareButtons}>
                                <Button variant="secondary" size="sm" onClick={copyCode}>
                                    {copied ? '✓ Copied' : '📋 Copy Code'}
                                </Button>
                                <Button variant="primary" size="sm" onClick={copyLink}>
                                    {linkCopied ? '✓ Copied' : '🔗 Copy Link'}
                                </Button>
                            </div>
                        </Card>

                        <Card padding="lg" className={styles.participantsCard}>
                            <h3>Participants ({participants.length}/{tournament.player_count})</h3>

                            <div className={styles.participantsList}>
                                {Array.from({ length: tournament.player_count }, (_, i) => {
                                    const p = participants[i];
                                    const isMe = p?.id === localParticipant?.id;
                                    const isHostPlayer = p?.session_id === tournament.host_session_id;

                                    return (
                                        <div key={i} className={`${styles.participantSlot} ${p ? styles.filled : ''} ${isMe ? styles.isMe : ''}`}>
                                            <span className={styles.slotNum}>{i + 1}</span>
                                            <span className={styles.participantName}>
                                                {p ? p.nickname : 'Waiting...'}
                                            </span>
                                            {isMe && <span className={styles.youBadge}>You</span>}
                                            {isHostPlayer && <span className={styles.hostBadge}>Host</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <div className={styles.actions}>
                            {isHost && participants.length >= 2 && (
                                <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
                                    Start Tournament 🏆
                                </Button>
                            )}

                            {isHost && participants.length < 2 && (
                                <p className={styles.waitingText}>Need at least 2 participants</p>
                            )}

                            <Button variant="ghost" onClick={handleLeave}>
                                Leave Tournament
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Bracket view */
                    <div className={styles.bracketContainer}>
                        {tournament.status === 'completed' && tournament.winner_id && (
                            <Card padding="lg" className={styles.winnerCard}>
                                <div className={styles.trophy}>🏆</div>
                                <h2>Champion</h2>
                                <p className={styles.winnerName}>
                                    {getParticipant(tournament.winner_id)?.nickname || 'Unknown'}
                                </p>
                            </Card>
                        )}

                        <div className={styles.bracket}>
                            {rounds.map(round => (
                                <div key={round} className={styles.round}>
                                    <h4 className={styles.roundTitle}>
                                        {round === rounds.length ? 'Final' : round === rounds.length - 1 ? 'Semifinals' : `Round ${round}`}
                                    </h4>
                                    <div className={styles.matchList}>
                                        {matchesByRound[round].map((match) => {
                                            const p1 = getParticipant(match.player1_id);
                                            const p2 = getParticipant(match.player2_id);
                                            const isMyMatch = p1?.id === localParticipant?.id || p2?.id === localParticipant?.id;

                                            return (
                                                <div
                                                    key={match.id}
                                                    className={`${styles.matchCard} ${isMyMatch ? styles.myMatch : ''} ${match.status === 'completed' ? styles.completed : ''}`}
                                                >
                                                    <div className={`${styles.player} ${match.winner_id === match.player1_id ? styles.winner : ''}`}>
                                                        {p1?.nickname || 'TBD'}
                                                    </div>
                                                    <div className={styles.vs}>vs</div>
                                                    <div className={`${styles.player} ${match.winner_id === match.player2_id ? styles.winner : ''}`}>
                                                        {p2?.nickname || 'TBD'}
                                                    </div>
                                                    {match.status === 'ready' && isMyMatch && (
                                                        <Button variant="primary" size="sm" className={styles.playBtn}>
                                                            Play Match
                                                        </Button>
                                                    )}
                                                    {match.status === 'in_progress' && (
                                                        <span className={styles.matchStatus}>In Progress</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {localParticipant?.eliminated && (
                            <div className={styles.eliminatedBanner}>
                                You have been eliminated. Better luck next time!
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
