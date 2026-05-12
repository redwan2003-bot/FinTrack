import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

import { supabase } from '../lib/supabase';

const SEED_PORTFOLIO = [
  // ... (keeping SEED for guest view)
  { id: 'p1', name: 'Vanguard S&P 500', type: 'asset', category: 'investment', balanceCents: 1500000 },
  { id: 'p2', name: 'Emergency Savings', type: 'asset', category: 'cash', balanceCents: 500000 },
  { id: 'p3', name: 'Car Loan', type: 'liability', category: 'debt', balanceCents: 850000 },
];

export const usePortfolioStore = create(
  persist(
    (set, get) => ({
      accounts: SEED_PORTFOLIO,
      isLoading: false,

      fetchAccounts: async (userId) => {
        if (!userId) return;
        set({ isLoading: true });
        const { data, error } = await supabase.from('portfolio_accounts').select('*').eq('user_id', userId);
        if (error) {
          console.error('Error fetching accounts:', error);
        } else {
          const mapped = data.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            category: a.category,
            balanceCents: a.balance_cents
          }));
          set({ accounts: mapped });
        }
        set({ isLoading: false });
      },

      addAccount: async (data, userId) => {
        const tempId = uuid();
        const newAcc = { id: tempId, ...data };
        set(s => ({ accounts: [...s.accounts, newAcc] }));

        if (userId) {
          const { error } = await supabase.from('portfolio_accounts').insert([{
            id: tempId,
            user_id: userId,
            name: data.name,
            type: data.type,
            category: data.category,
            balance_cents: data.balanceCents
          }]);
          if (error) {
            console.error('Sync failed:', error);
            set(s => ({ accounts: s.accounts.filter(a => a.id !== tempId) }));
          }
        }
      },

      updateAccount: async (id, data, userId) => {
        const oldAccs = get().accounts;
        set(s => ({
          accounts: s.accounts.map(a => a.id === id ? { ...a, ...data } : a)
        }));

        if (userId && !id.startsWith('p')) {
          const { error } = await supabase.from('portfolio_accounts').update({
            name: data.name,
            type: data.type,
            category: data.category,
            balance_cents: data.balanceCents,
            updated_at: new Date().toISOString()
          }).eq('id', id);

          if (error) {
            console.error('Sync failed:', error);
            set({ accounts: oldAccs });
          }
        }
      },

      deleteAccount: async (id, userId) => {
        const oldAccs = get().accounts;
        set(s => ({ accounts: s.accounts.filter(a => a.id !== id) }));

        if (userId && !id.startsWith('p')) {
          const { error } = await supabase.from('portfolio_accounts').delete().eq('id', id);
          if (error) {
            console.error('Sync failed:', error);
            set({ accounts: oldAccs });
          }
        }
      },

      getTotalAssets: () =>
        get().accounts
          .filter((a) => a.type === 'asset')
          .reduce((acc, a) => acc + a.balanceCents, 0),

      getTotalLiabilities: () =>
        get().accounts
          .filter((a) => a.type === 'liability')
          .reduce((acc, a) => acc + a.balanceCents, 0),

      getNetWorth: () => get().getTotalAssets() - get().getTotalLiabilities(),
    }),
    { 
      name: 'fintrack-portfolio-v1',
      version: 1,
      migrate: (persistedState) => persistedState,
    }
  )
);
