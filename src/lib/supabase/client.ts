// Supabase Client Configuration
// This file provides the browser-side Supabase client

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Return a mock client during SSR/build if not configured
            throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        }
        _supabase = createClient(supabaseUrl, supabaseAnonKey, {
            realtime: {
                params: {
                    eventsPerSecond: 10,
                },
            },
        });
    }
    return _supabase;
}

// Export a proxy that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        const client = getSupabaseClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Turn transport-level failures into something a player can act on. A paused
 * or unreachable backend otherwise surfaces as a raw "TypeError: Failed to
 * fetch" in the middle of the page.
 */
export function friendlyError(raw: unknown): string {
    const message =
        raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : '';

    if (/failed to fetch|networkerror|load failed|fetch failed|err_name_not_resolved/i.test(message)) {
        return 'Can\u2019t reach the game server, so online play is unavailable right now. You can still play the computer or pass a device around.';
    }

    if (/not configured/i.test(message)) {
        return 'Online play isn\u2019t set up on this deployment. You can still play the computer or pass a device around.';
    }

    return message || 'Something went wrong. Please try again.';
}
