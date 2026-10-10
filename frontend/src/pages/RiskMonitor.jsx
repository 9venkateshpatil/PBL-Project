import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Server,
  Fingerprint,
  Globe,
  Clock,
  Laptop,
  Download,
  MapPin,
  Lock,
  Sliders,
  CheckCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import RadialRiskGauge from '../components/RadialRiskGauge';
import { api } from '../services/api';

const RiskMonitor = () => {
  const { session, setActiveTab } = useSecurity();
  const [factorsCatalog, setFactorsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await api.getRiskFactors();
        if (res.success) {
          setFactorsCatalog(res.factors);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const isHigh = session.risk_level === 'HIGH';
  const isMed = session.risk_level === 'MEDIUM';

  const riskBadgeClass = isHigh
    ? 'text-red-400 bg-red-500/10 border-red-500/30 shadow-glow-danger'
    : isMed
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-glow-warning'
    : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 shadow-glow-cyan';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 glass-panel rounded-2xl border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              HEURISTIC THREAT DETECTION ENGINE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              ALGO v2.4
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-sans mt-1">
            Real-Time Risk Analysis Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Evaluating contextual threat signals, behavioral anomalies, and client fingerprints dynamically.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('simulator')}
          className="py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-glow-cyan flex items-center space-x-2"
        >
          <Sliders className="w-4 h-4" />
          <span>Launch Simulator Lab</span>
        </button>
      </div>

      {/* Grid: Gauge Overview & Active Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Score Gauge & Status */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] flex flex-col items-center justify-center text-center">
          <RadialRiskGauge score={session.risk_score} level={session.risk_level} size={220} />
          <div className="mt-4 space-y-1">
            <span className={`text-xs font-mono px-3 py-1 rounded-full border uppercase font-bold ${riskBadgeClass}`}>
              {session.risk_level} THREAT LEVEL
            </span>
            <p className="text-xs text-slate-400 font-mono pt-2">
              Active Defense Cipher: <span className="text-cyan-300 font-bold">{session.policy?.encryption}</span>
            </p>
          </div>
        </div>

        {/* Right 2 cols: Active Session Fingerprint */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              Active Session Telemetry Fingerprint
            </h3>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE MONITORING
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Egress IP Address
              </span>
              <span className="text-xs font-mono text-white font-bold">{session.last_ip}</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                ASN: 15169 (Verified Egress)
              </span>
            </div>

            <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Client Terminal Fingerprint
              </span>
              <span className="text-xs font-mono text-white font-bold truncate block">{session.device_name}</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                Hardware Token: Validated
              </span>
            </div>

            <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Behavioral Velocity
              </span>
              <span className="text-xs font-mono text-slate-200 font-bold">Normal Data Rate (1.2 ops/min)</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                Threshold: &lt; 15 ops/min
              </span>
            </div>

            <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Two-Factor Security State
              </span>
              <span className={`text-xs font-mono font-bold ${session.otp_verified ? 'text-emerald-400' : 'text-slate-400'}`}>
                {session.otp_verified ? 'OTP Step-Up Verified' : 'Standard Token'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                Token Expiry: 3600s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature: "Risk Factors Detected" Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div>
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Risk Factors Detected
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Current contributing telemetry vectors influencing active risk score
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40">
            Total Score: {session.risk_score} / 100
          </span>
        </div>

        {/* List of Detected Factors */}
        {session.detected_factors && session.detected_factors.length > 0 ? (
          <div className="space-y-3 pt-2">
            {session.detected_factors.map((f) => (
              <div
                key={f.id}
                className="p-4 bg-[#111827] border border-red-500/30 rounded-xl flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{f.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{f.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-extrabold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/30">
                    +{f.weight}
                  </span>
                  <span className="block text-[9px] font-mono text-slate-500 mt-1 uppercase">{f.category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#111827]/40 rounded-xl border border-dashed border-[#1E293B]">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-200">No Anomalies Detected in Current Session</h4>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-md mx-auto">
              Hardware ID, subnet IP, and login time match trusted profiles. Baseline noise is evaluated at {session.risk_score} / 100 points.
            </p>
          </div>
        )}

        {/* Mathematical Derivation Box */}
        <div className="p-4 bg-[#0B1020] rounded-xl border border-[#1E293B] space-y-2 mt-4">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
            Mathematical Evaluation Formula:
          </span>
          <code className="text-xs font-mono text-cyan-300 block bg-[#111827] p-2 rounded border border-[#1E293B]">
            Risk_Score(t) = min(100, Base_Score + ∑ [ Weight(f_i) · Active(f_i) ])
          </code>
          <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
            Where active vectors map to: LOW (0–30 pts ➔ AES-128), MEDIUM (31–70 pts ➔ AES-192), HIGH (71–100 pts ➔ AES-256 + Mandatory OTP Challenge).
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskMonitor;
