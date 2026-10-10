import React, { useEffect, useState } from 'react';
import {
  Shield,
  Lock,
  HardDrive,
  AlertTriangle,
  Sliders,
  ArrowUpRight,
  FileText,
  Activity,
  CheckCircle,
  ExternalLink,
  Info,
  Key,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import RadialRiskGauge from '../components/RadialRiskGauge';
import { api } from '../services/api';

const Dashboard = () => {
  const { session, setActiveTab, openInspection, triggerOtpChallenge, addNotification } = useSecurity();
  const [stats, setStats] = useState({
    total_files: 5,
    protected_files: 5,
    total_size_bytes: 49000000,
    total_events: 11,
    actions_count: 7
  });
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, filesRes, activityRes] = await Promise.all([
        api.getAnalytics(),
        api.listFiles(),
        api.getActivityLogs('', '', 6)
      ]);

      if (analyticsRes.success) {
        setStats(analyticsRes.metrics);
      }
      if (filesRes.success) {
        setRecentFiles(filesRes.files.slice(0, 4));
      }
      if (activityRes.success) {
        setRecentEvents(activityRes.events.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [session.risk_score]);

  const handleDownload = async (file) => {
    if (file.requires_otp && !session.otp_verified) {
      triggerOtpChallenge(async () => {
        window.location.href = api.downloadFileUrl(file.id);
      });
      return;
    }
    window.location.href = api.downloadFileUrl(file.id);
  };

  const isHigh = session.risk_level === 'HIGH';
  const isMed = session.risk_level === 'MEDIUM';

  const riskBadgeClass = isHigh
    ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : isMed
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-panel rounded-2xl border border-[#1E293B]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              OPERATIONAL SOC DASHBOARD
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-sans mt-1">
            Adaptive Security Control Console
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Active Endpoint: <span className="text-slate-300 font-semibold">{session.device_name}</span> ({session.last_ip})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadDashboardData}
            className="p-2.5 bg-[#111827] hover:bg-[#1E293B] text-slate-300 rounded-xl border border-[#1E293B] transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className="py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-glow-cyan flex items-center space-x-2"
          >
            <Sliders className="w-4 h-4" />
            <span>Launch Risk Simulator</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Risk Score */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1E293B] relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Risk Score</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {session.risk_score}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${riskBadgeClass}`}>
              {session.risk_level} RISK
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {session.risk_level === 'LOW' ? 'Normal' : session.risk_level === 'MEDIUM' ? 'Elevated' : 'Critical'}
            </span>
          </div>
        </div>

        {/* Stat 2: Active Encryption Level */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1E293B] relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Dynamic Cipher</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-300">
              {session.policy?.encryption || 'AES-128'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Mode:</span>
            <span className="text-slate-200">GCM Authenticated</span>
          </div>
        </div>

        {/* Stat 3: Protected Files */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1E293B] relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Protected Vault</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {stats.total_files}
            </span>
            <span className="text-xs font-mono text-slate-400">Files</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Status:</span>
            <span className="text-emerald-400">100% Encrypted</span>
          </div>
        </div>

        {/* Stat 4: Security Alerts */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1E293B] relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Security Interventions</span>
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {stats.actions_count || stats.total_events}
            </span>
            <span className="text-xs font-mono text-slate-400">Logged</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Active Defense:</span>
            <span className="text-cyan-400">Nominal</span>
          </div>
        </div>
      </div>

      {/* CENTRAL HERO SECTION: "Adaptive Security Status" */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Gauge Visual */}
          <div className="flex flex-col items-center justify-center p-4">
            <RadialRiskGauge score={session.risk_score} level={session.risk_level} size={240} />
            <p className="mt-3 text-xs font-mono text-slate-400 text-center">
              Dynamic Real-Time Session Assessment
            </p>
          </div>

          {/* Center: Detailed Security Breakdown */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                Central Orchestration Engine
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Adaptive Security Status
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                CloudCrypt dynamically recalculates session vulnerability metrics on every interaction, automatically scaling cryptographic strength and access controls without requiring manual administrator intervention.
              </p>
            </div>

            {/* Matrix of Current Level Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Risk Score
                </span>
                <span className="text-base font-mono font-bold text-white">
                  {session.risk_score} / 100
                </span>
              </div>

              <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Risk Level
                </span>
                <span className={`text-base font-mono font-bold ${isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {session.risk_level}
                </span>
              </div>

              <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Encryption
                </span>
                <span className="text-base font-mono font-bold text-cyan-300">
                  {session.policy?.encryption || 'AES-128'}
                </span>
              </div>

              <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Session Status
                </span>
                <span className={`text-base font-mono font-bold ${isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {session.policy?.session_status || 'Trusted'}
                </span>
              </div>
            </div>

            {/* Visual 3-Tier Policy Progress Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                <span>Cryptographic Scaling Framework</span>
                <span className="text-cyan-300 font-bold">
                  {session.policy?.status_label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B1020] rounded-xl border border-[#1E293B]">
                <div className={`p-2 rounded-lg text-center border transition-all ${
                  session.risk_level === 'LOW'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-glow-cyan'
                    : 'bg-[#111827] border-transparent text-slate-500'
                }`}>
                  <span className="text-[10px] font-mono block font-bold">LOW (0-30)</span>
                  <span className="text-[9px] font-mono block">AES-128 • Normal</span>
                </div>

                <div className={`p-2 rounded-lg text-center border transition-all ${
                  session.risk_level === 'MEDIUM'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-glow-warning'
                    : 'bg-[#111827] border-transparent text-slate-500'
                }`}>
                  <span className="text-[10px] font-mono block font-bold">MEDIUM (31-70)</span>
                  <span className="text-[9px] font-mono block">AES-192 • Enhanced</span>
                </div>

                <div className={`p-2 rounded-lg text-center border transition-all ${
                  session.risk_level === 'HIGH'
                    ? 'bg-red-500/20 border-red-400 text-red-300 shadow-glow-danger'
                    : 'bg-[#111827] border-transparent text-slate-500'
                }`}>
                  <span className="text-[10px] font-mono block font-bold">HIGH (71-100)</span>
                  <span className="text-[9px] font-mono block">AES-256 • OTP Lock</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Risk Factors Detected & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Risk Factors Detected Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1E293B]">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Risk Factors Detected
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {session.detected_factors?.length || 0} Active
            </span>
          </div>

          {session.detected_factors && session.detected_factors.length > 0 ? (
            <div className="space-y-3">
              {session.detected_factors.map((factor) => (
                <div
                  key={factor.id}
                  className="p-3 rounded-xl bg-[#111827] border border-[#1E293B] hover:border-cyan-500/30 transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{factor.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{factor.category}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                    +{factor.weight}
                  </span>
                </div>
              ))}
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl mt-4 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Total Computed Risk:</span>
                <span className="font-bold text-cyan-400">{session.risk_score} / 100</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-300">No Anomalies Detected</p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Device and IP match trusted baseline. Baseline noise: {session.risk_score} pts.
              </p>
              <button
                onClick={() => setActiveTab('simulator')}
                className="mt-4 px-3 py-1.5 bg-[#111827] hover:bg-[#1E293B] border border-[#1E293B] text-cyan-400 text-xs font-mono rounded-lg transition-colors"
              >
                Simulate Threat Vectors
              </button>
            </div>
          )}
        </div>

        {/* Right: Recent Files & Audit Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Files Table Preview */}
          <div className="glass-panel p-5 rounded-2xl border border-[#1E293B]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
              <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                Protected Vault Files
              </h3>
              <button
                onClick={() => setActiveTab('storage')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View All ({stats.total_files})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-400 font-mono text-[11px]">
                    <th className="pb-2.5">File Name</th>
                    <th className="pb-2.5">Risk Level</th>
                    <th className="pb-2.5">Cipher Tier</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60 font-sans">
                  {recentFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-[#111827]/60 transition-colors">
                      <td className="py-2.5 pr-2 font-medium text-slate-200 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{file.original_name}</span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] border ${
                          file.risk_level === 'HIGH'
                            ? 'text-red-400 bg-red-500/10 border-red-500/30'
                            : file.risk_level === 'MEDIUM'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                            : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                        }`}>
                          {file.risk_level}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-cyan-300">
                        {file.encryption_algo}
                      </td>
                      <td className="py-2.5">
                        <span className="text-[11px] text-slate-300">
                          {file.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-1.5">
                        <button
                          onClick={() => openInspection(file.id)}
                          className="p-1 hover:text-cyan-300 text-slate-400 transition-colors"
                          title="Inspect Cryptography"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1 hover:text-cyan-300 text-slate-400 transition-colors"
                          title={file.requires_otp ? 'Download (Requires OTP)' : 'Download'}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
