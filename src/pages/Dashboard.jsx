import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wallet, TrendingUp, TrendingDown, DollarSign, ArrowRight } from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';
import StatCard          from '../components/ui/StatCard';
import Badge             from '../components/ui/Badge';
import Modal             from '../components/ui/Modal';
import SpendingPieChart  from '../components/charts/SpendingPieChart';
import TrendChart        from '../components/charts/TrendChart';
import TransactionForm   from '../components/transactions/TransactionForm';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0  },
  transition: { delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function Dashboard() {
  const [showAdd, setShowAdd] = useState(false);
  const { t } = useTranslation();
  const {
    transactions,
    getTotalIncome,
    getTotalExpenses,
    getBalance,
    // FIX #8: real month-over-month delta
    getMonthDelta,
    getNetWorthDelta,
    retrySync
  } = useTransactionStore();
  const { user } = useAuthStore();
  const { getNetWorth } = usePortfolioStore();
  const portfolioTotal = getNetWorth();

  const income   = getTotalIncome();
  const expenses = getTotalExpenses();
  const balance  = getBalance();
  // FIX #8: calculate real deltas instead of hardcoded numbers
  const incomeDelta  = getMonthDelta('income');
  const expenseDelta = getMonthDelta('expense');
  const balanceDelta = getMonthDelta('balance');
  const nwDelta      = getNetWorthDelta(portfolioTotal);

  const recent = [...transactions]
    .filter(t => t.status !== 'voided' && t.status !== 'reversal')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <main className="page">
      <h1 className="sr-only">Dashboard - Financial Overview</h1>
      
      {/* Page Header */}
      <header className="page-header">
        <div />
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAdd(true)} 
          aria-label="Add new transaction"
        >
          <Plus size={16} aria-hidden="true" /> {t('add_transaction')}
        </button>
      </header>

        <div className="stats-grid">
          <StatCard
            label="Net Worth"
            value={formatCurrency(portfolioTotal + balance)}
            icon={TrendingUp}
            accent="#8b5cf6"
            trend={nwDelta}
            sub="Portfolio + Cash"
            delay={0}
          />
          <StatCard
            label={t('net_balance')}
            value={formatCurrency(balance)}
            icon={Wallet}
            accent="#7c3aed"
            trend={balanceDelta}
            sub={t('vs_last_month')}
            delay={0.07}
          />
          <StatCard
            label={t('total_income')}
            value={formatCurrency(income)}
            icon={TrendingUp}
            accent="#22c55e"
            trend={incomeDelta}
            sub={t('vs_last_month')}
            delay={0.14}
          />
          <StatCard
            label={t('total_expenses')}
            value={formatCurrency(expenses)}
            icon={TrendingDown}
            accent="#ef4444"
            trend={expenseDelta}
            sub={t('vs_last_month')}
            delay={0.21}
          />
        </div>

        {/* Charts Row */}
        <div className="charts-grid">
          <motion.div className="card" {...fadeUp(0.1)}>
            <div className="card-header">
              <h2 className="card-title">{t('spending_by_category')}</h2>
              <span className="card-subtitle">{t('all_time')}</span>
            </div>
            <SpendingPieChart />
          </motion.div>

          <motion.div className="card" {...fadeUp(0.15)}>
            <div className="card-header">
              <h2 className="card-title">{t('income_vs_expenses')}</h2>
              <span className="card-subtitle">{t('last_6_months')}</span>
            </div>
            <TrendChart />
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div className="card" {...fadeUp(0.2)}>
          <div className="card-header">
            <h2 className="card-title">{t('recent_transactions')}</h2>
            <Link to="/transactions" className="card-link" aria-label="View all transactions">
              {t('view_all')} <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state" role="status">
              <p>No transactions yet. Add your first one!</p>
            </div>
          ) : (
            <div className="txn-list" role="list">
              {recent.map((t, i) => (
                <motion.div
                  key={t.id}
                  className="txn-row"
                  role="listitem"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <div className="txn-info">
                    <div className="txn-desc">
                      {t.description}
                      {t.status === 'pending' && (
                        <span className="status-dot syncing" title="Syncing..." aria-label="Syncing"></span>
                      )}
                      {t.status === 'failed' && (
                        <button 
                          className="status-dot failed" 
                          title="Sync failed. Click to retry."
                          onClick={() => retrySync(t.id, user?.id)}
                          aria-label="Sync failed. Click to retry."
                        >
                          !
                        </button>
                      )}
                    </div>
                    <div className="txn-meta">
                      <Badge categoryId={t.categoryId} size="sm" />
                      <span className="txn-date">{formatDate(t.date)}</span>
                    </div>
                  </div>
                  <div className={`txn-amount ${t.type === 'income' ? 'income' : 'expense'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amountCents)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('add_transaction')}>
        <TransactionForm onClose={() => setShowAdd(false)} />
      </Modal>
    </main>
  );
}
