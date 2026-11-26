import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';

export type AuthModalMode = 'default' | 'download';

interface AuthState {
  user: User | null;
  loading: boolean;
  authModalOpen: boolean;
  authModalReason: string | null;
  authModalMode: AuthModalMode;
  init: () => void;
  openAuthModal: (reason?: string, mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: isSupabaseConfigured,
  authModalOpen: false,
  authModalReason: null,
  authModalMode: 'default',

  init: () => {
    if (initialized || !supabase) {
      set({ loading: false });
      return;
    }
    initialized = true;
    supabase.auth.getSession().then(({ data }) => {
      set({ user: data.session?.user ?? null, loading: false });
    });
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        void trackEvent('google_login_completed', { userId: session.user.id });
      }
      set({ user: session?.user ?? null, loading: false });
    });
  },

  openAuthModal: (reason, mode = 'default') =>
    set({ authModalOpen: true, authModalReason: reason ?? null, authModalMode: mode }),
  closeAuthModal: () => set({ authModalOpen: false, authModalReason: null, authModalMode: 'default' }),

  signInWithEmail: async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ authModalOpen: false, authModalReason: null, authModalMode: 'default' });
  },

  signUpWithEmail: async (email, password, fullName) => {
    if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    const needsConfirmation = !data.session;
    if (!needsConfirmation) set({ authModalOpen: false, authModalReason: null, authModalMode: 'default' });
    return { needsConfirmation };
  },

  signInWithGoogle: async () => {
    if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
    const redirectTo = window.location.pathname.startsWith('/editor')
      ? window.location.href
      : window.location.origin + '/dashboard';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
