import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ShieldCheck,
  ShieldAlert,
  User,
  LogOut,
  ChevronDown,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

const Navbar = ({ onSearch }) => {
  const { session, notifications, user, handleLogout, handleQuickLogin, setActiveTab } = useSecurity();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHighRisk = session.risk_level === 'HIGH';
  const isMedRisk = session.risk_level === 'MEDIUM';

  const riskBadgeClass = isHighRisk
    ? 'bg-red-500/15 text-red-400 border-red-500/40 shadow-glow-danger'
    : isMedRisk
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-glow-warning'
    : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 shadow-glow-cyan';

  return (
    <header className="h-16 bg-[#0B1020]/80 backdrop-blur-md border-b border-[#1E293B] fixed top-0 right-0 left-64 z-20 px-8 flex items-center justify-between">
      {/* Search Input */}
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search encrypted files, security logs, or SHA-256 hashes..."
          onChange={(e) => onSearch && onSearch(e.target.value)}
          className="w-full bg-[#111827]/90 text-sm text-slate-200 placeholder-slate-500 pl-10 pr-12 py-2 rounded-xl border border-[#1E293B] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-[#0B1020] border border-slate-700 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-5">
        {/* Real-time Shield Indicator */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#111827]/80 border border-[#1E293B]">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
          </div>
          <span className="text-xs font-mono tracking-wider text-slate-300">
            SHIELD ACTIVE <span className="text-slate-500">//</span>{' '}
            <span className="text-cyan-400">ADAPTIVE PROTOCOL v2.4</span>
          </span>
        </div>

        {/* Live Risk Badge */}
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold transition-all hover:scale-105 ${riskBadgeClass}`}
          title="Click to open Risk Simulator"
        >
          {isHighRisk ? (
            <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          <span>{session.risk_level} RISK ({session.risk_score})</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-[#111827] rounded-xl border border-transparent hover:border-[#1E293B] transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                  Security Notifications
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {notifications.length} Alerts
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#1E293B]/50">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-[#111827]/70 transition-colors">
                    <div className="flex items-start space-x-2.5">
                      {n.type === 'danger' ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      ) : n.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs text-slate-200 font-sans leading-relaxed">{n.text}</p>
                        <span className="text-[10px] font-mono text-slate-500">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Demo Switcher */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-[#111827] border border-transparent hover:border-[#1E293B] transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-mono font-bold text-xs shadow-glow-cyan">
              {user ? user.name.slice(0, 2).toUpperCase() : 'SE'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200 font-sans leading-none">
                {user ? user.name : 'Alex Mercer'}
              </p>
              <p className="text-[10px] font-mono text-cyan-400/90 mt-1">
                {user ? user.role : 'Lead Security Architect'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-[#1E293B]">
                <p className="text-xs font-semibold text-slate-200 font-sans">{user?.name || 'Alex Mercer'}</p>
                <p className="text-[11px] font-mono text-slate-400">{user?.email || 'secops@cloudcrypt.io'}</p>
                <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  IP: {session.last_ip}
                </div>
              </div>

              {/* Quick PBL Demo Presets */}
              <div className="p-2 border-b border-[#1E293B]">
                <p className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Demo Switcher
                </p>
                <button
                  onClick={() => {
                    handleQuickLogin('low');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-cyan-400 hover:bg-[#111827] rounded-lg font-mono flex items-center justify-between"
                >
                  <span>Preset: Low Risk</span>
                  <span className="text-[10px] text-cyan-400">AES-128</span>
                </button>
                <button
                  onClick={() => {
                    handleQuickLogin('medium');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-amber-400 hover:bg-[#111827] rounded-lg font-mono flex items-center justify-between"
                >
                  <span>Preset: Medium Risk</span>
                  <span className="text-[10px] text-amber-400">AES-192</span>
                </button>
                <button
                  onClick={() => {
                    handleQuickLogin('high');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-red-400 hover:bg-[#111827] rounded-lg font-mono flex items-center justify-between"
                >
                  <span>Preset: High Risk</span>
                  <span className="text-[10px] text-red-400">AES-256</span>
                </button>
              </div>

              <div className="p-1.5">
                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-950/30 rounded-lg flex items-center space-x-2 transition-colors font-mono"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Terminate Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
