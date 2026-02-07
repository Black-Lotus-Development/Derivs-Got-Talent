import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure these with your Supabase project credentials
// For development/demo, uses placeholder values that gracefully fall back to local mock data
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function isSupabaseConfigured() {
  return supabase !== null;
}

// ── Leaderboard Operations ──────────────────────────────────────────

const LEADERBOARD_CACHE_KEY = '@deriv_talent_leaderboard';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'ALPHA-PRIME', pnl: 847.32, win_rate: 72, trades: 24, sharpe: 1.82 },
  { rank: 2, name: 'BETA-STRIKE', pnl: 623.10, win_rate: 68, trades: 31, sharpe: 1.54 },
  { rank: 3, name: 'GAMMA-RAY', pnl: 512.45, win_rate: 65, trades: 19, sharpe: 1.41 },
  { rank: 4, name: 'DELTA-SIGMA', pnl: 389.20, win_rate: 61, trades: 27, sharpe: 1.12 },
  { rank: 5, name: 'EPSILON-9', pnl: 245.80, win_rate: 58, trades: 22, sharpe: 0.89 },
  { rank: 6, name: 'ZETA-NULL', pnl: -42.15, win_rate: 45, trades: 12, sharpe: -0.32 },
];

export async function fetchLeaderboard() {
  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('pnl', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const ranked = data.map((entry, i) => ({ ...entry, rank: i + 1 }));
        // Cache locally
        await AsyncStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(ranked));
        return ranked;
      }
    } catch (e) {
      console.warn('Supabase leaderboard fetch failed, using fallback:', e);
    }
  }

  // Try local cache
  try {
    const cached = await AsyncStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Local cache read failed:', e);
  }

  // Fall back to mock data
  return MOCK_LEADERBOARD;
}

export async function submitScore(entry) {
  // Always persist locally
  try {
    const existing = await fetchLeaderboard();
    const updated = [...existing.filter(e => e.name !== entry.name), entry]
      .sort((a, b) => b.pnl - a.pnl)
      .map((e, i) => ({ ...e, rank: i + 1 }));
    await AsyncStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Local score save failed:', e);
  }

  // Push to Supabase if configured
  if (supabase) {
    try {
      const { error } = await supabase
        .from('leaderboard')
        .upsert({
          name: entry.name,
          pnl: entry.pnl,
          win_rate: entry.win_rate || entry.winRate || 0,
          trades: entry.trades || 0,
          sharpe: entry.sharpe || 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'name' });

      if (error) {
        console.warn('Supabase score submit error:', error);
      }
    } catch (e) {
      console.warn('Supabase score submit failed:', e);
    }
  }
}

export default supabase;
