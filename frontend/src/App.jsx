import React, { useState } from 'react';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import OtpModal from './components/OtpModal';
import CryptoInspectModal from './components/CryptoInspectModal';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SecureStorage from './pages/SecureStorage';
import RiskMonitor from './pages/RiskMonitor';
import RiskSimulator from './pages/RiskSimulator';
import SecurityActivity from './pages/SecurityActivity';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const MainLayout = () => {
  const { user, activeTab, loading } = useSecurity();
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 animate-pulse flex items-center justify-center shadow-glow-cyan" />
          <div className="absolute w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
          Initializing CloudCrypt Cryptosystem...
        </p>
      </div>
    );
  }

  // If unauthenticated, show premium login screen
  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  // Router switch based on activeTab
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'storage':
        return <SecureStorage />;
      case 'risk-monitor':
        return <RiskMonitor />;
      case 'simulator':
        return <RiskSimulator />;
      case 'activity':
        return <SecurityActivity />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#E6F1FF] flex relative overflow-x-hidden cyber-grid-bg">
      {/* Background radial glow */}
      <div className="fixed top-0 left-64 right-0 h-96 cyber-radial-overlay pointer-events-none z-0" />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 min-w-0 z-10">
        {/* Top Navbar */}
        <Navbar onSearch={(query) => setGlobalSearch(query)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-8 mt-16 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Modals */}
      <OtpModal />
      <CryptoInspectModal />
    </div>
  );
};

function App() {
  return (
    <SecurityProvider>
      <MainLayout />
    </SecurityProvider>
  );
}

export default App;
