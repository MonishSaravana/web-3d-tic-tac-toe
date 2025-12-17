// Lobby Waiting Room Page
// Players wait here until all are ready, then game starts

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, ThemeToggle, Card } from '@/components/ui';
import { DEFAULT_PIECES, PlayerNumber } from '@/lib/game/types';
import styles from './page.module.css';

// Types for Supabase data
interface DbLobby {
    id: string;
    code: string;
    status: 'waiting' | 'playing' | 'finished';
    max_players: number;
    created_at: string;
}

interface DbPlayer {
    id: string;
    lobby_id: string;
    session_id: string;
    nickname: string;
    player_number: number | null;
    takeovers_remaining: number;
    is_ready: boolean;
}

export default function LobbyWaitingRoom() {
    const router = useRouter();
    const params = useParams();
    const lobbyCode = (params.code as string)?.toUpperCase();

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [lobby, setLobby] = useState<DbLobby | null>(null);
    const [players, setPlayers] = useState<DbPlayer[]>([]);
    const [localPlayer, setLocalPlayer] = useState<DbPlayer | null>(null);
    const [nickname, setNickname] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const channelRef = useRef<any>(null);

    // Initialize
    useEffect(() => {
        const savedTheme = localStorage.getItem('ttt-theme') as 'dark' | 'light' || 'dark';
        const savedNickname = localStorage.getItem('ttt-nickname') || '';
        setTheme(savedTheme);
        setNickname(savedNickname);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    // Load lobby and check if already joined
    useEffect(() => {
        if (!lobbyCode) return;

        const loadLobby = async () => {
            const { getLobbyByCode, getLobbyPlayers, getSessionId } = await import('@/lib/supabase');

            const lobbyData = await getLobbyByCode(lobbyCode);
            if (!lobbyData) {
                setError('Lobby not found');
                return;
            }
            setLobby(lobbyData);

            // Check if game already started
            if (lobbyData.status === 'playing') {
                router.push(`/game/${lobbyCode}`);
                return;
            }

            const playersData = await getLobbyPlayers(lobbyData.id);
            setPlayers(playersData);

            // Check if current session is already in lobby
            const sessionId = getSessionId();
            const existingPlayer = playersData.find((p: DbPlayer) => p.session_id === sessionId);
            if (existingPlayer) {
                setLocalPlayer(existingPlayer);
                setHasJoined(true);
            }
        };

        loadLobby();
    }, [lobbyCode, router]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!lobby) return;

        const setupSubscription = async () => {
            const { subscribeLobby, getSessionId } = await import('@/lib/supabase');

            const channel = subscribeLobby(
                lobby.id,
                (updatedLobby: DbLobby) => {
                    setLobby(updatedLobby);
                    // Redirect to game if started
                    if (updatedLobby.status === 'playing') {
                        router.push(`/game/${lobbyCode}`);
                    }
                },
                (updatedPlayers: DbPlayer[]) => {
                    setPlayers(updatedPlayers);
                    const sessionId = getSessionId();
                    const me = updatedPlayers.find((p: DbPlayer) => p.session_id === sessionId);
                    if (me) setLocalPlayer(me);
                }
            );

            channelRef.current = channel;
        };

        setupSubscription();

        return () => {
            if (channelRef.current) {
                import('@/lib/supabase').then(({ unsubscribe }) => {
                    unsubscribe(channelRef.current);
                });
            }
        };
    }, [lobby?.id, lobbyCode, router]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('ttt-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleJoin = useCallback(async () => {
        if (!nickname.trim() || !lobbyCode) return;

        setIsJoining(true);
        setError(null);

        const { joinLobby } = await import('@/lib/supabase');
        const { player, error: joinError } = await joinLobby(lobbyCode, nickname.trim());

        if (joinError || !player) {
            setError(joinError || 'Failed to join lobby');
            setIsJoining(false);
            return;
        }

        localStorage.setItem('ttt-nickname', nickname.trim());
        setLocalPlayer(player);
        setHasJoined(true);
        setIsJoining(false);
    }, [nickname, lobbyCode]);

    const handleReady = useCallback(async () => {
        if (!localPlayer) return;
        const { setPlayerReady } = await import('@/lib/supabase');
        await setPlayerReady(localPlayer.id, !localPlayer.is_ready);
    }, [localPlayer]);

    const handleStartGame = useCallback(async () => {
        if (!lobby) return;
        const { startGame } = await import('@/lib/supabase');
        await startGame(lobby.id);
    }, [lobby]);

    const handleLeave = useCallback(async () => {
        if (localPlayer) {
            const { leaveLobby } = await import('@/lib/supabase');
            await leaveLobby(localPlayer.id);
        }
        router.push('/');
    }, [localPlayer, router]);

    const copyCode = () => {
        navigator.clipboard.writeText(lobbyCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const allPlayersReady = players.length >= 2 && players.every(p => p.is_ready);
    const isHost = localPlayer?.player_number === 1;

    const getPieceIcon = (playerNum: number) => {
        const config = DEFAULT_PIECES[playerNum as PlayerNumber];
        switch (config?.type) {
            case 'sphere': return '●';
            case 'cube': return '■';
            case 'octahedron': return '◆';
            default: return '○';
        }
    };

    const getPieceColor = (playerNum: number) => {
        return DEFAULT_PIECES[playerNum as PlayerNumber]?.color || '#888';
    };

    if (error && !hasJoined) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backLink}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>
                    <h1 className={styles.headerTitle}>Lobby</h1>
                    <ThemeToggle theme={theme} onToggle={toggleTheme} />
                </header>
                <main className={styles.main}>
                    <Card padding="lg" className={styles.errorCard}>
                        <div className={styles.errorIcon}>❌</div>
                        <h2>Error</h2>
                        <p>{error}</p>
                        <Link href="/">
                            <Button variant="primary">Go Home</Button>
                        </Link>
                    </Card>
                </main>
            </div>
        );
    }

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

                <h1 className={styles.headerTitle}>Lobby</h1>

                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </header>

            <main className={styles.main}>
                {/* Join form if not joined */}
                {!hasJoined ? (
                    <Card padding="lg" className={styles.joinCard}>
                        <h2>Join Lobby</h2>
                        <p className={styles.lobbyCodeDisplay}>
                            Code: <strong>{lobbyCode}</strong>
                        </p>

                        <div className={styles.form}>
                            <Input
                                label="Your Nickname"
                                placeholder="Enter your nickname"
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
                                Join Game
                            </Button>
                        </div>
                    </Card>
                ) : (
                    /* Waiting room */
                    <div className={styles.waitingRoom}>
                        {/* Lobby code */}
                        <Card padding="md" className={styles.codeCard}>
                            <span className={styles.codeLabel}>Lobby Code</span>
                            <div className={styles.codeRow}>
                                <span className={styles.code}>{lobbyCode}</span>
                                <Button variant="ghost" size="sm" onClick={copyCode}>
                                    {copied ? '✓ Copied' : 'Copy'}
                                </Button>
                            </div>
                            <span className={styles.codeHint}>Share this code with friends</span>
                        </Card>

                        {/* Players list */}
                        <Card padding="lg" className={styles.playersCard}>
                            <h3>Players ({players.length}/3)</h3>

                            <div className={styles.playersList}>
                                {[1, 2, 3].map((num) => {
                                    const player = players.find(p => p.player_number === num);
                                    const isMe = player?.id === localPlayer?.id;

                                    return (
                                        <div
                                            key={num}
                                            className={`${styles.playerSlot} ${player ? styles.filled : ''} ${isMe ? styles.isMe : ''}`}
                                        >
                                            <span
                                                className={styles.playerIcon}
                                                style={{ color: getPieceColor(num) }}
                                            >
                                                {getPieceIcon(num)}
                                            </span>

                                            <div className={styles.playerInfo}>
                                                <span className={styles.playerName}>
                                                    {player ? player.nickname : 'Waiting...'}
                                                    {isMe && <span className={styles.youBadge}>You</span>}
                                                </span>
                                                <span className={styles.playerStatus}>
                                                    Player {num} • {num === 1 ? '2' : '3'} takeovers
                                                </span>
                                            </div>

                                            {player && (
                                                <span className={`${styles.readyBadge} ${player.is_ready ? styles.ready : ''}`}>
                                                    {player.is_ready ? '✓ Ready' : 'Not Ready'}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Actions */}
                        <div className={styles.actions}>
                            <Button
                                variant={localPlayer?.is_ready ? 'secondary' : 'primary'}
                                size="lg"
                                fullWidth
                                onClick={handleReady}
                            >
                                {localPlayer?.is_ready ? 'Cancel Ready' : "I'm Ready!"}
                            </Button>

                            {isHost && allPlayersReady && (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    onClick={handleStartGame}
                                >
                                    Start Game 🎮
                                </Button>
                            )}

                            {isHost && !allPlayersReady && players.length >= 2 && (
                                <p className={styles.waitingText}>
                                    Waiting for all players to be ready...
                                </p>
                            )}

                            {players.length < 2 && (
                                <p className={styles.waitingText}>
                                    Need at least 2 players to start
                                </p>
                            )}

                            <Button variant="ghost" onClick={handleLeave}>
                                Leave Lobby
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
