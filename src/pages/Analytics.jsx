import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTransactionStore } from '../store/useTransactionStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { getCategoryById } from '../utils/categories';
import { formatCurrency, fromCents } from '../utils/currency';
import { getLast6MonthLabels, formatDate } from '../utils/dateUtils';
import { format, parseISO, isValid } from 'date-fns';
import { Download, Calculator, ChevronDown } from 'lucide-react';
import TrendChart from '../components/charts/TrendChart';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// FIX #11: Available tax years
const currentYear = new Date().getFullYear();
const TAX_YEARS = [currentYear, currentYear - 1, currentYear - 2];

export default function Reports() {
  const { transactions, getBalance } = useTransactionStore();
  const { accounts, getTotalAssets, getTotalLiabilities } = usePortfolioStore();

  // FIX #11: Tax year filter state
  const [taxYear, setTaxYear] = useState(currentYear);

  // FIX #6: categoryTotals stores amountCents (integers) — do NOT call fromCents prematurely
  const categoryTotals = useMemo(() => {
    const map = {};
    transactions
      .filter(t => t.type === 'expense' && t.status !== 'voided' && t.status !== 'reversal')
      .forEach(t => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amountCents;
      });
    return Object.entries(map)
      .map(([id, cents]) => ({
        category: getCategoryById(id).name,
        color:    getCategoryById(id).color,
        // Keep as cents — formatCurrency expects cents
        valueCents: cents,
        // Convert for chart display (chart needs plain numbers, not currency strings)
        valueDisplay: fromCents(cents),
      }))
      .sort((a, b) => b.valueCents - a.valueCents);
  }, [transactions]);

  const monthlyNet = useMemo(() => {
    const labels = getLast6MonthLabels();
    return labels.map(label => {
      const [mon, yr] = label.split(' ');
      const match = t => {
        if (!t.date) return false;
        if (t.status === 'voided' || t.status === 'reversal') return false;
        const d = parseISO(t.date);
        return isValid(d) && format(d, 'MMM') === mon && format(d, 'yyyy') === yr;
      };
      const income  = transactions.filter(t => t.type === 'income'  && match(t)).reduce((s, t) => s + fromCents(t.amountCents), 0);
      const expense = transactions.filter(t => t.type === 'expense' && match(t)).reduce((s, t) => s + fromCents(t.amountCents), 0);
      return { month: mon, net: Number((income - expense).toFixed(2)) };
    });
  }, [transactions]);

  const activeTransactions = transactions.filter(t => t.status !== 'voided' && t.status !== 'reversal');

  const totalIncome  = activeTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amountCents, 0);
  const totalExpense = activeTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0);
  const netIncome    = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0;

  const incomeByCategory = useMemo(() => {
    const map = {};
    activeTransactions.filter(t => t.type === 'income').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amountCents;
    });
    return Object.entries(map).map(([id, cents]) => ({
      category: getCategoryById(id)?.name || 'Other',
      valueCents: cents,
    })).sort((a, b) => b.valueCents - a.valueCents);
  }, [transactions]);

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw * 100)}` },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
      y: { grid: { display: false }, ticks: { color: '#94a3b8' } },
    },
  };

  const netOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        callbacks: { label: (ctx) => ` Net: ${formatCurrency(ctx.raw * 100)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
    },
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4 },
  });

  // FIX #11: Tax export now filtered by selected tax year
  const exportTaxCSV = () => {
    const taxTxns = transactions.filter(t => {
      if (t.status === 'voided' || t.status === 'reversal') return false;
      const cat = getCategoryById(t.categoryId);
      if (!cat?.taxDeductible) return false;
      if (!t.date) return false;
      const year = new Date(t.date).getFullYear();
      return year === taxYear;
    });

    if (taxTxns.length === 0) {
      toast.error(`No tax-deductible transactions found for ${taxYear}.`);
      return;
    }

    const headers = ['Date', 'Description', 'Merchant', 'Category', 'Amount (BDT)', 'Debit Account', 'Credit Account'];
    const rows = taxTxns.map(t => [
      formatDate(t.date),
      `"${t.description || ''}"`,
      `"${t.merchantName || ''}"`,
      `"${getCategoryById(t.categoryId)?.name || ''}"`,
      fromCents(t.amountCents).toFixed(2),
      t.debitAccount || '',
      t.creditAccount || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tax_report_${taxYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Tax report for ${taxYear} exported (${taxTxns.length} transactions)!`);
  };

  // FIX #11: BD tax estimate (simplified slab for individual income)
  const annualIncome = activeTransactions
    .filter(t => t.type === 'income' && t.date && new Date(t.date).getFullYear() === taxYear)
    .reduce((s, t) => s + t.amountCents, 0);
  const annualIncomeNum = fromCents(annualIncome);
  const estimatedTax = (() => {
    // Bangladesh NBR individual tax slabs 2024-25 (simplified)
    const taxFreeLimit = 350000;
    if (annualIncomeNum <= taxFreeLimit) return 0;
    let tax = 0;
    const slabs = [
      { limit: 100000, rate: 0.05 },
      { limit: 300000, rate: 0.10 },
      { limit: 400000, rate: 0.15 },
      { limit: 500000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 },
    ];
    let remaining = annualIncomeNum - taxFreeLimit;
    for (const slab of slabs) {
      const taxable = Math.min(remaining, slab.limit);
      tax += taxable * slab.rate;
      remaining -= taxable;
      if (remaining <= 0) break;
    }
    return tax;
  })();

  return (
    <div className="page">
      <div className="flex justify-end mb-6">
        {/* FIX #11: Tax year selector + export button */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="custom-select-box group">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-3)] font-black">Tax Year</span>
            <div className="relative flex items-center">
              <select
                id="tax-year-select"
                value={taxYear}
                onChange={e => setTaxYear(Number(e.target.value))}
                className="bg-transparent text-[var(--text-1)] text-sm font-bold outline-none cursor-pointer pr-4 appearance-none relative z-10"
                style={{ minWidth: '70px' }}
              >
                {TAX_YEARS.map(y => <option key={y} value={y} className="bg-[#0b0b1a]">{y}</option>)}
              </select>
              <ChevronDown size={14} className="text-[var(--text-3)] absolute right-0 pointer-events-none group-hover:text-indigo-400 transition-colors" />
            </div>
          </div>
          <button
            className="btn btn-primary bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white px-6 shadow-none h-[42px]"
            onClick={exportTaxCSV}
          >
            <Download size={16} /> <span className="hidden sm:inline">Export Tax CSV ({taxYear})</span><span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* FIX #11: BD Tax estimate card */}
      {annualIncome > 0 && (
        <motion.div
          className="tax-liability-card"
          style={{ borderColor: 'rgba(99, 102, 241, 0.2)' }}
          {...fadeUp(0)}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Calculator size={20} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-3)] font-black">BD ESTIMATED TAX LIABILITY — {taxYear}</span>
            </div>
            <p className="tax-val-large mb-4">
              ৳{estimatedTax.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-[var(--text-3)] leading-relaxed max-w-xl font-medium">
              Calculated based on NBR individual tax slabs for the {taxYear} fiscal period. 
              This estimate assumes standard deductions and should be verified by a certified tax professional.
            </p>
          </div>
          
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 flex flex-col lg:items-end relative z-10">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-3)] font-black mb-1">Total Taxable Income</span>
            <span className="text-3xl font-black text-[var(--text-1)] tracking-tight">{formatCurrency(annualIncome)}</span>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />
        </motion.div>
      )}

      <div className="reports-summary">
        {[
          { label: 'Total Income',   value: formatCurrency(totalIncome),  color: '#22c55e' },
          { label: 'Total Expenses', value: formatCurrency(totalExpense), color: '#ef4444' },
          { label: 'Net Savings',    value: formatCurrency(totalIncome - totalExpense), color: '#7c3aed' },
          { label: 'Savings Rate',   value: `${savingsRate}%`, color: '#06b6d4' },
        ].map((item, i) => (
          <motion.div key={item.label} className="report-tile" {...fadeUp(i * 0.07)}>
            <p className="report-tile-val" style={{ color: item.color }}>{item.value}</p>
            <p className="report-tile-label">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div className="card" {...fadeUp(0.1)}>
        <div className="card-header">
          <h2 className="card-title">6-Month Cash Flow</h2>
          <span className="card-subtitle">Income vs Expenses trend</span>
        </div>
        <TrendChart />
      </motion.div>

      <motion.div className="card" {...fadeUp(0.15)}>
        <div className="card-header">
          <h2 className="card-title">Spending by Category</h2>
          <span className="card-subtitle">Ranked by total amount</span>
        </div>
        <div className="chart-wrap" style={{ height: 300 }}>
          <Bar
            data={{
              labels: categoryTotals.map(c => c.category),
              datasets: [{
                // Chart.js uses raw values for display — valueDisplay is in BDT (dollars)
                data: categoryTotals.map(c => c.valueDisplay),
                backgroundColor: categoryTotals.map(c => c.color),
                borderRadius: 6,
                barThickness: 24,
              }],
            }}
            options={barOptions}
          />
        </div>
      </motion.div>

      <motion.div className="card" {...fadeUp(0.2)}>
        <div className="card-header">
          <h2 className="card-title">Monthly Net Savings</h2>
          <span className="card-subtitle">Positive = saving, negative = overspending</span>
        </div>
        <div className="chart-wrap" style={{ height: 220 }}>
          <Bar
            data={{
              labels: monthlyNet.map(m => m.month),
              datasets: [{
                data: monthlyNet.map(m => m.net),
                backgroundColor: monthlyNet.map(m => m.net >= 0 ? '#22c55e' : '#ef4444'),
                borderRadius: 6,
                maxBarThickness: 40,
              }],
            }}
            options={netOptions}
          />
        </div>
      </motion.div>

      {/* FIX #6: P&L table — use valueCents (integer cents) for formatCurrency */}
      <motion.div className="card mt-6" {...fadeUp(0.2)}>
        <div className="card-header">
          <h2 className="card-title">Income Statement (P&amp;L)</h2>
          <span className="card-subtitle">GAAP-aligned view of operations</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Income Statement">
            <tbody>
              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                <td colSpan={2} className="py-3 px-4 font-semibold text-emerald-400">Operating Revenue</td>
              </tr>
              {incomeByCategory.map(c => (
                <tr key={c.category} className="border-b border-[rgba(255,255,255,0.02)]">
                  <td className="py-2 px-8 text-sm text-[var(--text-2)]">{c.category}</td>
                  {/* FIX #6: valueCents already in cents — pass directly to formatCurrency */}
                  <td className="py-2 px-4 text-sm text-right text-[var(--text-1)]">{formatCurrency(c.valueCents)}</td>
                </tr>
              ))}
              <tr className="border-b border-[rgba(255,255,255,0.1)]">
                <td className="py-3 px-4 font-bold text-emerald-400">Total Revenue</td>
                <td className="py-3 px-4 font-bold text-right text-emerald-400">{formatCurrency(totalIncome)}</td>
              </tr>

              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                <td colSpan={2} className="py-3 px-4 font-semibold text-red-400">Operating Expenses</td>
              </tr>
              {categoryTotals.map(c => (
                <tr key={c.category} className="border-b border-[rgba(255,255,255,0.02)]">
                  <td className="py-2 px-8 text-sm text-[var(--text-2)]">{c.category}</td>
                  {/* FIX #6: valueCents is correct cents — do NOT multiply by 100 */}
                  <td className="py-2 px-4 text-sm text-right text-[var(--text-1)]">{formatCurrency(c.valueCents)}</td>
                </tr>
              ))}
              <tr className="border-b border-[rgba(255,255,255,0.1)]">
                <td className="py-3 px-4 font-bold text-red-400">Total Expenses</td>
                <td className="py-3 px-4 font-bold text-right text-red-400">{formatCurrency(totalExpense)}</td>
              </tr>

              <tr className="bg-[rgba(255,255,255,0.02)]">
                <td className="py-4 px-4 font-bold text-[var(--text-1)] text-lg">Net Income</td>
                <td className={`py-4 px-4 font-bold text-right text-lg ${netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(netIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div className="card mt-6" {...fadeUp(0.25)}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Balance Sheet">
            <tbody>
              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                <td colSpan={2} className="py-3 px-4 font-semibold text-emerald-400">Assets</td>
              </tr>
              <tr className="border-b border-[rgba(255,255,255,0.02)]">
                <td className="py-2 px-8 text-sm text-[var(--text-2)]">Cash &amp; Cash Equivalents (Ledger Balance)</td>
                <td className="py-2 px-4 text-sm text-right text-[var(--text-1)]">{formatCurrency(getBalance())}</td>
              </tr>
              {accounts.filter(a => a.type === 'asset').map(a => (
                <tr key={a.id} className="border-b border-[rgba(255,255,255,0.02)]">
                  <td className="py-2 px-8 text-sm text-[var(--text-2)]">{a.name}</td>
                  <td className="py-2 px-4 text-sm text-right text-[var(--text-1)]">{formatCurrency(a.balanceCents)}</td>
                </tr>
              ))}
              <tr className="border-b border-[rgba(255,255,255,0.1)]">
                <td className="py-3 px-4 font-bold text-emerald-400">Total Assets</td>
                <td className="py-3 px-4 font-bold text-right text-emerald-400">{formatCurrency(getBalance() + getTotalAssets())}</td>
              </tr>

              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                <td colSpan={2} className="py-3 px-4 font-semibold text-red-400">Liabilities</td>
              </tr>
              {accounts.filter(a => a.type === 'liability').length === 0 && (
                <tr className="border-b border-[rgba(255,255,255,0.02)]">
                  <td className="py-2 px-8 text-sm text-[var(--text-2)] italic">No liabilities recorded</td>
                  <td className="py-2 px-4 text-sm text-right text-[var(--text-1)]">{formatCurrency(0)}</td>
                </tr>
              )}
              {accounts.filter(a => a.type === 'liability').map(a => (
                <tr key={a.id} className="border-b border-[rgba(255,255,255,0.02)]">
                  <td className="py-2 px-8 text-sm text-[var(--text-2)]">{a.name}</td>
                  <td className="py-2 px-4 text-sm text-right text-[var(--text-1)]">{formatCurrency(a.balanceCents)}</td>
                </tr>
              ))}
              <tr className="border-b border-[rgba(255,255,255,0.1)]">
                <td className="py-3 px-4 font-bold text-red-400">Total Liabilities</td>
                <td className="py-3 px-4 font-bold text-right text-red-400">{formatCurrency(getTotalLiabilities())}</td>
              </tr>

              <tr className="bg-[rgba(255,255,255,0.02)]">
                <td className="py-4 px-4 font-bold text-[var(--text-1)] text-lg">Owner's Equity (Net Worth)</td>
                <td className="py-4 px-4 font-bold text-right text-lg text-purple-400">
                  {formatCurrency((getBalance() + getTotalAssets()) - getTotalLiabilities())}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
