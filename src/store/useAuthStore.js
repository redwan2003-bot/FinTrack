import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      loading: true,

      // Initialize auth listener
      init: () => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            set({ isAuthenticated: true, user: session.user, loading: false });
          } else {
            set({ loading: false });
          }
        });

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            set({ isAuthenticated: true, user: session.user, loading: false });
          } else {
            set({ isAuthenticated: false, user: null, loading: false });
          }
        });
      },

      loginWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/FinTrack/'
          }
        });
        if (error) throw error;
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ isAuthenticated: false, user: null });
        localStorage.removeItem('fintrack-transactions-v2');
        localStorage.removeItem('fintrack-budgets-v1');
        localStorage.removeItem('fintrack-portfolio-v1');
      },
    }),
    {
      name: 'fintrack-auth-v1',
      version: 1,
      migrate: (persistedState) => persistedState,
    }
  )
);
