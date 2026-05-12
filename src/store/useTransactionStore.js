import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { format, subDays } from 'date-fns';

const d = (daysAgo) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
const m = (monthsAgo, day) =>
  format(new Date(new Date().getFullYear(), new Date().getMonth() - monthsAgo, day), 'yyyy-MM-dd');

const SEED = [
  // Income
  { id: 's1',  type: 'income',  amountCents: 500000, description: 'Monthly Salary',       merchantName: 'TechCorp Inc',       categoryId: 'income', date: m(0,1)  },
  { id: 's2',  type: 'income',  amountCents: 150000, description: 'Freelance Project',    merchantName: 'Client Co.',         categoryId: 'income', date: m(0,10) },
  { id: 's3',  type: 'income',  amountCents: 500000, description: 'Monthly Salary',       merchantName: 'TechCorp Inc',       categoryId: 'income', date: m(1,1)  },
  { id: 's4',  type: 'income',  amountCents: 80000,  description: 'Side Project Payment', merchantName: 'Upwork',             categoryId: 'income', date: m(1,15) },
  { id: 's5',  type: 'income',  amountCents: 500000, description: 'Monthly Salary',       merchantName: 'TechCorp Inc',       categoryId: 'income', date: m(2,1)  },
  // Food
  { id: 's6',  type: 'expense', amountCents: 4200,   description: 'Breakfast',            merchantName: 'Blue Bottle Coffee', categoryId: 'food',   date: d(1)   },
  { id: 's7',  type: 'expense', amountCents: 12800,  description: 'Team Lunch',           merchantName: 'Chipotle',           categoryId: 'food',   date: d(3)   },
  { id: 's8',  type: 'expense', amountCents: 6500,   description: 'Dinner',               merchantName: 'Pho 99',             categoryId: 'food',   date: d(5)   },
  { id: 's9',  type: 'expense', amountCents: 8900,   description: 'Groceries',            merchantName: 'Whole Foods',        categoryId: 'food',   date: d(7)   },
  { id: 's10', type: 'expense', amountCents: 5500,   description: 'Cafe & Work',          merchantName: 'Starbucks',          categoryId: 'food',   date: d(9)   },
  { id: 's11', type: 'expense', amountCents: 14200,  description: 'Weekend Brunch',       merchantName: 'The Egg Shop',       categoryId: 'food',   date: d(11)  },
  { id: 's12', type: 'expense', amountCents: 9800,   description: 'Groceries',            merchantName: "Trader Joe's",       categoryId: 'food',   date: m(1,18) },
  // Transport
  { id: 's13', type: 'expense', amountCents: 2400,   description: 'Uber to Office',       merchantName: 'Uber',               categoryId: 'transport', date: d(2)   },
  { id: 's14', type: 'expense', amountCents: 5800,   description: 'Gas',                  merchantName: 'Shell',              categoryId: 'transport', date: d(8)   },
  { id: 's15', type: 'expense', amountCents: 3200,   description: 'Metro Card Top-up',    merchantName: 'MTA',                categoryId: 'transport', date: d(14)  },
  { id: 's16', type: 'expense', amountCents: 1900,   description: 'Lyft Ride',            merchantName: 'Lyft',               categoryId: 'transport', date: m(1,22) },
  // Bills
  { id: 's17', type: 'expense', amountCents: 150000, description: 'Rent',                 merchantName: 'Landlord',           categoryId: 'bills', date: m(0,1)  },
  { id: 's18', type: 'expense', amountCents: 9900,   description: 'Internet',             merchantName: 'Comcast',            categoryId: 'bills', date: m(0,5)  },
  { id: 's19', type: 'expense', amountCents: 7200,   description: 'Electricity',          merchantName: 'Con Edison',         categoryId: 'bills', date: m(0,8)  },
  { id: 's20', type: 'expense', amountCents: 4500,   description: 'Phone Bill',           merchantName: 'T-Mobile',           categoryId: 'bills', date: m(0,10) },
  { id: 's21', type: 'expense', amountCents: 150000, description: 'Rent',                 merchantName: 'Landlord',           categoryId: 'bills', date: m(1,1)  },
  { id: 's22', type: 'expense', amountCents: 9900,   description: 'Internet',             merchantName: 'Comcast',            categoryId: 'bills', date: m(1,5)  },
  // Entertainment
  { id: 's23', type: 'expense', amountCents: 1599,   description: 'Netflix',              merchantName: 'Netflix',            categoryId: 'entertainment', date: m(0,3) },
  { id: 's24', type: 'expense', amountCents: 999,    description: 'Spotify',              merchantName: 'Spotify',            categoryId: 'entertainment', date: m(0,3) },
  { id: 's25', type: 'expense', amountCents: 3600,   description: 'Movie Night',          merchantName: 'AMC Theatres',       categoryId: 'entertainment', date: d(6)  },
  { id: 's26', type: 'expense', amountCents: 4999,   description: 'Gaming',               merchantName: 'Steam',              categoryId: 'entertainment', date: d(12) },
  // Shopping
  { id: 's27', type: 'expense', amountCents: 15000,  description: 'New Headphones',       merchantName: 'Best Buy',           categoryId: 'shopping', date: d(4)   },
  { id: 's28', type: 'expense', amountCents: 8700,   description: 'Clothing',             merchantName: 'Zara',               categoryId: 'shopping', date: d(10)  },
  { id: 's29', type: 'expense', amountCents: 5400,   description: 'Amazon Order',         merchantName: 'Amazon',             categoryId: 'shopping', date: d(15)  },
  { id: 's30', type: 'expense', amountCents: 23000,  description: 'Laptop Stand',         merchantName: 'Apple Store',        categoryId: 'shopping', date: m(1,20) },
  // Health
  { id: 's31', type: 'expense', amountCents: 4000,   description: 'Gym Membership',       merchantName: 'Planet Fitness',     categoryId: 'health', date: m(0,1)  },
  { id: 's32', type: 'expense', amountCents: 2500,   description: 'Pharmacy',             merchantName: 'CVS',                categoryId: 'health', date: d(13)  },
  { id: 's33', type: 'expense', amountCents: 15000,  description: 'Doctor Visit',         merchantName: 'City Medical',       categoryId: 'health', date: m(1,12) },
  // Travel
  { id: 's34', type: 'expense', amountCents: 38000,  description: 'Flight Tickets',       merchantName: 'Delta Airlines',     categoryId: 'travel', date: m(1,8)  },
  { id: 's35', type: 'expense', amountCents: 22000,  description: 'Hotel Stay',           merchantName: 'Marriott',           categoryId: 'travel', date: m(1,8)  },
  // Savings
  { id: 's36', type: 'expense', amountCents: 50000,  description: 'Emergency Fund',       merchantName: 'Savings Account',    categoryId: 'savings', date: m(0,2), status: 'reconciled' },
  { id: 's37', type: 'expense', amountCents: 50000,  description: 'Emergency Fund',       merchantName: 'Savings Account',    categoryId: 'savings', date: m(1,2), status: 'cleared' },
];

/**
 * FIX #1 — Shift seed dates to stay "fresh" for returning users.
 * If the latest seed transaction is more than 7 days old, we shift all seed
 * transaction dates forward to be relative to today. This prevents "stale"
 * seed data from breaking the month-over-month deltas.
 */
const refreshSeedDates = (txns) => {
  const seedTxns = txns.filter(t => t.id.startsWith('s'));
  if (seedTxns.length === 0) return txns;
  
  const latestSeed = new Date(Math.max(...seedTxns.map(t => new Date(t.date))));
  const today = new Date();
  const diffTime = today - latestSeed;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 7) {
    return txns.map(t => {
      if (!t.id.startsWith('s')) return t;
      const d = new Date(t.date);
      d.setDate(d.getDate() + diffDays);
      return { ...t, date: format(d, 'yyyy-MM-dd') };
    });
  }
  return txns;
};

/**
 * FIX #4 — Transactions excluded from financial math.
 * 'voided'   = original transaction, preserved for audit trail, excluded from sums.
 * 'reversal' = GAAP reversing entry (negated amount), also excluded from sums.
 * This way the audit log shows the full history but balances are always correct.
 */
const isActive = (t) => t.status !== 'voided' && t.status !== 'reversal';

export const useTransactionStore = create(
  persist(
    (set, get) => ({
      transactions: SEED,
      lockDate: null,
      setLockDate: (date) => set({ lockDate: date }),

      addTransaction: (data) =>
        set((s) => {
          if (s.lockDate && data.date && data.date <= s.lockDate) {
            console.warn(`Cannot add transaction before lock date: ${s.lockDate}`);
            return s;
          }
          let debitAccount = 'unknown';
          let creditAccount = 'unknown';
          if (data.type === 'expense') {
            debitAccount = `expense_${data.categoryId}`;
            creditAccount = 'asset_cash';
          } else if (data.type === 'income') {
            debitAccount = 'asset_cash';
            creditAccount = `revenue_${data.categoryId}`;
          }
          return {
            transactions: [
              { id: uuid(), createdAt: new Date().toISOString(), status: 'pending', debitAccount, creditAccount, ...data },
              ...s.transactions,
            ],
          };
        }),

      updateTransaction: (id, data) =>
        set((s) => {
          const txn = s.transactions.find((t) => t.id === id);
          if (s.lockDate && txn && txn.date <= s.lockDate) {
            console.warn(`Cannot edit transaction before lock date: ${s.lockDate}`);
            return s;
          }
          if (s.lockDate && data.date && data.date <= s.lockDate) {
            console.warn(`Cannot move transaction to before lock date: ${s.lockDate}`);
            return s;
          }
          return {
            transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...data } : t)),
          };
        }),

      deleteTransaction: (id) =>
        set((s) => {
          const txn = s.transactions.find((t) => t.id === id);
          if (!txn || txn.status === 'voided') return s;
          if (s.lockDate && txn.date <= s.lockDate) {
            console.warn(`Cannot void transaction before lock date: ${s.lockDate}`);
            return s;
          }
          if (txn.status === 'reconciled') {
            console.warn('Cannot directly void a reconciled transaction.');
            return s;
          }

          /**
           * FIX #4 — GAAP-compliant voiding:
           * 1. Mark original as 'voided' — preserves full amountCents for audit trail.
           * 2. Post a true 'reversal' entry with negated amountCents.
           * Both statuses are excluded from all balance calculations via isActive().
           */
          const reversingEntry = {
            ...txn,
            id: uuid(),
            description: `[REVERSAL] ${txn.description || txn.merchantName || 'Untitled'}`,
            amountCents: -Math.abs(txn.amountCents),
            status: 'reversal',
            reversalOf: txn.id,
            createdAt: new Date().toISOString(),
          };

          return {
            transactions: [
              reversingEntry,
              ...s.transactions.map((t) =>
                t.id === id
                  ? { ...t, status: 'voided', voidedAt: new Date().toISOString() }
                  : t
              ),
            ],
          };
        }),

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
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.transactions = refreshSeedDates(state.transactions);
        }
      }
    }
  )
);
