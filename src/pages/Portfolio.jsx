import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Briefcase, Home, CreditCard, Building, Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency, toCents, fromCents } from '../utils/currency';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  type: z.enum(['asset', 'liability']),
  category: z.string().min(1),
  balanceCents: z.coerce.number().min(0, 'Balance must be positive'),
});

const CATEGORY_ICONS = {
  investment: <Briefcase size={16} className="text-purple-400" />,
  cash: <Wallet size={16} className="text-emerald-400" />,
  real_estate: <Home size={16} className="text-blue-400" />,
  debt: <CreditCard size={16} className="text-red-400" />,
  mortgage: <Building size={16} className="text-rose-400" />,
};

function PortfolioForm({ onClose, existing }) {
  const { addAccount, updateAccount } = usePortfolioStore();
  const { user } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? { ...existing, balanceCents: fromCents(existing.balanceCents) }
      : { type: 'asset', category: 'investment', balanceCents: '' },
  });

  const type = watch('type');

  const onSubmit = (data) => {
    const payload = { ...data, balanceCents: toCents(data.balanceCents) };
    if (existing) {
      updateAccount(existing.id, payload, user?.id);
      toast.success('Account updated');
    } else {
      addAccount(payload, user?.id);
      toast.success('Account created');
    }
    onClose();
  };

  return (
    <form className="txn-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-input" {...register('type')}>
            <option value="asset">Asset (Positive)</option>
            <option value="liability">Liability (Debt)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" {...register('category')}>
            {type === 'asset' ? (
              <>
                <option value="investment">Investment / Brokerage</option>
                <option value="cash">Cash / Bank Account</option>
                <option value="real_estate">Real Estate</option>
                <option value="other">Other Asset</option>
              </>
            ) : (
              <>
                <option value="debt">Credit Card / Personal Loan</option>
                <option value="mortgage">Mortgage</option>
                <option value="other">Other Liability</option>
              </>
            )}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Account Name</label>
        <input className="form-input" placeholder="e.g. Vanguard S&P 500" {...register('name')} />
        {errors.name && <p className="form-error">{errors.name.message}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Current Balance (BDT)</label>
        <div className="amount-input-wrap">
          <span className="currency-symbol">৳</span>
          <input className="form-input amount-input" type="number" step="0.01" placeholder="0.00" {...register('balanceCents')} />
        </div>
        {errors.balanceCents && <p className="form-error">{errors.balanceCents.message}</p>}
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">{existing ? 'Save Changes' : 'Add Account'}</button>
      </div>
    </form>
  );
}

export default function Portfolio() {
  const { accounts, deleteAccount, getTotalAssets, getTotalLiabilities, getNetWorth } = usePortfolioStore();
  const { getBalance } = useTransactionStore();
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const assets = accounts.filter(a => a.type === 'asset');
  const liabilities = accounts.filter(a => a.type === 'liability');
  const cashBalance = getBalance();
  const portfolioNetWorth = getNetWorth();
  const unifiedNetWorth = portfolioNetWorth + cashBalance;

  const handleDelete = (id) => {
    deleteAccount(id, user?.id);
    toast.success('Account removed');
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4 },
  });

  const renderAccount = (acc) => (
    <motion.div key={acc.id} className="txn-row hover:bg-[rgba(255,255,255,0.02)] transition-colors" style={{ cursor: 'default' }}>
      <div className="txn-info">
        <div className="txn-desc flex items-center gap-2">
          {CATEGORY_ICONS[acc.category] || <Briefcase size={14} />}
          {acc.name}
        </div>
        <div className="txn-meta" style={{ marginTop: '4px' }}>
          <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            {acc.category.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className={`txn-amount ${acc.type === 'asset' ? 'text-emerald-400' : 'text-red-400'}`} style={{ color: acc.type === 'asset' ? '#34d399' : '#f87171' }}>
          {acc.type === 'asset' ? '+' : '-'}{formatCurrency(acc.balanceCents)}
        </div>
        <div className="flex items-center gap-2">
          <button className="icon-btn" onClick={() => setEditing(acc)}>
            <Pencil size={14} />
          </button>
          <button className="icon-btn danger" onClick={() => handleDelete(acc.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="page">
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Portfolio & Net Worth</h1>
          <p className="text-[var(--text-2)] text-sm">Manage your long-term wealth and liabilities</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="stats-grid mb-8">
        <StatCard label="Total Net Worth" value={formatCurrency(unifiedNetWorth)} icon={Briefcase} accent="#8b5cf6" delay={0} />
        <StatCard label="Total Assets" value={formatCurrency(getTotalAssets() + cashBalance)} icon={TrendingUp} accent="#10b981" delay={0.1} />
        <StatCard label="Total Liabilities" value={formatCurrency(getTotalLiabilities())} icon={TrendingDown} accent="#ef4444" delay={0.2} />
      </div>

      <div className="charts-grid">
        <motion.div className="card" {...fadeUp(0.3)}>
          <div className="card-header">
            <h2 className="card-title text-emerald-400">Assets</h2>
            <span className="card-subtitle">{assets.length} Accounts</span>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {assets.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-2)] border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl">
                No assets recorded yet.
              </div>
            ) : (
              assets.map(renderAccount)
            )}
          </div>
        </motion.div>

        <motion.div className="card" {...fadeUp(0.4)}>
          <div className="card-header">
            <h2 className="card-title text-red-400">Liabilities</h2>
            <span className="card-subtitle">{liabilities.length} Accounts</span>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {liabilities.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-2)] border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl">
                No liabilities recorded yet. Great!
              </div>
            ) : (
              liabilities.map(renderAccount)
            )}
          </div>
        </motion.div>
      </div>

      <Modal open={showAdd || !!editing} onClose={() => { setShowAdd(false); setEditing(null); }} title={editing ? 'Edit Account' : 'Add Portfolio Account'}>
        <PortfolioForm onClose={() => { setShowAdd(false); setEditing(null); }} existing={editing} />
      </Modal>
    </div>
  );
}
