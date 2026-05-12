import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

import { supabase } from '../lib/supabase';

const SEED_BUDGETS = [
  // ... (keeping SEED for guest view)
  { id: 'b1', categoryId: 'food',          amountCents: 60000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b2', categoryId: 'transport',     amountCents: 20000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b3', categoryId: 'entertainment', amountCents: 15000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b4', categoryId: 'shopping',      amountCents: 30000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b5', categoryId: 'health',        amountCents: 10000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b6', categoryId: 'bills',         amountCents: 200000, period: 'monthly', alertThreshold: 0.90 },
];

export const useBudgetStore = create(
  persist(
    (set, get) => ({
      budgets: SEED_BUDGETS,
      isLoading: false,

      fetchBudgets: async (userId) => {
        if (!userId) return;
        set({ isLoading: true });
        const { data, error } = await supabase.from('budgets').select('*').eq('user_id', userId);
        if (error) {
          console.error('Error fetching budgets:', error);
        } else {
          const mapped = data.map(b => ({
            id: b.id,
            categoryId: b.category_id,
            amountCents: b.limit_cents,
            period: b.period,
            alertThreshold: 0.80
          }));
          set({ budgets: mapped });
        }
        set({ isLoading: false });
      },

      addBudget: async (data, userId) => {
        const tempId = uuid();
        const newBudget = { id: tempId, alertThreshold: 0.80, ...data };
        set(s => ({ budgets: [...s.budgets, newBudget] }));

        if (userId) {
          const { error } = await supabase.from('budgets').insert([{
            id: tempId,
            user_id: userId,
            category_id: data.categoryId,
            limit_cents: data.amountCents,
            period: data.period
          }]);
          if (error) {
            console.error('Sync failed:', error);
            set(s => ({ budgets: s.budgets.filter(b => b.id !== tempId) }));
          }
        }
      },

      updateBudget: async (id, data, userId) => {
        const oldBudgets = get().budgets;
        set(s => ({
          budgets: s.budgets.map(b => b.id === id ? { ...b, ...data } : b)
        }));

        if (userId && !id.startsWith('b')) {
          const { error } = await supabase.from('budgets').update({
            category_id: data.categoryId,
            limit_cents: data.amountCents,
            period: data.period
          }).eq('id', id);

          if (error) {
            console.error('Sync failed:', error);
            set({ budgets: oldBudgets });
          }
        }
      },

      deleteBudget: async (id, userId) => {
        const oldBudgets = get().budgets;
        set(s => ({ budgets: s.budgets.filter(b => b.id !== id) }));

        if (userId && !id.startsWith('b')) {
          const { error } = await supabase.from('budgets').delete().eq('id', id);
          if (error) {
            console.error('Sync failed:', error);
            set({ budgets: oldBudgets });
          }
        }
      },
    }),
    { 
      name: 'fintrack-budgets-v1',
      version: 1,
      migrate: (persistedState) => persistedState,
    }
  )
);
