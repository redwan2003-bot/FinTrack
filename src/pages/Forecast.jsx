import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { formatCurrency, fromCents } from '../utils/currency';
import { format, subMonths, parseISO, isValid, addMonths } from 'date-fns';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const SCENARIO_MULTIPLIERS = { optimistic: 1.10, base: 1.0, pessimistic: 0.90 };

function MonthlyBar({ label, income, expense, maxVal }) {
  const incomeH = maxVal > 0 ? (income / maxVal) * 100 : 0;
  const expenseH = maxVal > 0 ? (expense / maxVal) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className="w-full flex items-end justify-center gap-1" style={{ height: 100 }}>
        <div className="flex-1 rounded-t" style={{ height: `${incomeH}%`, background: '#22c55e', minHeight: 2 }} title={`Income: ${formatCurrency(income * 100)}`} />
        <div className="flex-1 rounded-t" style={{ height: `${expenseH}%`, background: '#7c3aed', minHeight: 2 }} title={`Expense: ${formatCurrency(expense * 100)}`} />
      </div>
      <span className="text-[10px] text-[var(--text-muted)] truncate w-full text-center">{label}</span>
    </div>
  );
}

export default function Forecast() {
  const { transactions } = useTransactionStore();
  const [scenario, setScenario] = useState('base');
  const [goal, setGoal] = useState('');
  const mult = SCENARIO_MULTIPLIERS[scenario];

  // Active transactions only
  const active = transactions.filter(t => t.status !== 'voided' && t.status !== 'reversal');

  // Build last 3 months actuals
  const last3 = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const ref = subMonths(new Date(), i + 1);
      const mo = ref.getMonth();
      const yr = ref.getFullYear();
      const inMo = (t) => {
        if (!t.date) return false;
        const d = parseISO(t.date);
        return isValid(d) && d.getMonth() === mo && d.getFullYear() === yr;
      };
      const income  = active.filter(t => t.type === 'income'  && inMo(t)).reduce((s, t) => s + fromCents(t.amountCents), 0);
      const expense = active.filter(t => t.type === 'expense' && inMo(t)).reduce((s, t) => s + fromCents(t.amountCents), 0);
      return { label: format(ref, 'MMM'), income, expense };
    }).reverse();
  }, [active]);

  const avgIncome  = last3.reduce((s, m) => s + m.income, 0) / 3;
  const avgExpense = last3.reduce((s, m) => s + m.expense, 0) / 3;

  // Project next 6 months
  const projections = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const ref = addMonths(new Date(), i + 1);
      const projIncome  = avgIncome  * mult;
      const projExpense = avgExpense * (i === 0 ? 1 : 1 + i * 0.01); // slight expense creep
      return {
        label: format(ref, 'MMM yy'),
        income:  projIncome,
        expense: projExpense,
        net:     projIncome - projExpense,
        cumNet:  0, // set below
      };
    });
  }, [avgIncome, avgExpense, mult]);

  // Cumulative net savings
  let cum = fromCents(
    active.filter(t => t.type === 'income').reduce((s, t) => s + t.amountCents, 0) -
    active.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0)
  );
  projections.forEach(p => { cum += p.net; p.cumNet = cum; });

  const maxVal = Math.max(...last3.map(m => Math.max(m.income, m.expense)), ...projections.map(p => Math.max(p.income, p.expense)));

  // Savings goal calculator
  const goalNum = parseFloat(goal) || 0;
  const monthlyNet = avgIncome * mult - avgExpense;
  const monthsToGoal = goalNum > 0 && monthlyNet > 0 ? Math.ceil(goalNum / monthlyNet) : null;
  const goalDate = monthsToGoal ? format(addMonths(new Date(), monthsToGoal), 'MMMM yyyy') : null;

  const scenarioColors = { optimistic: '#22c55e', base: '#7c3aed', pessimistic: '#f59e0b' };

  return (
    <div className="page">
      <div className="page-header flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Rolling Forecast</h1>
          <p className="text-[var(--text-2)] text-sm">6-month projection based on your last 3 months average</p>
        </div>

        {/* Scenario selector */}
        <div className="flex gap-1 p-1 bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.06)]" role="group" aria-label="Forecast scenario">
          {Object.keys(SCENARIO_MULTIPLIERS).map(s => (
            <button
              key={s}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${scenario === s ? 'text-white shadow-sm' : 'text-[var(--text-2)] hover:text-[var(--text-1)]'}`}
              style={{ background: scenario === s ? scenarioColors[s] : 'transparent' }}
              onClick={() => setScenario(s)}
              aria-pressed={scenario === s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat tiles */}
      <div className="reports-summary mb-6">
        {[
          { label: 'Avg Monthly Income',  value: formatCurrency(avgIncome * 100),             color: '#22c55e' },
          { label: 'Avg Monthly Expense', value: formatCurrency(avgExpense * 100),             color: '#ef4444' },
          { label: 'Projected Monthly Net', value: formatCurrency(monthlyNet * 100),           color: monthlyNet >= 0 ? '#7c3aed' : '#ef4444' },
          { label: '6-Mo Projected Net Worth', value: formatCurrency(projections.at(-1)?.cumNet * 100 || 0), color: '#06b6d4' },
        ].map((item, i) => (
          <motion.div key={item.label} className="report-tile" {...fadeUp(i * 0.07)}>
            <p className="report-tile-val" style={{ color: item.color }}>{item.value}</p>
            <p className="report-tile-label">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart: Actuals vs Projections */}
      <motion.div className="card" {...fadeUp(0.1)}>
        <div className="card-header">
          <h2 className="card-title">Cash Flow: Actuals + 6-Month Projection</h2>
          <div className="flex items-center gap-4 text-xs text-[var(--text-2)]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#22c55e] inline-block" />Income</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#7c3aed] inline-block" />Expense</span>
          </div>
        </div>
        <div className="flex gap-2 items-end mt-4 overflow-x-auto pb-2">
          {/* Actuals section */}
          <div className="flex gap-2 flex-1 min-w-[200px]">
            {last3.map((m, i) => (
              <div key={i} className="flex-1">
                <MonthlyBar label={m.label} income={m.income} expense={m.expense} maxVal={maxVal} />
              </div>
            ))}
          </div>
          {/* Divider */}
          <div className="flex flex-col items-center mx-2 pb-6">
            <div className="h-full w-px bg-[rgba(255,255,255,0.1)] flex-1" />
            <span className="text-[9px] text-[var(--text-muted)] mt-1 whitespace-nowrap">Projection</span>
          </div>
          {/* Projections section */}
          <div className="flex gap-2 flex-1 min-w-[300px]">
            {projections.map((p, i) => (
              <div key={i} className="flex-1 opacity-70">
                <MonthlyBar label={p.label} income={p.income} expense={p.expense} maxVal={maxVal} />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Monthly breakdown table */}
      <motion.div className="card mt-4" {...fadeUp(0.2)}>
        <div className="card-header">
          <h2 className="card-title">Projected Monthly Breakdown</h2>
          <span className="card-subtitle capitalize" style={{ color: scenarioColors[scenario] }}>{scenario} scenario</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm" aria-label="Monthly forecast table">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                {['Month', 'Proj. Income', 'Proj. Expense', 'Net', 'Cumulative Net'].map(h => (
                  <th key={h} className="py-2 px-3 text-xs uppercase tracking-wider text-[var(--text-2)] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projections.map((p, i) => (
                <tr key={i} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="py-2.5 px-3 font-medium text-[var(--text-1)]">{p.label}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{formatCurrency(p.income * 100)}</td>
                  <td className="py-2.5 px-3 text-red-400">{formatCurrency(p.expense * 100)}</td>
                  <td className={`py-2.5 px-3 font-semibold ${p.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(p.net * 100)}</td>
                  <td className="py-2.5 px-3 text-purple-400 font-semibold">{formatCurrency(p.cumNet * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Savings Goal Calculator */}
      <motion.div className="card mt-4" {...fadeUp(0.3)}>
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2"><Target size={18} aria-hidden="true" /> Savings Goal Calculator</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mt-2">
          <div className="form-group flex-1">
            <label htmlFor="savings-goal" className="form-label">I want to save (BDT)</label>
            <div className="amount-input-wrap">
              <span className="currency-symbol">৳</span>
              <input
                id="savings-goal"
                className="form-input amount-input"
                type="number"
                placeholder="e.g. 100000"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              />
            </div>
          </div>
          {goalNum > 0 && (
            <div
              className="flex-1 p-4 rounded-xl border"
              style={{
                background: monthlyNet > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                borderColor: monthlyNet > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
              }}
              role="status"
              aria-live="polite"
            >
              {monthlyNet > 0 && monthsToGoal ? (
                <>
                  <p className="text-xs text-[var(--text-2)]">At {formatCurrency(monthlyNet * 100)}/month net savings</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">
                    Reach goal in <span className="text-white">{monthsToGoal} months</span>
                  </p>
                  <p className="text-sm text-[var(--text-2)] flex items-center gap-1 mt-0.5">
                    <Calendar size={13} aria-hidden="true" /> Target: <span className="text-[var(--text-1)] font-medium ml-1">{goalDate}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle size={14} aria-hidden="true" />
                  Current spending exceeds income. Reduce expenses to meet this goal.
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
