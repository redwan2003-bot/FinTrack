import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const SEED_PORTFOLIO = [];


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
        if (!userId) {
          toast.error('Please login to add accounts');
          return;
        }
        const tempId = uuid();
        const newAcc = { id: tempId, ...data };
        set(s => ({ accounts: [...s.accounts, newAcc] }));

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
          toast.error('Sync failed');
          set(s => ({ accounts: s.accounts.filter(a => a.id !== tempId) }));
        }
      },

      updateAccount: async (id, data, userId) => {
        if (!userId) return;
        const oldAccs = get().accounts;
        set(s => ({
          accounts: s.accounts.map(a => a.id === id ? { ...a, ...data } : a)
        }));

        if (!id.startsWith('p')) {
          const { error } = await supabase.from('portfolio_accounts').update({
            name: data.name,
            type: data.type,
            category: data.category,
            balance_cents: data.balanceCents,
            updated_at: new Date().toISOString()
          }).eq('id', id);

          if (error) {
            console.error('Sync failed:', error);
            toast.error('Sync failed');
            set({ accounts: oldAccs });
          }
        }
      },

      deleteAccount: async (id, userId) => {
        if (!userId) return;
        const oldAccs = get().accounts;
        set(s => ({ accounts: s.accounts.filter(a => a.id !== id) }));

        if (!id.startsWith('p')) {
          const { error } = await supabase.from('portfolio_accounts').delete().eq('id', id);
          if (error) {
            console.error('Sync failed:', error);
            toast.error('Sync failed');
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
      name: 'fintrack-portfolio-v2',
      version: 2,
      migrate: (persistedState) => persistedState,
    }
  )
);
