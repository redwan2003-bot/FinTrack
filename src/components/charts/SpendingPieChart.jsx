import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTransactionStore } from '../../store/useTransactionStore';
import { getCategoryById } from '../../utils/categories';
import { formatCurrency } from '../../utils/currency';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SpendingPieChart() {
  const { transactions } = useTransactionStore();
  const expenses = transactions.filter((t) => t.type === 'expense');

  const dataMap = {};
  expenses.forEach((t) => {
    dataMap[t.categoryId] = (dataMap[t.categoryId] || 0) + t.amountCents;
  });

  const entries = Object.entries(dataMap)
    .map(([id, value]) => ({
      label: getCategoryById(id).name,
      value,
      color: getCategoryById(id).color,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const data = {
    labels: entries.map(e => e.label),
    datasets: [
      {
        data: entries.map(e => e.value / 100),
        backgroundColor: entries.map(e => e.color),
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        hoverOffset: 12,
      },
    ],
  };

  const options = {
    cutout: '72%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          font: { size: 12, weight: 500 },
        },
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleFont: { size: 12 },
        bodyFont: { size: 14, weight: 'bold' },
        padding: 12,
        cornerRadius: 10,
        /**
         * FIX #FIN-01: Standardized Currency Contract.
         * Datasets store raw BDT float values (converted from cents).
         * Tooltips convert back to cents for formatCurrency().
         */
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.raw * 100)}`,
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="chart-wrap" style={{ height: 260 }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
