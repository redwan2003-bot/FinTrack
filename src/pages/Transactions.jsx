import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Pencil, ChevronDown, Lock, CheckCircle2 } from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAuthStore } from '../store/useAuthStore';
import { CATEGORIES } from '../utils/categories';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import TransactionForm from '../components/transactions/TransactionForm';
import toast from 'react-hot-toast';
import { useTranslation } from '../lib/i18n';

export default function Transactions() {
  const { t } = useTranslation();
  const { transactions, deleteTransaction } = useTransactionStore();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [showAdd, setShowAdd]     = useState(false);
  const [editing, setEditing]     = useState(null);
  const [search, setSearch]       = useState(searchParams.get('q') || '');
  const [filterType, setFilterType] = useState('all');
  const [filterCat,  setFilterCat]  = useState('all');

  // FIX UX-01: Update local search state if URL param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => {
        const matchType = filterType === 'all' || t.type === filterType;
        const matchCat  = filterCat  === 'all' || t.categoryId === filterCat;
        const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || (t.merchantName || '').toLowerCase().includes(search.toLowerCase());
        return matchType && matchCat && matchSearch;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, search, filterType, filterCat]);

  const handleDelete = (id) => {
    try {
      deleteTransaction(id, user?.id);
      toast.success('Transaction deleted');
    } catch (err) {
      if (err.message === 'RECONCILED_LOCKED') {
        toast.error('Cannot void a reconciled transaction. Unlock it first.');
      } else {
        toast.error('Could not delete transaction.');
      }
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="filter-bar">
          {/* Search */}
          <div className="search-wrap">
            <Search size={14} color="var(--text-muted)" />
            <input className="search-input" placeholder={t('search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {/* Type filter */}
          <div className="select-wrap">
            <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">{t('all_types')}</option>
              <option value="income">{t('income')}</option>
              <option value="expense">{t('expense')}</option>
            </select>
            <ChevronDown size={13} className="select-icon" />
          </div>
          {/* Category filter */}
          <div className="select-wrap">
            <select className="filter-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="all">{t('all_categories')}</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={13} className="select-icon" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> {t('add')}</button>
      </div>

      {/* Count */}
      <p className="result-count">{filtered.length} {filtered.length === 1 ? t('transaction') : t('transactions_count')}</p>

      {/* Table */}
      <motion.div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="txn-table-header">
          <span>{t('description')}</span>
          <span>{t('category')}</span>
          <span>{t('date')}</span>
          <span>{t('amount')}</span>
          <span />
        </div>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No transactions match your filters.</p>
            </div>
          ) : (
            filtered.map((t, i) => (
              <motion.div
                key={t.id}
                className="txn-table-row"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.02 }}
              >
                <div>
                  <p className="txn-desc">{t.description}</p>
                  {t.merchantName && <p className="txn-merchant">{t.merchantName}</p>}
                </div>
                <Badge categoryId={t.categoryId} size="sm" />
                <span className="txn-date">{formatDate(t.date)}</span>
                <span className={`txn-amount ${t.type === 'income' ? 'income' : 'expense'}`} style={{ textDecoration: t.status === 'voided' ? 'line-through' : 'none', opacity: t.status === 'voided' ? 0.5 : 1 }}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amountCents)}
                </span>
                <div className="txn-actions">
                  {t.status === 'voided' ? (
                    <div className="flex items-center justify-center" style={{ width: 30, height: 30, color: 'var(--danger)', opacity: 0.8 }} title="Voided">
                      <span style={{ fontSize: 10, fontWeight: 700 }}>VOID</span>
                    </div>
                  ) : t.status === 'reconciled' ? (
                    <div className="flex items-center justify-center" style={{ width: 30, height: 30, color: 'var(--success)', opacity: 0.8 }} title="Reconciled (Locked)">
                      <Lock size={14} />
                    </div>
                  ) : (
                    <>
                      <button 
                        className="icon-btn" 
                        onClick={() => setEditing(t)}
                        aria-label={`Edit ${t.description || t.merchantName}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className="icon-btn danger" 
                        onClick={() => handleDelete(t.id)}
                        aria-label={`Delete ${t.description || t.merchantName}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Transaction">
        <TransactionForm onClose={() => setShowAdd(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Transaction">
        <TransactionForm onClose={() => setEditing(null)} existing={editing} />
      </Modal>
    </div>
  );
}
