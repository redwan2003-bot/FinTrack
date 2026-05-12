import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false, // Default to false to prevent unauthorized access
      user: {
        name: 'Redwan Ahmmed',
        email: 'redwan@example.com',
      },
      login: (email, password) => {
        // Mock authentication
        set({
          isAuthenticated: true,
          user: {
            name: email.split('@')[0],
            email: email,
          },
        });
      },
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    { name: 'fintrack-auth-v1' }
  )
);
