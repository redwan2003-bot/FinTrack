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

  const setType = (t) => { setActiveType(t); setValue('type', t); };

  const cats = activeType === 'income'
    ? CATEGORIES.filter((c) => c.id === 'income')
    : CATEGORIES.filter((c) => c.id !== 'income');

  return (
    <form className="txn-form" onSubmit={handleSubmit(onSubmit)}>
      {/* Type toggle */}
      <div className="type-toggle">
        <button type="button" className={`toggle-btn ${activeType === 'expense' ? 'active-expense' : ''}`} onClick={() => setType('expense')}>Expense</button>
        <button type="button" className={`toggle-btn ${activeType === 'income'  ? 'active-income'  : ''}`} onClick={() => setType('income')} >Income</button>
      </div>
      <input type="hidden" {...register('type')} value={activeType} />

      {/* Amount */}
      <div className="form-group">
        <label className="form-label">Amount (BDT)</label>
        <div className="amount-input-wrap">
          <span className="currency-symbol">৳</span>
          <input className={`form-input amount-input ${errors.amount ? 'error' : ''}`} type="number" step="0.01" placeholder="0.00" {...register('amount')} />
        </div>
        {errors.amount && <p className="form-error">{errors.amount.message}</p>}
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Description</label>
        <input className={`form-input ${errors.description ? 'error' : ''}`} placeholder="e.g. Grocery run" {...register('description')} />
        {errors.description && <p className="form-error">{errors.description.message}</p>}
      </div>

      {/* Merchant */}
      <div className="form-group">
        <label className="form-label">Merchant <span style={{color:'var(--text-muted)'}}>optional</span></label>
        <input className="form-input" placeholder="e.g. Whole Foods" {...register('merchantName')} />
      </div>

      {/* Category */}
      <div className="form-group">
        <label className="form-label">Category</label>
        <select className={`form-input ${errors.categoryId ? 'error' : ''}`} {...register('categoryId')}>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="form-error">{errors.categoryId.message}</p>}
      </div>

      {/* Date */}
      <div className="form-group">
        <label className="form-label">Date</label>
        <input type="date" className={`form-input ${errors.date ? 'error' : ''}`} {...register('date')} />
        {errors.date && <p className="form-error">{errors.date.message}</p>}
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
