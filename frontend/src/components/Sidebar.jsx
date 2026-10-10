import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Cloud,
  Activity,
  Sliders,
  History,
  BarChart3,
  Settings,
  Lock,
  ChevronRight,
  Radio,
  Key
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

const Sidebar = () => {
  const { activeTab, setActiveTab, session } = useSecurity();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'storage', label: 'Secure Storage', icon: Cloud },
    { id: 'risk-monitor', label: 'Risk Monitor', icon: Activity },
    { id: 'simulator', label: 'Risk Simulator', icon: Sliders, badge: 'PBL Demo' },
    { id: 'activity', label: 'Security Activity', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isHighRisk = session.risk_level === 'HIGH';
  const isMedRisk = session.risk_level === 'MEDIUM';

  const riskBorder = isHighRisk
    ? 'border-red-500/30 bg-red-950/20'
    : isMedRisk
    ? 'border-amber-500/30 bg-amber-950/20'
    : 'border-cyan-500/30 bg-cyan-950/20';

  const cipherPillColor = isHighRisk
    ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : isMedRisk
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

  return (
    <aside className="w-64 bg-[#0B1020]/90 backdrop-blur-xl border-r border-[#1E293B] flex flex-col justify-between h-screen fixed left-0 top-0 z-30 transition-all select-none">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-[#1E293B]/70 flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-glow-cyan">
            <Shield className="w-5 h-5 text-white" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                Cloud<span className="text-cyan-400">Crypt</span>
              </span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-cyan-400/80 font-medium">
              Adaptive Security Engine
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111827]/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 tracking-wider">
                    {item.badge}
                  </span>
                )}
                {isActive && !item.badge && (
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Defense Telemetry Widget in Sidebar */}
      <div className="p-4 border-t border-[#1E293B]/70">
        <div className={`p-3.5 rounded-xl border ${riskBorder} transition-all`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              Dynamic Cipher
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${cipherPillColor}`}>
              {session.policy?.encryption || 'AES-128'}
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs text-slate-300 mb-2">
            <span>Risk Score:</span>
            <span className="font-mono font-bold">{session.risk_score} / 100</span>
          </div>

          <button
            onClick={() => setActiveTab('simulator')}
            className="w-full mt-1 py-1.5 px-2 bg-[#111827] hover:bg-[#1E293B] text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            Adjust Risk Simulator
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
