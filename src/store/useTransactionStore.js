import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { format, subDays, parseISO, isBefore, isEqual } from 'date-fns';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const d = (daysAgo) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
const m = (monthsAgo, day) =>
  format(new Date(new Date().getFullYear(), new Date().getMonth() - monthsAgo, day), 'yyyy-MM-dd');

const SEED = [];


const SEED_VERSION = 'v2.1';
const refreshSeedDates = (state) => {
  if (state.seedVersion === SEED_VERSION) return state.transactions;
  const seedTxns = state.transactions.filter(t => t.id.startsWith('s'));
  if (seedTxns.length === 0) return state.transactions;
  const latestSeed = new Date(Math.max(...seedTxns.map(t => new Date(t.date))));
  const diffDays = Math.floor((new Date() - latestSeed) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    const newTxns = state.transactions.map(t => {
      if (!t.id.startsWith('s')) return t;
      const d = new Date(t.date);
      d.setDate(d.getDate() + diffDays);
      return { ...t, date: format(d, 'yyyy-MM-dd') };
    });
    state.seedVersion = SEED_VERSION;
    return newTxns;
  }
  state.seedVersion = SEED_VERSION;
  return state.transactions;
};

const isActive = (t) => t.status !== 'voided' && t.status !== 'reversal';

export const useTransactionStore = create(
  persist(
    (set, get) => ({
      transactions: SEED,
      lockDate: null,
      isLoading: false,

      fetchTransactions: async (userId) => {
        if (!userId) return;
        set({ isLoading: true });
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching transactions:', error);
        } else {
          // Map DB fields to store fields (amount_cents -> amountCents, etc.)
          const mapped = data.map(t => ({
            id: t.id,
            date: t.date,
            description: t.description,
            amountCents: t.amount_cents,
            categoryId: t.category_id,
            type: t.type,
            merchantName: t.merchant,
            status: t.status,
            reconciled: t.reconciled,
            userId: t.user_id
          }));
          set({ transactions: mapped });
        }
        set({ isLoading: false });
      },

      setLockDate: (date) => set({ lockDate: date }),

      addTransaction: async (data, userId) => {
        if (!userId) {
          toast.error('Please login to add transactions');
          return;
        }
        const tempId = uuid();
        const txnDate = parseISO(data.date);
        
        if (get().lockDate) {
          const lockDate = parseISO(get().lockDate);
          if (isBefore(txnDate, lockDate) || isEqual(txnDate, lockDate)) {
            toast.error('Cannot add transactions before lock date');
            return;
          }
        }

        // Optimistic UI
        const newTxn = { 
          id: tempId, 
          createdAt: new Date().toISOString(), 
          status: 'pending', 
          ...data 
        };
        set(s => ({ transactions: [newTxn, ...s.transactions] }));

        const { error } = await supabase.from('transactions').insert([{
          id: tempId,
          user_id: userId,
          date: data.date,
          description: data.description,
          amount_cents: data.amountCents,
          category_id: data.categoryId,
          type: data.type,
          merchant: data.merchantName,
          status: 'active'
        }]);

        if (error) {
          console.error('Sync failed:', error);
          toast.error('Sync failed. Transaction saved locally.');
          set(s => ({ 
            transactions: s.transactions.map(t => t.id === tempId ? { ...t, status: 'failed' } : t) 
          }));
        } else {
          set(s => ({ 
            transactions: s.transactions.map(t => t.id === tempId ? { ...t, status: 'active' } : t) 
          }));
        }
      },

      retrySync: async (id, userId) => {
        const txn = get().transactions.find(t => t.id === id);
        if (!txn || txn.status !== 'failed') return;

        set(s => ({ 
          transactions: s.transactions.map(t => t.id === id ? { ...t, status: 'pending' } : t) 
        }));

        const { error } = await supabase.from('transactions').insert([{
          id: txn.id,
          user_id: userId,
          date: txn.date,
          description: txn.description,
          amount_cents: txn.amountCents,
          category_id: txn.categoryId,
          type: txn.type,
          merchant: txn.merchantName,
          status: 'active'
        }]);

        if (error) {
          toast.error('Retry failed');
          set(s => ({ 
            transactions: s.transactions.map(t => t.id === id ? { ...t, status: 'failed' } : t) 
          }));
        } else {
          toast.success('Synced successfully');
          set(s => ({ 
            transactions: s.transactions.map(t => t.id === id ? { ...t, status: 'active' } : t) 
          }));
        }
      },

      updateTransaction: async (id, data, userId) => {
        if (!userId) return;
        const oldTxns = get().transactions;
        // Optimistic UI
        set(s => ({
          transactions: s.transactions.map(t => t.id === id ? { ...t, ...data } : t)
        }));

        if (!id.startsWith('s')) {
          const { error } = await supabase.from('transactions').update({
            date: data.date,
            description: data.description,
            amount_cents: data.amountCents,
            category_id: data.categoryId,
            type: data.type,
            merchant: data.merchantName,
            status: data.status,
            reconciled: data.reconciled
          }).eq('id', id);

          if (error) {
            console.error('Sync failed:', error);
            toast.error('Sync failed');
            set({ transactions: oldTxns });
          }
        }
      },

      deleteTransaction: async (id, userId) => {
        if (!userId) return;
        const txn = get().transactions.find(t => t.id === id);
        if (!txn || txn.status === 'voided' || txn.status === 'reconciled') return;

        const oldTxns = get().transactions;
        
        // GAAP Voiding (Local)
        const reversingEntry = {
          ...txn,
          id: uuid(),
          description: `[REVERSAL] ${txn.description || txn.merchantName}`,
          amountCents: -Math.abs(txn.amountCents),
          status: 'reversal',
          createdAt: new Date().toISOString(),
        };

        set(s => ({
          transactions: [
            reversingEntry,
            ...s.transactions.map(t => t.id === id ? { ...t, status: 'voided' } : t)
          ]
        }));

        if (!id.startsWith('s')) {
          const { error: voidError } = await supabase.from('transactions').update({ status: 'voided' }).eq('id', id);
          const { error: revError } = await supabase.from('transactions').insert([{
            id: reversingEntry.id,
            user_id: userId,
            date: reversingEntry.date,
            description: reversingEntry.description,
            amount_cents: reversingEntry.amountCents,
            category_id: reversingEntry.categoryId,
            type: reversingEntry.type,
            merchant: reversingEntry.merchantName,
            status: 'reversal'
          }]);

          if (voidError || revError) {
            console.error('Void sync failed');
            toast.error('Void sync failed');
            set({ transactions: oldTxns });
          }
        }
      },

      // ── Selectors (all exclude voided + reversal) ──────────────────────────
      getTotalIncome: () =>
        get().transactions
          .filter((t) => t.type === 'income' && isActive(t))
          .reduce((acc, t) => acc + t.amountCents, 0),

      getTotalExpenses: () =>
        get().transactions
          .filter((t) => t.type === 'expense' && isActive(t))
          .reduce((acc, t) => acc + t.amountCents, 0),

      getBalance: () => get().getTotalIncome() - get().getTotalExpenses(),

      getByCategory: () => {
        const expenses = get().transactions.filter((t) => t.type === 'expense' && isActive(t));
        const map = {};
        expenses.forEach((t) => {
          map[t.categoryId] = (map[t.categoryId] || 0) + t.amountCents;
        });
        return map;
      },

      /**
       * FIX #8 — Real month-over-month delta for stat cards.
       * Returns a percentage change vs the previous calendar month.
       * type: 'income' | 'expense' | 'balance'
       */
      getMonthDelta: (type) => {
        const now = new Date();
        const curM = now.getMonth();
        const curY = now.getFullYear();
        const prevM = curM === 0 ? 11 : curM - 1;
        const prevY = curM === 0 ? curY - 1 : curY;

        const inMonth = (t, mo, yr) => {
          if (!t.date || !isActive(t)) return false;
          const dt = new Date(t.date);
          return dt.getMonth() === mo && dt.getFullYear() === yr;
        };

        const sumType = (txType, mo, yr) =>
          get().transactions
            .filter((t) => t.type === txType && inMonth(t, mo, yr))
            .reduce((s, t) => s + t.amountCents, 0);

        let current, previous;
        if (type === 'balance') {
          current  = sumType('income', curM, curY) - sumType('expense', curM, curY);
          previous = sumType('income', prevM, prevY) - sumType('expense', prevM, prevY);
        } else {
          current  = sumType(type, curM, curY);
          previous = sumType(type, prevM, prevY);
        }

        if (previous === 0) return current > 0 ? 100 : 0;
        return Number(((current - previous) / Math.abs(previous) * 100).toFixed(1));
      },
      /**
       * FIX #8 — Calculate Net Worth Delta.
       * Reflects how much the total Net Worth (Portfolio + Cash) changed THIS MONTH.
       */
      getNetWorthDelta: (portfolioCents) => {
        const now = new Date();
        const curM = now.getMonth();
        const curY = now.getFullYear();

        const inMonth = (t, mo, yr) => {
          if (!t.date || !isActive(t)) return false;
          const dt = new Date(t.date);
          return dt.getMonth() === mo && dt.getFullYear() === yr;
        };

        const currentMonthNet = get().transactions
          .filter((t) => inMonth(t, curM, curY))
          .reduce((s, t) => s + (t.type === 'income' ? t.amountCents : -t.amountCents), 0);

        const currentNW = portfolioCents + get().getBalance();
        const previousNW = currentNW - currentMonthNet;

        if (previousNW === 0) return currentMonthNet > 0 ? 100 : 0;
        return Number(((currentNW - previousNW) / Math.abs(previousNW) * 100).toFixed(1));
      },
    }),
    { 
      name: 'fintrack-transactions-v3',
      version: 2,
      migrate: (persistedState) => persistedState,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.transactions = refreshSeedDates(state);
        }
      }
    }
  )
);
