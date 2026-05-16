import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CATEGORIES } from '../../utils/categories';
import { toCents } from '../../utils/currency';
import { sanitizeText, sanitizeName } from '../../utils/security';
import toast from 'react-hot-toast';

const schema = z.object({
  type:        z.enum(['income', 'expense']),
  amount:      z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  merchantName: z.string().optional(),
  categoryId:  z.string().min(1, 'Category is required'),
  date:        z.string().min(1, 'Date is required'),
});

export default function TransactionForm({ onClose, existing }) {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { user } = useAuthStore();
  const [activeType, setActiveType] = useState(existing?.type || 'expense');

  const { register, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? { ...existing, amount: existing.amountCents / 100 }
      : { type: 'expense', date: format(new Date(), 'yyyy-MM-dd'), categoryId: 'food' },
  });

  useEffect(() => {
    if (activeType === 'income') {
      setValue('categoryId', 'income');
    } else {
      // If we switched from income back to expense, reset category to food
      if (getValues('categoryId') === 'income') {
        setValue('categoryId', 'food');
      }
    }
  }, [activeType, setValue]); // getValues removed to fix UX-02

  const onSubmit = (data) => {
    const payload = { 
      ...data, 
      description: sanitizeText(data.description),
      merchantName: sanitizeName(data.merchantName),
      amountCents: toCents(data.amount) 
    };
    if (existing) {
      updateTransaction(existing.id, payload, user?.id);
      toast.success('Transaction updated');
    } else {
      addTransaction(payload, user?.id);
      toast.success('Transaction added');
    }
    onClose();
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-[rgba(255,255,255,0.05)] rounded-full flex items-center justify-center mb-4 text-[var(--text-muted)]">
          <User size={32} />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-1)] mb-2">Authentication Required</h3>
        <p className="text-[var(--text-2)] text-sm mb-6 max-w-[280px]">
          Please sign in to your account to add or manage transactions.
        </p>
        <button 
          className="btn btn-primary w-full" 
          onClick={() => window.location.href = '#/login'}
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const setType = (t) => { setActiveType(t); setValue('type', t); };

  const cats = activeType === 'income'
    ? CATEGORIES.filter((c) => c.id === 'income')
    : CATEGORIES.filter((c) => c.id !== 'income');

  return (
    <form className="txn-form" onSubmit={handleSubmit(onSubmit)}>
      {/* Type toggle */}
      <fieldset className="type-toggle" role="radiogroup" aria-label="Transaction type">
        <button 
          type="button" 
          className={`toggle-btn ${activeType === 'expense' ? 'active-expense' : ''}`} 
          onClick={() => setType('expense')}
          aria-pressed={activeType === 'expense'}
        >
          Expense
        </button>
        <button 
          type="button" 
          className={`toggle-btn ${activeType === 'income'  ? 'active-income'  : ''}`} 
          onClick={() => setType('income')}
          aria-pressed={activeType === 'income'}
        >
          Income
        </button>
      </fieldset>
      <input type="hidden" {...register('type')} value={activeType} />

      {/* Amount */}
      <div className="form-group">
        <label className="form-label" htmlFor="txn-amount">Amount (BDT)</label>
        <div className="amount-input-wrap">
          <span className="currency-symbol" aria-hidden="true">৳</span>
          <input 
            id="txn-amount"
            className={`form-input amount-input ${errors.amount ? 'error' : ''}`} 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            {...register('amount')} 
            aria-invalid={!!errors.amount}
          />
        </div>
        {errors.amount && <p className="form-error" role="alert">{errors.amount.message}</p>}
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label" htmlFor="txn-desc">Description</label>
        <input 
          id="txn-desc"
          className={`form-input ${errors.description ? 'error' : ''}`} 
          placeholder="e.g. Grocery run" 
          {...register('description')} 
          aria-invalid={!!errors.description}
        />
        {errors.description && <p className="form-error" role="alert">{errors.description.message}</p>}
      </div>

      {/* Merchant */}
      <div className="form-group">
        <label className="form-label" htmlFor="txn-merchant">Merchant <span style={{color:'var(--text-muted)'}}>optional</span></label>
        <input 
          id="txn-merchant"
          className="form-input" 
          placeholder="e.g. Whole Foods" 
          {...register('merchantName')} 
        />
      </div>

      {/* Category */}
      <div className="form-group">
        <label className="form-label" htmlFor="txn-cat">Category</label>
        <select 
          id="txn-cat"
          className={`form-input ${errors.categoryId ? 'error' : ''}`} 
          {...register('categoryId')}
          aria-invalid={!!errors.categoryId}
        >
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="form-error" role="alert">{errors.categoryId.message}</p>}
      </div>

      {/* Date */}
      <div className="form-group">
        <label className="form-label" htmlFor="txn-date">Date</label>
        <input 
          id="txn-date"
          type="date" 
          className={`form-input ${errors.date ? 'error' : ''}`} 
          {...register('date')} 
          aria-invalid={!!errors.date}
        />
        {errors.date && <p className="form-error" role="alert">{errors.date.message}</p>}
      </div>

      {/* Submit */}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {existing ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
}
