import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart3,
  Wallet, TrendingUp, Sparkles, X, Briefcase, CheckSquare, LineChart
} from 'lucide-react';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import { useTranslation } from '../../lib/i18n';
import { useAuthStore } from '../../store/useAuthStore';

const NAV = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/transactions',   icon: ArrowLeftRight,  label: 'Transactions'  },
  { to: '/reconciliation', icon: CheckSquare,     label: 'Reconciliation'},
  { to: '/budgets',        icon: Target,          label: 'Budgets'       },
  { to: '/reports',        icon: BarChart3,       label: 'Reports'       },
  { to: '/forecast',       icon: LineChart,       label: 'Forecast'      },
  { to: '/portfolio',      icon: Briefcase,       label: 'Portfolio'     },
];




export default function Sidebar({ isOpen, onClose }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  // Dynamic initials from user name
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';



  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Wallet size={18} color="#fff" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div>
          <span className="sidebar-logo-text">Fin<span>Track</span></span>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -2 }}>Personal Finance</p>
        </div>
        <button className="sidebar-mobile-close" onClick={onClose} aria-label="Close navigation">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" aria-label="App navigation">
        <p className="nav-section-label">{t('menu')}</p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={onClose}
            aria-label={label}
          >
            <Icon size={17} aria-hidden="true" />
            {t(label.toLowerCase())}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => toast('Profile settings — open Header > Profile')} role="button" tabIndex={0} aria-label="User profile">
          <div className="sidebar-avatar" aria-hidden="true">{initials}</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || 'User'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email || ''}</p>
          </div>
          <TrendingUp size={14} color="var(--success)" style={{ marginLeft: 'auto' }} aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}

