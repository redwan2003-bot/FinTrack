import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTransactionStore } from './useTransactionStore';
import { supabase } from '../lib/supabase';

describe('useTransactionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTransactionStore.setState({
      transactions: [],
      lockDate: null,
      isLoading: false
    });
    vi.clearAllMocks();
  });

  it('initializes with empty transactions', () => {
    const { transactions } = useTransactionStore.getState();
    expect(transactions).toEqual([]);
  });

  it('calculates total income correctly', () => {
    useTransactionStore.setState({
      transactions: [
        { id: '1', amountCents: 1000, type: 'income', status: 'active' },
        { id: '2', amountCents: 500, type: 'income', status: 'active' },
        { id: '3', amountCents: 200, type: 'expense', status: 'active' },
        { id: '4', amountCents: 300, type: 'income', status: 'voided' }, // should be ignored
      ]
    });

    const totalIncome = useTransactionStore.getState().getTotalIncome();
    expect(totalIncome).toBe(1500);
  });

  it('calculates total expenses correctly', () => {
    useTransactionStore.setState({
      transactions: [
        { id: '1', amountCents: 1000, type: 'income', status: 'active' },
        { id: '2', amountCents: 500, type: 'expense', status: 'active' },
        { id: '3', amountCents: 200, type: 'expense', status: 'active' },
        { id: '4', amountCents: 300, type: 'expense', status: 'reversal' }, // should be ignored
      ]
    });

    const totalExpenses = useTransactionStore.getState().getTotalExpenses();
    expect(totalExpenses).toBe(700);
  });

  it('calculates balance correctly', () => {
    useTransactionStore.setState({
      transactions: [
        { id: '1', amountCents: 1000, type: 'income', status: 'active' },
        { id: '2', amountCents: 400, type: 'expense', status: 'active' },
      ]
    });

    const balance = useTransactionStore.getState().getBalance();
    expect(balance).toBe(600);
  });

  it('adds a transaction optimistically and syncs with supabase', async () => {
    const mockTxn = {
      date: '2026-05-16',
      description: 'Test',
      amountCents: 1000,
      categoryId: 'food',
      type: 'expense'
    };
    const userId = 'user-123';

    await useTransactionStore.getState().addTransaction(mockTxn, userId);

    const { transactions } = useTransactionStore.getState();
    expect(transactions.length).toBe(1);
    expect(transactions[0].description).toBe('Test');
    expect(transactions[0].status).toBe('pending');

    expect(supabase.from).toHaveBeenCalledWith('transactions');
  });

  it('prevents adding transactions before lock date', async () => {
    useTransactionStore.setState({ lockDate: '2026-05-15' });
    const mockTxn = {
      date: '2026-05-14',
      description: 'Old',
      amountCents: 1000,
      type: 'expense'
    };

    await useTransactionStore.getState().addTransaction(mockTxn, 'user-123');

    const { transactions } = useTransactionStore.getState();
    expect(transactions.length).toBe(0);
  });
});
