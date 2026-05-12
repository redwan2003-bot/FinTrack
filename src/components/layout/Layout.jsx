import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header  from './Header';
import { Waves } from '../ui/Waves';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
