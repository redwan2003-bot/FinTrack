import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

const SEED_BUDGETS = [
  { id: 'b1', categoryId: 'food',          amountCents: 60000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b2', categoryId: 'transport',     amountCents: 20000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b3', categoryId: 'entertainment', amountCents: 15000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b4', categoryId: 'shopping',      amountCents: 30000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b5', categoryId: 'health',        amountCents: 10000,  period: 'monthly', alertThreshold: 0.80 },
  { id: 'b6', categoryId: 'bills',         amountCents: 200000, period: 'monthly', alertThreshold: 0.90 },
];

export const useBudgetStore = create(
  persist(
    (set) => ({
      budgets: SEED_BUDGETS,

      addBudget: (data) =>
        set((s) => ({
          budgets: [...s.budgets, { id: uuid(), alertThreshold: 0.80, ...data }],
        })),

      updateBudget: (id, data) =>
        set((s) => ({
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...data } : b)),
        })),

      deleteBudget: (id) =>
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),
    }),
    { 
      name: 'fintrack-budgets-v1',
      version: 1,
      migrate: (persistedState) => persistedState,
    }
  )
);
