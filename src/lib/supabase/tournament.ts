// Tournament Service for 3D T³
// Handles tournament creation, bracket generation, and match progression

import { supabase } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSessionId } from './lobby';

// Types
export interface DbTournament {
    id: string;
    code: string;
    name: string;
    host_session_id: string;
    status: 'waiting' | 'in_progress' | 'completed';
    player_count: number;
    current_round: number;
    winner_id: string | null;
    created_at: string;
}

export interface DbTournamentParticipant {
    id: string;
    tournament_id: string;
    session_id: string;
    nickname: string;
    seed: number | null;
    eliminated: boolean;
    placement: number | null;
    created_at: string;
}

export interface DbTournamentMatch {
    id: string;
    tournament_id: string;
    round: number;
    match_order: number;
    player1_id: string | null;
    player2_id: string | null;
    winner_id: string | null;
    lobby_code: string | null;
    status: 'pending' | 'ready' | 'in_progress' | 'completed';
    created_at: string;
}

// Generate 6-character tournament code
function generateTournamentCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'T'; // Prefix with T for tournament
    for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Create a new tournament
export async function createTournament(
    name: string = 'Tournament',
    playerCount: 4 | 8 = 4
): Promise<{ tournament: DbTournament | null; error: string | null }> {
    const sessionId = getSessionId();
    let code = generateTournamentCode();
    let attempts = 0;

    while (attempts < 5) {
        const { data, error } = await supabase
            .from('tournaments')
            .insert({
                code,
                name,
                host_session_id: sessionId,
                player_count: playerCount,
                status: 'waiting',
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                code = generateTournamentCode();
                attempts++;
                continue;
            }
            return { tournament: null, error: error.message };
        }

        return { tournament: data, error: null };
    }

    return { tournament: null, error: 'Failed to generate unique code' };
}

// Join a tournament
export async function joinTournament(
    code: string,
    nickname: string
): Promise<{ participant: DbTournamentParticipant | null; tournament: DbTournament | null; error: string | null }> {
    const sessionId = getSessionId();

    // Find tournament
    const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

    if (tournamentError || !tournament) {
        return { participant: null, tournament: null, error: 'Tournament not found' };
    }

    if (tournament.status !== 'waiting') {
        return { participant: null, tournament: null, error: 'Tournament already started' };
    }

    // Check if already joined
    const { data: existing } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('session_id', sessionId)
        .single();

    if (existing) {
        return { participant: existing, tournament, error: null };
    }

    // Count participants
    const { count } = await supabase
        .from('tournament_participants')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournament.id);

    if ((count ?? 0) >= tournament.player_count) {
        return { participant: null, tournament: null, error: 'Tournament is full' };
    }

    // Add participant
    const { data: participant, error: participantError } = await supabase
        .from('tournament_participants')
        .insert({
            tournament_id: tournament.id,
            session_id: sessionId,
            nickname,
        })
        .select()
        .single();

    if (participantError) {
        return { participant: null, tournament: null, error: participantError.message };
    }

    return { participant, tournament, error: null };
}

// Get tournament by code
export async function getTournamentByCode(code: string): Promise<DbTournament | null> {
    const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
    return data;
}

// Get tournament participants
export async function getTournamentParticipants(tournamentId: string): Promise<DbTournamentParticipant[]> {
    const { data } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed', { nullsFirst: false });
    return data ?? [];
}

// Get tournament matches
export async function getTournamentMatches(tournamentId: string): Promise<DbTournamentMatch[]> {
    const { data } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round')
        .order('match_order');
    return data ?? [];
}

// Generate bracket and start tournament
export async function startTournament(tournamentId: string): Promise<{ success: boolean; error?: string }> {
    // Get participants
    const participants = await getTournamentParticipants(tournamentId);

    const { data: tournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

    if (!tournament) {
        return { success: false, error: 'Tournament not found' };
    }

    if (participants.length < 2) {
        return { success: false, error: 'Need at least 2 participants' };
    }

    // Shuffle and assign seeds
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i++) {
        await supabase
            .from('tournament_participants')
            .update({ seed: i + 1 })
            .eq('id', shuffled[i].id);
    }

    // Calculate rounds needed
    const numPlayers = shuffled.length;
    const numRounds = Math.ceil(Math.log2(numPlayers));

    // Generate first round matches
    const firstRoundMatches = Math.floor(numPlayers / 2);
    for (let i = 0; i < firstRoundMatches; i++) {
        const player1 = shuffled[i * 2];
        const player2 = shuffled[i * 2 + 1];

        await supabase.from('tournament_matches').insert({
            tournament_id: tournamentId,
            round: 1,
            match_order: i + 1,
            player1_id: player1.id,
            player2_id: player2?.id || null,
            status: player2 ? 'ready' : 'pending',
        });
    }

    // Generate empty slots for future rounds
    let matchesInRound = Math.floor(firstRoundMatches / 2);
    for (let round = 2; round <= numRounds; round++) {
        for (let i = 0; i < matchesInRound; i++) {
            await supabase.from('tournament_matches').insert({
                tournament_id: tournamentId,
                round,
                match_order: i + 1,
                status: 'pending',
            });
        }
        matchesInRound = Math.floor(matchesInRound / 2) || 1;
    }

    // Update tournament status
    await supabase
        .from('tournaments')
        .update({ status: 'in_progress' })
        .eq('id', tournamentId);

    return { success: true };
}

// Start a match (create game lobby)
export async function startMatch(matchId: string): Promise<{ lobbyCode: string | null; error?: string }> {
    // Generate lobby code for this match
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let lobbyCode = 'M'; // M prefix for match
    for (let i = 0; i < 5; i++) {
        lobbyCode += chars[Math.floor(Math.random() * chars.length)];
    }

    const { error } = await supabase
        .from('tournament_matches')
        .update({
            lobby_code: lobbyCode,
            status: 'in_progress'
        })
        .eq('id', matchId);

    if (error) {
        return { lobbyCode: null, error: error.message };
    }

    return { lobbyCode };
}

// Record match result and advance winner
export async function completeMatch(
    matchId: string,
    winnerId: string
): Promise<{ success: boolean; error?: string }> {
    // Get match details
    const { data: match } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (!match) {
        return { success: false, error: 'Match not found' };
    }

    // Update match with winner
    await supabase
        .from('tournament_matches')
        .update({ winner_id: winnerId, status: 'completed' })
        .eq('id', matchId);

    // Mark loser as eliminated
    const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id;
    if (loserId) {
        await supabase
            .from('tournament_participants')
            .update({ eliminated: true })
            .eq('id', loserId);
    }

    // Find next round match and add winner
    const nextRound = match.round + 1;
    const nextMatchOrder = Math.ceil(match.match_order / 2);

    const { data: nextMatch } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', match.tournament_id)
        .eq('round', nextRound)
        .eq('match_order', nextMatchOrder)
        .single();

    if (nextMatch) {
        // Determine which slot (player1 or player2)
        const isFirstSlot = match.match_order % 2 === 1;
        const updateField = isFirstSlot ? 'player1_id' : 'player2_id';

        await supabase
            .from('tournament_matches')
            .update({ [updateField]: winnerId })
            .eq('id', nextMatch.id);

        // Check if both players are now set
        const { data: updatedMatch } = await supabase
            .from('tournament_matches')
            .select('*')
            .eq('id', nextMatch.id)
            .single();

        if (updatedMatch?.player1_id && updatedMatch?.player2_id) {
            await supabase
                .from('tournament_matches')
                .update({ status: 'ready' })
                .eq('id', nextMatch.id);
        }
    } else {
        // This was the final match - tournament complete!
        await supabase
            .from('tournaments')
            .update({
                status: 'completed',
                winner_id: winnerId
            })
            .eq('id', match.tournament_id);

        // Set winner placement
        await supabase
            .from('tournament_participants')
            .update({ placement: 1 })
            .eq('id', winnerId);
    }

    return { success: true };
}

// Subscribe to tournament updates
export function subscribeTournament(
    tournamentId: string,
    onTournamentUpdate: (tournament: DbTournament) => void,
    onParticipantsUpdate: (participants: DbTournamentParticipant[]) => void,
    onMatchesUpdate: (matches: DbTournamentMatch[]) => void
): RealtimeChannel {
    const channel = supabase
        .channel(`tournament:${tournamentId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` },
            (payload) => {
                if (payload.new) {
                    onTournamentUpdate(payload.new as DbTournament);
                }
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${tournamentId}` },
            async () => {
                const participants = await getTournamentParticipants(tournamentId);
                onParticipantsUpdate(participants);
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tournament_matches', filter: `tournament_id=eq.${tournamentId}` },
            async () => {
                const matches = await getTournamentMatches(tournamentId);
                onMatchesUpdate(matches);
            }
        )
        .subscribe();

    return channel;
}

// Leave tournament
export async function leaveTournament(participantId: string): Promise<void> {
    await supabase
        .from('tournament_participants')
        .delete()
        .eq('id', participantId);
}

// Kick participant (host only)
export async function kickParticipant(
    hostSessionId: string,
    targetId: string,
    tournamentId: string
): Promise<{ success: boolean; error?: string }> {
    // Verify host
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('host_session_id')
        .eq('id', tournamentId)
        .single();

    if (!tournament || tournament.host_session_id !== hostSessionId) {
        return { success: false, error: 'Only the host can kick participants' };
    }

    await supabase
        .from('tournament_participants')
        .delete()
        .eq('id', targetId);

    return { success: true };
}
