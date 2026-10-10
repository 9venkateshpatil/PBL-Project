import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  Activity,
  HardDrive,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useSecurity } from '../context/SecurityContext';

const Analytics = () => {
  const { session } = useSecurity();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [session.risk_score]);

  const metrics = data?.metrics || {
    total_files: 5,
    protected_files: 5,
    total_size_bytes: 49000000,
    total_events: 11,
    security_actions_taken: 7,
    low_risk_sessions: 28,
    medium_risk_sessions: 14,
    high_risk_sessions: 5,
  };

  const riskDist = data?.risk_distribution || { LOW: 2, MEDIUM: 1, HIGH: 2 };
  const encDist = data?.encryption_distribution || { 'AES-128': 2, 'AES-192': 1, 'AES-256': 2 };

  const totalFilesCount = (riskDist.LOW + riskDist.MEDIUM + riskDist.HIGH) || 1;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 glass-panel rounded-2xl border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              TELEMETRY & CRYPTOMETRICS
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              AUDIT v2.4
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-sans mt-1">
            Security Intelligence & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            System-wide operational metrics, cipher allocation breakdown, and historical risk scoring telemetry.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2.5 bg-[#111827] hover:bg-[#1E293B] text-slate-300 rounded-xl border border-[#1E293B] transition-colors"
          title="Refresh Analytics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* KPI 1 */}
        <div className="glass-panel p-4 rounded-xl border border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Total Files
          </span>
          <span className="text-2xl font-extrabold font-mono text-white">
            {metrics.total_files}
          </span>
          <span className="text-[10px] font-mono text-cyan-400/90 block mt-1">
            100% In Vault
          </span>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel p-4 rounded-xl border border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Protected Files
          </span>
          <span className="text-2xl font-extrabold font-mono text-emerald-400">
            {metrics.protected_files}
          </span>
          <span className="text-[10px] font-mono text-emerald-400/80 block mt-1">
            Active Encrypted
          </span>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel p-4 rounded-xl border border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Low Risk Sessions
          </span>
          <span className="text-2xl font-extrabold font-mono text-cyan-300">
            {metrics.low_risk_sessions}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-1">
            AES-128 Baseline
          </span>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel p-4 rounded-xl border border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Med Risk Sessions
          </span>
          <span className="text-2xl font-extrabold font-mono text-amber-400">
            {metrics.medium_risk_sessions}
          </span>
          <span className="text-[10px] font-mono text-amber-400/80 block mt-1">
            AES-192 Stepped
          </span>
        </div>

        {/* KPI 5 */}
        <div className="glass-panel p-4 rounded-xl border border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            High Risk Sessions
          </span>
          <span className="text-2xl font-extrabold font-mono text-red-400">
            {metrics.high_risk_sessions}
          </span>
          <span className="text-[10px] font-mono text-red-400/80 block mt-1">
            AES-256 + OTP
          </span>
        </div>

        {/* KPI 6 */}
        <div className="glass-panel p-4 rounded-xl border border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Security Actions
          </span>
          <span className="text-2xl font-extrabold font-mono text-blue-400">
            {metrics.security_actions_taken}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-1">
            Policies Applied
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Risk Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              Risk Distribution
            </h3>
            <span className="text-[10px] font-mono text-slate-400">File Ledger</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  LOW Risk (0-30)
                </span>
                <span>{riskDist.LOW} files ({Math.round((riskDist.LOW / totalFilesCount) * 100)}%)</span>
              </div>
              <div className="w-full bg-[#0B1020] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500 shadow-glow-cyan"
                  style={{ width: `${(riskDist.LOW / totalFilesCount) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  MEDIUM Risk (31-70)
                </span>
                <span>{riskDist.MEDIUM} files ({Math.round((riskDist.MEDIUM / totalFilesCount) * 100)}%)</span>
              </div>
              <div className="w-full bg-[#0B1020] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-glow-warning"
                  style={{ width: `${(riskDist.MEDIUM / totalFilesCount) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  HIGH Risk (71-100)
                </span>
                <span>{riskDist.HIGH} files ({Math.round((riskDist.HIGH / totalFilesCount) * 100)}%)</span>
              </div>
              <div className="w-full bg-[#0B1020] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-red-400 h-full rounded-full transition-all duration-500 shadow-glow-danger"
                  style={{ width: `${(riskDist.HIGH / totalFilesCount) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-[#1E293B]">
            Files are classified dynamically upon upload based on active session threat telemetry.
          </p>
        </div>

        {/* Chart 2: Encryption Usage Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Encryption Usage
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Cipher Allocation</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  AES-128-GCM
                </span>
                <span>{encDist['AES-128']} files</span>
              </div>
              <div className="w-full bg-[#0B1020] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500 shadow-glow-cyan"
                  style={{ width: `${(encDist['AES-128'] / totalFilesCount) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  AES-192-GCM
                </span>
                <span>{encDist['AES-192']} files</span>
              </div>
              <div className="w-full bg-[#0B1020] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-blue-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(encDist['AES-192'] / totalFilesCount) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  AES-256-GCM
                </span>
                <span>{encDist['AES-256']} files</span>
              </div>
              <div className="w-full bg-[#0B1020] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(encDist['AES-256'] / totalFilesCount) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-[#1E293B]">
            All tiers use Galois/Counter Mode authenticated encryption with 96-bit nonces.
          </p>
        </div>

        {/* Chart 3: Security Events Telemetry */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Event Timeline Activity
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Recent Stream</span>
          </div>

          {/* Micro Histogram Bars */}
          <div className="pt-2">
            <span className="text-xs font-mono text-slate-400 block mb-3">
              Risk Fluctuations Over Last Session Events
            </span>
            <div className="h-28 flex items-end justify-between gap-1.5 p-2 bg-[#0B1020] rounded-xl border border-[#1E293B]">
              {(data?.activity_timeline || [
                { score: 15, severity: 'INFO' },
                { score: 20, severity: 'INFO' },
                { score: 22, severity: 'INFO' },
                { score: 48, severity: 'MEDIUM' },
                { score: 50, severity: 'MEDIUM' },
                { score: 82, severity: 'HIGH' },
                { score: 88, severity: 'HIGH' },
                { score: 20, severity: 'INFO' },
              ]).map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={`w-full rounded-t transition-all ${
                      item.severity === 'HIGH'
                        ? 'bg-red-400 shadow-glow-danger'
                        : item.severity === 'MEDIUM'
                        ? 'bg-amber-400 shadow-glow-warning'
                        : 'bg-cyan-400 shadow-glow-cyan'
                    }`}
                    style={{ height: `${Math.max(15, (item.score / 100) * 80)}px` }}
                  />
                  <span className="text-[8px] font-mono text-slate-400">{item.score}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-[#1E293B]">
            High peaks signify automated policy elevations to protect storage payloads.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
