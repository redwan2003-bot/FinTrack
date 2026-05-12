import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { format, subDays, parseISO, isBefore, isEqual } from 'date-fns';
import { supabase } from '../lib/supabase';

const d = (daysAgo) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
const m = (monthsAgo, day) =>
  format(new Date(new Date().getFullYear(), new Date().getMonth() - monthsAgo, day), 'yyyy-MM-dd');

const SEED = [
  // ... (keeping SEED for guest view)
  { id: 's1',  type: 'income',  amountCents: 500000, description: 'Monthly Salary',       merchantName: 'TechCorp Inc',       categoryId: 'income', date: m(0,1)  },
  { id: 's2',  type: 'income',  amountCents: 150000, description: 'Freelance Project',    merchantName: 'Client Co.',         categoryId: 'income', date: m(0,10) },
  { id: 's3',  type: 'income',  amountCents: 500000, description: 'Monthly Salary',       merchantName: 'TechCorp Inc',       categoryId: 'income', date: m(1,1)  },
  { id: 's4',  type: 'income',  amountCents: 80000,  description: 'Side Project Payment', merchantName: 'Upwork',             categoryId: 'income', date: m(1,15) },
  { id: 's5',  type: 'income',  amountCents: 500000, description: 'Monthly Salary',       merchantName: 'TechCorp Inc',       categoryId: 'income', date: m(2,1)  },
  { id: 's6',  type: 'expense', amountCents: 4200,   description: 'Breakfast',            merchantName: 'Blue Bottle Coffee', categoryId: 'food',   date: d(1)   },
  { id: 's7',  type: 'expense', amountCents: 12800,  description: 'Team Lunch',           merchantName: 'Chipotle',           categoryId: 'food',   date: d(3)   },
  { id: 's8',  type: 'expense', amountCents: 6500,   description: 'Dinner',               merchantName: 'Pho 99',             categoryId: 'food',   date: d(5)   },
  { id: 's9',  type: 'expense', amountCents: 8900,   description: 'Groceries',            merchantName: 'Whole Foods',        categoryId: 'food',   date: d(7)   },
  { id: 's10', type: 'expense', amountCents: 5500,   description: 'Cafe & Work',          merchantName: 'Starbucks',          categoryId: 'food',   date: d(9)   },
  { id: 's11', type: 'expense', amountCents: 14200,  description: 'Weekend Brunch',       merchantName: 'The Egg Shop',       categoryId: 'food',   date: d(11)  },
  { id: 's12', type: 'expense', amountCents: 9800,   description: 'Groceries',            merchantName: "Trader Joe's",       categoryId: 'food',   date: m(1,18) },
  { id: 's13', type: 'expense', amountCents: 2400,   description: 'Uber to Office',       merchantName: 'Uber',               categoryId: 'transport', date: d(2)   },
  { id: 's14', type: 'expense', amountCents: 5800,   description: 'Gas',                  merchantName: 'Shell',              categoryId: 'transport', date: d(8)   },
  { id: 's15', type: 'expense', amountCents: 3200,   description: 'Metro Card Top-up',    merchantName: 'MTA',                categoryId: 'transport', date: d(14)  },
  { id: 's16', type: 'expense', amountCents: 1900,   description: 'Lyft Ride',            merchantName: 'Lyft',               categoryId: 'transport', date: m(1,22) },
  { id: 's17', type: 'expense', amountCents: 150000, description: 'Rent',                 merchantName: 'Landlord',           categoryId: 'bills', date: m(0,1)  },
  { id: 's18', type: 'expense', amountCents: 9900,   description: 'Internet',             merchantName: 'Comcast',            categoryId: 'bills', date: m(0,5)  },
  { id: 's19', type: 'expense', amountCents: 7200,   description: 'Electricity',          merchantName: 'Con Edison',         categoryId: 'bills', date: m(0,8)  },
  { id: 's20', type: 'expense', amountCents: 4500,   description: 'Phone Bill',           merchantName: 'T-Mobile',           categoryId: 'bills', date: m(0,10) },
  { id: 's21', type: 'expense', amountCents: 150000, description: 'Rent',                 merchantName: 'Landlord',           categoryId: 'bills', date: m(1,1)  },
  { id: 's22', type: 'expense', amountCents: 9900,   description: 'Internet',             merchantName: 'Comcast',            categoryId: 'bills', date: m(1,5)  },
  { id: 's23', type: 'expense', amountCents: 1599,   description: 'Netflix',              merchantName: 'Netflix',            categoryId: 'entertainment', date: m(0,3) },
  { id: 's24', type: 'expense', amountCents: 999,    description: 'Spotify',              merchantName: 'Spotify',            categoryId: 'entertainment', date: m(0,3) },
  { id: 's25', type: 'expense', amountCents: 3600,   description: 'Movie Night',          merchantName: 'AMC Theatres',       categoryId: 'entertainment', date: d(6)  },
  { id: 's26', type: 'expense', amountCents: 4999,   description: 'Gaming',               merchantName: 'Steam',              categoryId: 'entertainment', date: d(12) },
  { id: 's27', type: 'expense', amountCents: 15000,  description: 'New Headphones',       merchantName: 'Best Buy',           categoryId: 'shopping', date: d(4)   },
  { id: 's28', type: 'expense', amountCents: 8700,   description: 'Clothing',             merchantName: 'Zara',               categoryId: 'shopping', date: d(10)  },
  { id: 's29', type: 'expense', amountCents: 5400,   description: 'Amazon Order',         merchantName: 'Amazon',             categoryId: 'shopping', date: d(15)  },
  { id: 's30', type: 'expense', amountCents: 23000,  description: 'Laptop Stand',         merchantName: 'Apple Store',        categoryId: 'shopping', date: m(1,20) },
  { id: 's31', type: 'expense', amountCents: 4000,   description: 'Gym Membership',       merchantName: 'Planet Fitness',     categoryId: 'health', date: m(0,1)  },
  { id: 's32', type: 'expense', amountCents: 2500,   description: 'Pharmacy',             merchantName: 'CVS',                categoryId: 'health', date: d(13)  },
  { id: 's33', type: 'expense', amountCents: 15000,  description: 'Doctor Visit',         merchantName: 'City Medical',       categoryId: 'health', date: m(1,12) },
  { id: 's34', type: 'expense', amountCents: 38000,  description: 'Flight Tickets',       merchantName: 'Delta Airlines',     categoryId: 'travel', date: m(1,8)  },
  { id: 's35', type: 'expense', amountCents: 22000,  description: 'Hotel Stay',           merchantName: 'Marriott',           categoryId: 'travel', date: m(1,8)  },
  { id: 's36', type: 'expense', amountCents: 50000,  description: 'Emergency Fund',       merchantName: 'Savings Account',    categoryId: 'savings', date: m(0,2), status: 'reconciled' },
  { id: 's37', type: 'expense', amountCents: 50000,  description: 'Emergency Fund',       merchantName: 'Savings Account',    categoryId: 'savings', date: m(1,2), status: 'cleared' },
];

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
        const tempId = uuid();
        const txnDate = parseISO(data.date);
        
        if (get().lockDate) {
          const lockDate = parseISO(get().lockDate);
          if (isBefore(txnDate, lockDate) || isEqual(txnDate, lockDate)) return;
        }

        // Optimistic UI
        const newTxn = { 
          id: tempId, 
          createdAt: new Date().toISOString(), 
          status: 'pending', 
          ...data 
        };
        set(s => ({ transactions: [newTxn, ...s.transactions] }));

        if (userId) {
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
            // Revert on error
            set(s => ({ transactions: s.transactions.filter(t => t.id !== tempId) }));
          }
        }
      },

      updateTransaction: async (id, data, userId) => {
        const oldTxns = get().transactions;
        // Optimistic UI
        set(s => ({
          transactions: s.transactions.map(t => t.id === id ? { ...t, ...data } : t)
        }));

        if (userId && !id.startsWith('s')) {
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
            set({ transactions: oldTxns });
          }
        }
      },

      deleteTransaction: async (id, userId) => {
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

        if (userId && !id.startsWith('s')) {
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
      name: 'fintrack-transactions-v2',
      version: 1,
      migrate: (persistedState) => persistedState,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.transactions = refreshSeedDates(state);
        }
      }
    }
  )
);
