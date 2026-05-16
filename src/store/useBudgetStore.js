import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const SEED_BUDGETS = [];


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
        if (!userId) {
          toast.error('Please login to create budgets');
          return;
        }
        const tempId = uuid();
        const newBudget = { id: tempId, alertThreshold: 0.80, ...data };
        set(s => ({ budgets: [...s.budgets, newBudget] }));

        const { error } = await supabase.from('budgets').insert([{
          id: tempId,
          user_id: userId,
          category_id: data.categoryId,
          limit_cents: data.amountCents,
          period: data.period
        }]);
        if (error) {
          console.error('Sync failed:', error);
          toast.error('Sync failed');
          set(s => ({ budgets: s.budgets.filter(b => b.id !== tempId) }));
        }
      },

      updateBudget: async (id, data, userId) => {
        if (!userId) return;
        const oldBudgets = get().budgets;
        set(s => ({
          budgets: s.budgets.map(b => b.id === id ? { ...b, ...data } : b)
        }));

        if (!id.startsWith('b')) {
          const { error } = await supabase.from('budgets').update({
            category_id: data.categoryId,
            limit_cents: data.amountCents,
            period: data.period
          }).eq('id', id);

          if (error) {
            console.error('Sync failed:', error);
            toast.error('Sync failed');
            set({ budgets: oldBudgets });
          }
        }
      },

      deleteBudget: async (id, userId) => {
        if (!userId) return;
        const oldBudgets = get().budgets;
        set(s => ({ budgets: s.budgets.filter(b => b.id !== id) }));

        if (!id.startsWith('b')) {
          const { error } = await supabase.from('budgets').delete().eq('id', id);
          if (error) {
            console.error('Sync failed:', error);
            toast.error('Sync failed');
            set({ budgets: oldBudgets });
          }
        }
      },
    }),
    { 
      name: 'fintrack-budgets-v2',
      version: 2,
      migrate: (persistedState) => persistedState,
    }
  )
);
