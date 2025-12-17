// Supabase Lobby Service
// Handles lobby creation, joining, and real-time subscriptions

import { supabase } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types matching database schema
export interface DbLobby {
    id: string;
    code: string;
    status: 'waiting' | 'playing' | 'finished';
    max_players: number;
    created_at: string;
}

export interface DbPlayer {
    id: string;
    lobby_id: string;
    session_id: string;
    nickname: string;
    player_number: number | null;
    takeovers_remaining: number;
    is_ready: boolean;
}

export interface DbGame {
    id: string;
    lobby_id: string;
    board: (number | null)[];
    current_turn: number;
    winner: number | null;
}

// Generate a random 6-character lobby code
function generateLobbyCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, I, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Get or create session ID
export function getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = localStorage.getItem('ttt-session-id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('ttt-session-id', sessionId);
    }
    return sessionId;
}

// Create a new lobby
export async function createLobby(): Promise<{ lobby: DbLobby | null; error: string | null }> {
    // Generate unique code (retry if collision)
    let code = generateLobbyCode();
    let attempts = 0;

    while (attempts < 5) {
        const { data, error } = await supabase
            .from('lobbies')
            .insert({ code, status: 'waiting', max_players: 3 })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                // Unique constraint violation, try new code
                code = generateLobbyCode();
                attempts++;
                continue;
            }
            return { lobby: null, error: error.message };
        }

        return { lobby: data, error: null };
    }

    return { lobby: null, error: 'Failed to generate unique lobby code' };
}

// Join a lobby by code
export async function joinLobby(
    code: string,
    nickname: string
): Promise<{ player: DbPlayer | null; lobby: DbLobby | null; error: string | null }> {
    const sessionId = getSessionId();

    // Find lobby by code
    const { data: lobby, error: lobbyError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

    if (lobbyError || !lobby) {
        return { player: null, lobby: null, error: 'Lobby not found' };
    }

    if (lobby.status !== 'waiting') {
        return { player: null, lobby: null, error: 'Lobby is no longer accepting players' };
    }

    // Check if already in lobby
    const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('lobby_id', lobby.id)
        .eq('session_id', sessionId)
        .single();

    if (existingPlayer) {
        // Update nickname if different
        if (existingPlayer.nickname !== nickname) {
            await supabase
                .from('players')
                .update({ nickname })
                .eq('id', existingPlayer.id);
        }
        return { player: { ...existingPlayer, nickname }, lobby, error: null };
    }

    // Count current players
    const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('lobby_id', lobby.id);

    if ((count ?? 0) >= lobby.max_players) {
        return { player: null, lobby: null, error: 'Lobby is full' };
    }

    // Assign player number (1, 2, or 3)
    const playerNumber = (count ?? 0) + 1;
    const takeovers = playerNumber === 1 ? 2 : 3; // Player 1 gets 2, others get 3

    // Insert player
    const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
            lobby_id: lobby.id,
            session_id: sessionId,
            nickname,
            player_number: playerNumber,
            takeovers_remaining: takeovers,
            is_ready: false,
        })
        .select()
        .single();

    if (playerError) {
        return { player: null, lobby: null, error: playerError.message };
    }

    return { player, lobby, error: null };
}

// Get lobby by ID
export async function getLobby(lobbyId: string): Promise<DbLobby | null> {
    const { data } = await supabase
        .from('lobbies')
        .select('*')
        .eq('id', lobbyId)
        .single();
    return data;
}

// Get lobby by code
export async function getLobbyByCode(code: string): Promise<DbLobby | null> {
    const { data } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
    return data;
}

// Get players in a lobby
export async function getLobbyPlayers(lobbyId: string): Promise<DbPlayer[]> {
    const { data } = await supabase
        .from('players')
        .select('*')
        .eq('lobby_id', lobbyId)
        .order('player_number');
    return data ?? [];
}

// Get game for a lobby
export async function getGameByLobby(lobbyId: string): Promise<DbGame | null> {
    const { data } = await supabase
        .from('games')
        .select('*')
        .eq('lobby_id', lobbyId)
        .single();
    return data;
}

// Set player ready status
export async function setPlayerReady(playerId: string, isReady: boolean): Promise<void> {
    await supabase
        .from('players')
        .update({ is_ready: isReady })
        .eq('id', playerId);
}

// Start the game (called when all players are ready)
export async function startGame(lobbyId: string): Promise<DbGame | null> {
    // Update lobby status
    await supabase
        .from('lobbies')
        .update({ status: 'playing' })
        .eq('id', lobbyId);

    // Create initial game state (empty 27-cell board)
    const emptyBoard = Array(27).fill(null);

    const { data: game, error } = await supabase
        .from('games')
        .insert({
            lobby_id: lobbyId,
            board: emptyBoard,
            current_turn: 1,
            winner: null,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to start game:', error);
        return null;
    }

    return game;
}

// Make a move in the game
export async function makeMove(
    gameId: string,
    board: (number | null)[],
    nextTurn: number,
    winner: number | null
): Promise<void> {
    await supabase
        .from('games')
        .update({
            board,
            current_turn: nextTurn,
            winner,
        })
        .eq('id', gameId);
}

// Update player takeovers
export async function updatePlayerTakeovers(playerId: string, remaining: number): Promise<void> {
    await supabase
        .from('players')
        .update({ takeovers_remaining: remaining })
        .eq('id', playerId);
}

// Subscribe to lobby changes
export function subscribeLobby(
    lobbyId: string,
    onLobbyUpdate: (lobby: DbLobby) => void,
    onPlayersUpdate: (players: DbPlayer[]) => void
): RealtimeChannel {
    const channel = supabase
        .channel(`lobby:${lobbyId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` },
            (payload) => {
                if (payload.new) {
                    onLobbyUpdate(payload.new as DbLobby);
                }
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'players', filter: `lobby_id=eq.${lobbyId}` },
            async () => {
                // Refetch all players on any change
                const players = await getLobbyPlayers(lobbyId);
                onPlayersUpdate(players);
            }
        )
        .subscribe();

    return channel;
}

// Subscribe to game changes
export function subscribeGame(
    gameId: string,
    lobbyId: string,
    onGameUpdate: (game: DbGame) => void,
    onPlayersUpdate: (players: DbPlayer[]) => void
): RealtimeChannel {
    const channel = supabase
        .channel(`game:${gameId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
            (payload) => {
                if (payload.new) {
                    onGameUpdate(payload.new as DbGame);
                }
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'players', filter: `lobby_id=eq.${lobbyId}` },
            async () => {
                const players = await getLobbyPlayers(lobbyId);
                onPlayersUpdate(players);
            }
        )
        .subscribe();

    return channel;
}

// Unsubscribe from a channel
export function unsubscribe(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
}

// Leave a lobby (remove player)
export async function leaveLobby(playerId: string): Promise<void> {
    await supabase
        .from('players')
        .delete()
        .eq('id', playerId);
}

// Kick a player from the lobby (admin only - player 1)
export async function kickPlayer(
    kickerId: string,
    targetPlayerId: string,
    lobbyId: string
): Promise<{ success: boolean; error?: string }> {
    // First verify the kicker is player 1 (admin)
    const { data: kicker } = await supabase
        .from('players')
        .select('player_number')
        .eq('id', kickerId)
        .single();

    if (!kicker || kicker.player_number !== 1) {
        return { success: false, error: 'Only the lobby creator can kick players' };
    }

    // Verify target is in the same lobby and not the admin
    const { data: target } = await supabase
        .from('players')
        .select('player_number, lobby_id')
        .eq('id', targetPlayerId)
        .single();

    if (!target || target.lobby_id !== lobbyId) {
        return { success: false, error: 'Player not found in lobby' };
    }

    if (target.player_number === 1) {
        return { success: false, error: 'Cannot kick the lobby creator' };
    }

    // Remove the player
    await supabase
        .from('players')
        .delete()
        .eq('id', targetPlayerId);

    return { success: true };
}

// Close a lobby (admin only)
export async function closeLobby(lobbyId: string): Promise<void> {
    // Delete all players first
    await supabase
        .from('players')
        .delete()
        .eq('lobby_id', lobbyId);

    // Update lobby status
    await supabase
        .from('lobbies')
        .update({ status: 'finished' })
        .eq('id', lobbyId);
}
