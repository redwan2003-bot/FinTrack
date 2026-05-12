import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTransactionStore } from '../../store/useTransactionStore';
import { formatCurrency, fromCents } from '../../utils/currency';
import { getLast6MonthLabels } from '../../utils/dateUtils';
import { format, parseISO, isValid } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function TrendChart() {
  const { transactions } = useTransactionStore();
  const labels = getLast6MonthLabels();

  const dataPoints = labels.map((label) => {
    const [mon, yr] = label.split(' ');
    
    const income = transactions
      .filter((t) => {
        if (!t.date || t.type !== 'income') return false;
        const d = parseISO(t.date);
        return isValid(d) && format(d, 'MMM') === mon && format(d, 'yyyy') === yr;
      })
      .reduce((s, t) => s + fromCents(t.amountCents), 0);

    const expense = transactions
      .filter((t) => {
        if (!t.date || t.type !== 'expense') return false;
        const d = parseISO(t.date);
        return isValid(d) && format(d, 'MMM') === mon && format(d, 'yyyy') === yr;
      })
      .reduce((s, t) => s + fromCents(t.amountCents), 0);

    return { label: mon, income, expense };
  });

  const chartData = {
    labels: dataPoints.map(d => d.label),
    datasets: [
      {
        fill: true,
        label: 'Income',
        data: dataPoints.map(d => d.income),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#22c55e',
      },
      {
        fill: true,
        label: 'Expenses',
        data: dataPoints.map(d => d.expense),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#7c3aed',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#94a3b8',
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        padding: 12,
        cornerRadius: 10,
        /**
         * FIX #FIN-01: Standardized Currency Contract.
         * Datasets store raw BDT float values (converted from cents).
         * Tooltips convert back to cents for formatCurrency().
         */
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw * 100)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (value) => `৳${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`,
        },
      },
    },
  };

  return (
    <div className="chart-wrap" style={{ height: 260 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
