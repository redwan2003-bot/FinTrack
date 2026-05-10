import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { useBudgetStore } from '../store/useBudgetStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CATEGORIES, getCategoryById } from '../utils/categories';
import { formatCurrency, toCents, fromCents } from '../utils/currency';
// FIX #5: Use per-period range resolver instead of always getMonthRange
import { getRangeForPeriod, isInRange } from '../utils/dateUtils';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const PERIOD_LABELS = { weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' };

const schema = z.object({
  categoryId:     z.string().min(1),
  amountCents:    z.coerce.number().positive('Amount must be > 0'),
  period:         z.enum(['weekly', 'monthly', 'yearly']),
  alertThreshold: z.coerce.number().min(0.1).max(1),
});

function BudgetForm({ onClose, existing }) {
  const { addBudget, updateBudget } = useBudgetStore();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? { ...existing, amountCents: fromCents(existing.amountCents), alertThreshold: existing.alertThreshold }
      : { period: 'monthly', alertThreshold: 0.80, categoryId: 'food' },
  });

  const onSubmit = (data) => {
    const payload = { ...data, amountCents: toCents(data.amountCents) };
    if (existing) { updateBudget(existing.id, payload); toast.success('Budget updated'); }
    else           { addBudget(payload);                  toast.success('Budget created'); }
    onClose();
  };

  return (
    <form className="txn-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label className="form-label" htmlFor="budget-category">Category</label>
        <select id="budget-category" className="form-input" {...register('categoryId')}>
          {CATEGORIES.filter(c => c.id !== 'income').map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="budget-amount">Budget Amount (BDT)</label>
        <div className="amount-input-wrap">
          <span className="currency-symbol">৳</span>
          <input
            id="budget-amount"
            className="form-input amount-input"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('amountCents')}
          />
        </div>
        {errors.amountCents && <p className="form-error" role="alert">{errors.amountCents.message}</p>}
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="budget-period">Period</label>
        <select id="budget-period" className="form-input" {...register('period')}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="budget-alert">Alert at (% of budget)</label>
        <select id="budget-alert" className="form-input" {...register('alertThreshold')}>
          <option value={0.50}>50%</option>
          <option value={0.70}>70%</option>
          <option value={0.80}>80%</option>
          <option value={0.90}>90%</option>
        </select>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">{existing ? 'Save Changes' : 'Create Budget'}</button>
      </div>
    </form>
  );
}

function BudgetCard({ budget, spent, onEdit, onDelete }) {
  const cat = getCategoryById(budget.categoryId);
  const pct = Math.min(spent / budget.amountCents, 1);
  const over = spent > budget.amountCents;
  const alert = !over && pct >= budget.alertThreshold;
  const barColor = over ? '#ef4444' : alert ? '#f59e0b' : cat.color;

  // FIX #5: Run-rate now scoped per period
  const today = new Date();
  let runRate = 0;
  if (budget.period === 'monthly') {
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    runRate = Math.round((spent / Math.max(1, dayOfMonth)) * daysInMonth);
  } else if (budget.period === 'weekly') {
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    runRate = Math.round((spent / Math.max(1, dayOfWeek)) * 7);
  } else if (budget.period === 'yearly') {
    const start = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.ceil((today - start) / (1000 * 60 * 60 * 24)) + 1;
    runRate = Math.round((spent / Math.max(1, dayOfYear)) * 365);
  }
  const runRateOver = runRate > budget.amountCents;

  return (
    <motion.div
      className="budget-card"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      role="article"
      aria-label={`${cat.name} budget`}
    >
      <div className="budget-card-top">
        <Badge categoryId={budget.categoryId} size="sm" />
        <div className="budget-card-actions">
          {/* FIX #7: aria-label for icon-only buttons; role="alert" on warning */}
          {(over || alert) && (
            <span
              role="alert"
              aria-label={over ? 'Over budget' : 'Approaching budget limit'}
              title={over ? 'Over budget' : 'Approaching limit'}
            >
              <AlertTriangle size={15} color={over ? '#ef4444' : '#f59e0b'} aria-hidden="true" />
            </span>
          )}
          <button
            className="icon-btn"
            onClick={() => onEdit(budget)}
            aria-label={`Edit ${cat.name} budget`}
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            className="icon-btn danger"
            onClick={() => onDelete(budget.id)}
            aria-label={`Delete ${cat.name} budget`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="budget-amounts">
        <span className="budget-spent">{formatCurrency(spent)}</span>
        <span className="budget-of">of {formatCurrency(budget.amountCents)}</span>
      </div>

      <div className="budget-bar-track" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${Math.round(pct * 100)}% of ${cat.name} budget used`}>
        <motion.div
          className="budget-bar-fill"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="budget-footer flex flex-col gap-1">
        <div className="flex justify-between w-full">
          <span style={{ color: over ? '#ef4444' : 'var(--text-muted)', fontSize: 12 }}>
            {over ? `${formatCurrency(spent - budget.amountCents)} over budget` : `${formatCurrency(budget.amountCents - spent)} remaining`}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: barColor }}>{Math.round(pct * 100)}%</span>
        </div>
        <div className="flex justify-between w-full mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
          <span className="text-[11px] font-medium text-[var(--text-2)] uppercase tracking-wider">
            {PERIOD_LABELS[budget.period] ?? 'Period'} Run-Rate
          </span>
          <span className={`text-xs font-semibold ${runRateOver ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatCurrency(runRate)} / {budget.period.replace('ly', '')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Budgets() {
  const { budgets, deleteBudget } = useBudgetStore();
  const { transactions } = useTransactionStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  // FIX #5: Use period-aware range for each budget card
  const getSpent = (categoryId, period) => {
    const { start, end } = getRangeForPeriod(period);
    return transactions
      .filter((t) =>
        t.type === 'expense' &&
        t.categoryId === categoryId &&
        t.date &&
        isInRange(t.date, start, end) &&
        t.status !== 'voided' &&
        t.status !== 'reversal'
      )
      .reduce((s, t) => s + t.amountCents, 0);
  };

  const handleDelete = (id) => { deleteBudget(id); toast.success('Budget deleted'); };

  const totalBudgeted = budgets.reduce((s, b) => s + b.amountCents, 0);
  const totalSpent    = budgets.reduce((s, b) => s + getSpent(b.categoryId, b.period), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-summary">
          <span>Total budgeted: <strong>{formatCurrency(totalBudgeted)}</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span>Spent: <strong style={{ color: totalSpent > totalBudgeted ? '#ef4444' : '#22c55e' }}>{formatCurrency(totalSpent)}</strong></span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} aria-label="Create new budget">
          <Plus size={16} aria-hidden="true" /> New Budget
        </button>
      </div>

      <AnimatePresence>
        {budgets.length === 0 ? (
          <div className="empty-state card" role="status">
            <p>No budgets yet. Create one to start tracking!</p>
          </div>
        ) : (
          <div className="budgets-grid">
            {budgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                spent={getSpent(b.categoryId, b.period)}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Budget">
        <BudgetForm onClose={() => setShowAdd(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Budget">
        <BudgetForm onClose={() => setEditing(null)} existing={editing} />
      </Modal>
    </div>
  );
}
