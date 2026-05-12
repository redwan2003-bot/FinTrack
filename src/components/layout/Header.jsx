import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, User, Settings, LogOut, CheckCircle, Menu, Globe, Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from '../../lib/i18n';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useAuthStore } from '../../store/useAuthStore';
import Modal from '../ui/Modal';

const PAGE_TITLES = {
  '/dashboard':      { title: 'Dashboard',      subtitle: 'Your financial overview at a glance'           },
  '/transactions':   { title: 'Transactions',   subtitle: 'Track every dollar in and out'                 },
  '/budgets':        { title: 'Budgets',         subtitle: 'Set limits, stay in control'                   },
  '/reports':        { title: 'Reports',         subtitle: 'Insights into your spending patterns'          },
  '/forecast':       { title: 'Forecast',        subtitle: '6-month rolling projection with scenario planning' },
  '/reconciliation': { title: 'Reconciliation',  subtitle: 'Match bank statements to your ledger'         },
  '/portfolio':      { title: 'Portfolio',        subtitle: 'Manage your assets, liabilities and net worth'},
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(null);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();
  const toggleLang = useLanguageStore(state => state.toggleLang);
  const lang = useLanguageStore(state => state.lang);
  const lockDate = useTransactionStore(state => state.lockDate);
  const setLockDate = useTransactionStore(state => state.setLockDate);
  const { user, logout } = useAuthStore();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);
  
  const info = PAGE_TITLES[pathname] || PAGE_TITLES['/dashboard'];
  const translatedTitle = t(info.title.toLowerCase());
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/transactions?q=${encodeURIComponent(search)}`);
      toast.success(`Searching for "${search}"`);
      setSearch('');
    }
  };

  const notifications = [
    { id: 1, text: 'Budget exceeded: Food & Dining', type: 'error', time: '2h ago' },
    { id: 2, text: 'Large income received: Freelance Project', type: 'success', time: '5h ago' },
    { id: 3, text: 'Monthly report is ready to view', type: 'info', time: '1d ago' },
  ];

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={onMenuClick} aria-label="Toggle Mobile Menu">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="header-title">{translatedTitle}</h1>
          <p className="header-subtitle">{info.subtitle}</p>
        </div>
      </div>
      
      <div className="header-right">
        {/* Search */}
        <form className="header-search" onSubmit={handleSearch}>
          <Search size={14} color="var(--text-muted)" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search transactions…" 
          />
        </form>

        {/* Language Toggle */}
        <button 
          className="header-icon-btn" 
          onClick={toggleLang}
          title={`Switch to ${lang === 'en' ? 'Bengali' : 'English'}`}
        >
          <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-handwritten)' }}>
            {lang === 'en' ? 'BN' : 'EN'}
          </span>
        </button>

        {/* Notifications */}
        <div className="dropdown-container" ref={notifRef}>
          <button 
            className={`header-icon-btn ${showNotifs ? 'active' : ''}`} 
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="View Notifications"
            aria-expanded={showNotifs}
          >
            <Bell size={18} />
            <span className="notif-dot" />
          </button>
          
          <AnimatePresence>
            {showNotifs && (
              <motion.div 
                className="dropdown-menu notif-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
              >
                <div className="dropdown-header">Notifications</div>
                <div className="notif-list">
                  {notifications.map(n => (
                    <div key={n.id} className="notif-item">
                      <div className={`notif-type-dot ${n.type}`} />
                      <div className="notif-content">
                        <p className="notif-text">{n.text}</p>
                        <p className="notif-time">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="dropdown-footer-btn">Mark all as read</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="dropdown-container" ref={profileRef}>
          <div 
            className="header-avatar" 
            onClick={() => setShowProfile(!showProfile)}
            style={{ cursor: 'pointer' }}
          >
            R
          </div>
          
          <AnimatePresence>
            {showProfile && (
              <motion.div 
                className="dropdown-menu profile-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
              >
                <div className="profile-info-box">
                  <div className="header-avatar big">R</div>
                  <div className="profile-meta">
                    <p className="profile-name">Redwan Ahmmed</p>
                    <p className="profile-email">redwan@example.com</p>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => { setShowSettingsModal('profile'); setShowProfile(false); }}><User size={16} /> My Profile</button>
                <button className="dropdown-item" onClick={() => { setShowSettingsModal('account'); setShowProfile(false); }}><Settings size={16} /> Account Settings</button>
                {/* <button className="dropdown-item pro"><CheckCircle size={16} /> Subscription</button> */}
                <div className="dropdown-divider" />
                <button className="dropdown-item logout" onClick={() => { logout(); toast.success('Logged out successfully'); }}>
                  <LogOut size={16} /> Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings Modals */}
      <Modal open={!!showSettingsModal} onClose={() => setShowSettingsModal(null)} title={showSettingsModal === 'profile' ? 'My Profile' : 'Account Settings'} width={500}>
        <div className="p-6">
          {showSettingsModal === 'profile' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-white shadow-[var(--primary-glow)]">
                  R
                </div>
                <div>
                  <button className="btn btn-outline text-xs px-3 py-1.5 h-auto">Change Avatar</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold">First Name</label>
                  <input type="text" className="form-input bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] text-white focus:border-primary" defaultValue="Redwan" />
                </div>
                <div className="form-group">
                  <label className="form-label text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold">Last Name</label>
                  <input type="text" className="form-input bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] text-white focus:border-primary" defaultValue="Ahmmed" />
                </div>
              </div>
              <div className="form-group mt-4">
                <label className="form-label text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold">Email Address</label>
                <input type="email" className="form-input bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] text-white focus:border-primary" defaultValue="redwan@example.com" />
              </div>
              <div className="form-actions mt-8 flex justify-end gap-3">
                <button className="btn btn-ghost" onClick={() => setShowSettingsModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { toast.success('Profile updated'); setShowSettingsModal(null); }}>Save Changes</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold">Theme Preference</label>
                <div className="flex bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg p-1">
                  <button onClick={() => setTheme('light')} className={`flex-1 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-primary text-white shadow-sm' : 'text-[var(--text-2)] hover:text-white'}`}><Sun size={14} /> Light</button>
                  <button onClick={() => setTheme('dark')} className={`flex-1 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-primary text-white shadow-sm' : 'text-[var(--text-2)] hover:text-white'}`}><Moon size={14} /> Dark</button>
                  <button onClick={() => setTheme('system')} className={`flex-1 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-2 ${theme === 'system' ? 'bg-primary text-white shadow-sm' : 'text-[var(--text-2)] hover:text-white'}`}><Monitor size={14} /> System</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="form-group">
                  <label className="form-label text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold">Currency Display</label>
                  <select className="form-input bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] text-[var(--text-1)] focus:border-primary">
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold">Date Format</label>
                  <select className="form-input bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] text-[var(--text-1)] focus:border-primary">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
              <div className="form-group mt-4">
                <label className="form-label text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold" title="Prevent edits to historical transactions">Ledger Lock Date</label>
                <input 
                  type="date" 
                  className="form-input bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] text-white focus:border-primary" 
                  value={lockDate || ''}
                  onChange={(e) => setLockDate(e.target.value || null)}
                />
                <p className="text-xs text-[var(--text-2)] mt-1">Transactions on or before this date cannot be added, edited, or deleted.</p>
              </div>
              <div className="mt-4 flex flex-row items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                <div>
                  <p className="text-white text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-[var(--text-2)] mt-0.5">Secure your account with 2FA</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors text-xs font-medium">Enable</button>
              </div>
              <div className="mt-4 flex flex-row items-center justify-between p-3 rounded-xl bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.1)]">
                <div>
                  <p className="text-red-400 text-sm font-medium">Danger Zone</p>
                  <p className="text-xs text-red-400/70 mt-0.5">Permanently delete your account and data</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs font-medium">Delete Account</button>
              </div>
              <div className="form-actions mt-8 flex justify-end gap-3">
                <button className="btn btn-ghost" onClick={() => setShowSettingsModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { toast.success('Account settings saved'); setShowSettingsModal(null); }}>Save Settings</button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </header>
  );
}
