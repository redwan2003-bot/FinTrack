import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout         from './components/layout/Layout';
import Dashboard      from './pages/Dashboard';
import Transactions   from './pages/Transactions';
import Budgets        from './pages/Budgets';
import Analytics      from './pages/Analytics';
import Portfolio      from './pages/Portfolio';
import Reconciliation from './pages/Reconciliation';
import Forecast       from './pages/Forecast';
import Auth           from './pages/Auth';
import { useAuthStore } from './store/useAuthStore';
// FIX #13: ErrorBoundary wraps each page
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

import { useLanguageStore } from './store/useLanguageStore';
import { useEffect } from 'react';

// Wraps any page in an ErrorBoundary so a crash is isolated to that page
const SafePage = ({ element }) => (
  <ErrorBoundary>{element}</ErrorBoundary>
);

export default function App() {
  const lang = useLanguageStore(state => state.lang);

  useEffect(() => {
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#e8eaf6',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1a1a2e' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' } },
          ariaProps: {
            role: 'status',
            'aria-live': 'polite',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Auth />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"      element={<SafePage element={<Dashboard />} />} />
          <Route path="transactions"   element={<SafePage element={<Transactions />} />} />
          <Route path="budgets"        element={<SafePage element={<Budgets />} />} />
          <Route path="reports"        element={<SafePage element={<Analytics />} />} />
          <Route path="portfolio"      element={<SafePage element={<Portfolio />} />} />
          <Route path="reconciliation" element={<SafePage element={<Reconciliation />} />} />
          <Route path="forecast"       element={<SafePage element={<Forecast />} />} />
        </Route>

        {/* FIX #13: 404 catch-all */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-[var(--text-1)] mb-4">404</h1>
              <p className="text-[var(--text-2)] mb-6">Page not found</p>
              <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}
