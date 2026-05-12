import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

const SEED_PORTFOLIO = [
  { id: 'p1', name: 'Vanguard S&P 500', type: 'asset', category: 'investment', balanceCents: 1500000 },
  { id: 'p2', name: 'Emergency Savings', type: 'asset', category: 'cash', balanceCents: 500000 },
  { id: 'p3', name: 'Car Loan', type: 'liability', category: 'debt', balanceCents: 850000 },
];

export const usePortfolioStore = create(
  persist(
    (set, get) => ({
      accounts: SEED_PORTFOLIO,

      addAccount: (data) =>
        set((s) => ({
          accounts: [...s.accounts, { id: uuid(), ...data }],
        })),

      updateAccount: (id, data) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),

      deleteAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
        })),

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
