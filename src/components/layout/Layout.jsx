import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header  from './Header';
import { Waves } from '../ui/Waves';
import { useAuthStore } from '../../store/useAuthStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const fetchTransactions = useTransactionStore(s => s.fetchTransactions);
  const fetchBudgets = useBudgetStore(s => s.fetchBudgets);
  const fetchAccounts = usePortfolioStore(s => s.fetchAccounts);

  useEffect(() => {
    if (user?.id) {
      fetchTransactions(user.id);
      fetchBudgets(user.id);
      fetchAccounts(user.id);
    }
  }, [user?.id, fetchTransactions, fetchBudgets, fetchAccounts]);

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Waves 
        strokeColor="rgba(124, 58, 237, 0.1)" 
        backgroundColor="transparent" 
        style={{ position: 'fixed', zIndex: -1 }}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main id="main-content" className="page-content">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-mobile-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}
