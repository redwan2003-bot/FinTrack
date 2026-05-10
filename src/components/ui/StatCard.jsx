import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, sub, trend, icon: Icon, accent = 'var(--primary)', delay = 0 }) {
  const isPositive = trend >= 0;
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ '--accent': accent }}
    >
      <div className="stat-card-top">
        <div className="stat-icon" style={{ background: `${accent}18`, color: accent }}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <div className={`stat-trend ${isPositive ? 'up' : 'down'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub text-[10px] mt-1 opacity-70" style={{ fontSize: '11px', color: 'var(--text-3)' }}>{sub}</div>}
    </motion.div>
  );
}
