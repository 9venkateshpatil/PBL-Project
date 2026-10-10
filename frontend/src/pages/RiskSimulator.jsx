import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Laptop,
  Globe,
  Clock,
  AlertTriangle,
  Download,
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  Key,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import RadialRiskGauge from '../components/RadialRiskGauge';
import { api } from '../services/api';

const RiskSimulator = () => {
  const { session, updateSimulation, resetSimulation, addNotification } = useSecurity();

  // Local factor state
  const [factors, setFactors] = useState({
    new_device: false,
    unknown_ip: false,
    unusual_time: false,
    failed_logins: false,
    suspicious_download: false,
    unusual_location: false,
  });

  // Local dynamic preview calculation
  const [preview, setPreview] = useState({
    score: 20,
    level: 'LOW',
    policy: {
      encryption: 'AES-128',
      key_bits: 128,
      status_label: 'Protected',
      session_status: 'Trusted',
      mfa_required: false,
    },
    detected_factors: [],
  });

  const [applying, setApplying] = useState(false);

  // Sync factors from active session on initial load
  useEffect(() => {
    if (session.active_factors) {
      setFactors((prev) => ({
        ...prev,
        ...session.active_factors,
      }));
    }
  }, [session.active_factors]);

  // Recalculate preview whenever factors change
  useEffect(() => {
    let score = 15; // baseline noise
    const detected = [];

    const factorDefs = [
      { id: 'new_device', name: 'New Device', weight: 20 },
      { id: 'unknown_ip', name: 'Unknown IP', weight: 25 },
      { id: 'unusual_time', name: 'Unusual Login Time', weight: 15 },
      { id: 'failed_logins', name: 'Multiple Failed Logins', weight: 30 },
      { id: 'suspicious_download', name: 'Suspicious Download Activity', weight: 25 },
      { id: 'unusual_location', name: 'Unusual Geographic Location', weight: 35 },
    ];

    factorDefs.forEach((f) => {
      if (factors[f.id]) {
        score += f.weight;
        detected.push(f);
      }
    });

    score = Math.min(100, Math.max(0, score));

    let level = 'LOW';
    let policy = {
      encryption: 'AES-128',
      key_bits: 128,
      status_label: 'Protected',
      session_status: 'Trusted',
      mfa_required: false,
      response_text: 'Standard low-latency AES-128 encryption. Full unrestricted download access.'
    };

    if (score > 70) {
      level = 'HIGH';
      policy = {
        encryption: 'AES-256',
        key_bits: 256,
        status_label: 'Restricted (OTP Required)',
        session_status: 'Restricted',
        mfa_required: true,
        response_text: 'Military-grade AES-256 cipher engaged. OTP two-factor verification required before data export.'
      };
    } else if (score > 30) {
      level = 'MEDIUM';
      policy = {
        encryption: 'AES-192',
        key_bits: 192,
        status_label: 'Enhanced Protection',
        session_status: 'Monitored',
        mfa_required: false,
        response_text: 'High-assurance AES-192 encryption applied with strict audit logging and telemetry capture.'
      };
    }

    setPreview({
      score,
      level,
      policy,
      detected_factors: detected,
    });
  }, [factors]);

  const toggleFactor = (key) => {
    setFactors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleApply = async () => {
    setApplying(true);
    await updateSimulation(factors);
    setApplying(false);
  };

  const handleReset = async () => {
    const clean = {
      new_device: false,
      unknown_ip: false,
      unusual_time: false,
      failed_logins: false,
      suspicious_download: false,
      unusual_location: false,
    };
    setFactors(clean);
    await resetSimulation();
  };

  const loadPreset = (presetName) => {
    if (presetName === 'trusted') {
      setFactors({
        new_device: false,
        unknown_ip: false,
        unusual_time: false,
        failed_logins: false,
        suspicious_download: false,
        unusual_location: false,
      });
    } else if (presetName === 'remote') {
      setFactors({
        new_device: true,
        unknown_ip: false,
        unusual_time: true,
        failed_logins: false,
        suspicious_download: false,
        unusual_location: false,
      });
    } else if (presetName === 'threat') {
      setFactors({
        new_device: true,
        unknown_ip: true,
        unusual_time: false,
        failed_logins: true,
        suspicious_download: false,
        unusual_location: true,
      });
    }
  };

  const factorItems = [
    {
      id: 'new_device',
      name: 'New Device',
      desc: 'Unrecognized browser fingerprint or novel client MAC',
      weight: 20,
      icon: Laptop,
    },
    {
      id: 'unknown_ip',
      name: 'Unknown IP',
      desc: 'Traffic arriving from unwhitelisted corporate subnet',
      weight: 25,
      icon: Globe,
    },
    {
      id: 'unusual_time',
      name: 'Unusual Login Time',
      desc: 'Session initiated during off-peak hours (02:00 - 05:00)',
      weight: 15,
      icon: Clock,
    },
    {
      id: 'failed_logins',
      name: 'Multiple Failed Logins',
      desc: 'Repeated bad password attempts prior to session entry',
      weight: 30,
      icon: AlertTriangle,
    },
    {
      id: 'suspicious_download',
      name: 'Suspicious Download Activity',
      desc: 'Rapid high-frequency file download requests detected',
      weight: 25,
      icon: Download,
    },
    {
      id: 'unusual_location',
      name: 'Unusual Geographic Location',
      desc: 'Impossible travel velocity or foreign egress node / TOR',
      weight: 35,
      icon: MapPin,
    },
  ];

  const isHigh = preview.level === 'HIGH';
  const isMed = preview.level === 'MEDIUM';

  const previewBadge = isHigh
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
              Interactive Academic Demonstration Lab
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              PROJECT REVIEW MODE
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-sans mt-1">
            Dynamic Risk Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Toggle threat vectors below to simulate real-world attacks and witness instantaneous cryptographic adaptations.
          </p>
        </div>

        {/* Quick Presets for Demo */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadPreset('trusted')}
            className="py-1.5 px-3 bg-[#111827] hover:bg-[#1E293B] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-xl text-xs font-mono transition-all"
          >
            Trusted Baseline
          </button>
          <button
            onClick={() => loadPreset('remote')}
            className="py-1.5 px-3 bg-[#111827] hover:bg-[#1E293B] border border-amber-500/30 hover:border-amber-400 text-amber-300 rounded-xl text-xs font-mono transition-all"
          >
            Remote Travel
          </button>
          <button
            onClick={() => loadPreset('threat')}
            className="py-1.5 px-3 bg-[#111827] hover:bg-[#1E293B] border border-red-500/30 hover:border-red-400 text-red-300 rounded-xl text-xs font-mono transition-all"
          >
            Hostile Intruder
          </button>
        </div>
      </div>

      {/* Main Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Threat Vector Toggles */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div>
              <h3 className="text-sm font-bold text-white font-sans">
                Select Telemetry Anomaly Conditions
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Each active vector contributes weighted risk points to the aggregate score
              </p>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#111827] rounded-lg transition-colors flex items-center gap-1 text-xs font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {factorItems.map((item) => {
              const Icon = item.icon;
              const isActive = factors[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleFactor(item.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all select-none relative group ${
                    isActive
                      ? 'bg-cyan-950/20 border-cyan-400 shadow-glow-cyan'
                      : 'bg-[#111827] border-[#1E293B] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-[#0B1020] text-slate-400 group-hover:text-cyan-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-mono text-cyan-400/90 font-semibold">
                          +{item.weight} Risk Pts
                        </span>
                      </div>
                    </div>

                    {/* Checkbox badge */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isActive
                          ? 'bg-cyan-400 border-cyan-300 text-black'
                          : 'border-slate-600 bg-[#0B1020]'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono mt-3 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Button: Apply to Session */}
          <div className="pt-4 border-t border-[#1E293B] flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Apply simulation to trigger live backend policy shift across all modules:
            </span>
            <button
              onClick={handleApply}
              disabled={applying}
              className="py-2.5 px-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-glow-cyan hover:shadow-glow-cyan-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{applying ? 'Updating Engine...' : 'Apply To Active Session'}</span>
            </button>
          </div>
        </div>

        {/* Right Col: Dynamic Live Simulation Result */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Calculated Risk Response
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${previewBadge}`}>
                {preview.level} TIER
              </span>
            </div>

            {/* Live Radial Gauge */}
            <div className="flex justify-center py-4">
              <RadialRiskGauge score={preview.score} level={preview.level} size={200} />
            </div>

            {/* Dynamic Adaptive Security Response Card */}
            <div className="p-4 rounded-xl bg-[#111827] border border-[#1E293B] space-y-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Adaptive Security Response:
              </span>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-mono">Encryption Level:</span>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                  {preview.policy.encryption} Enabled
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-mono">Authentication:</span>
                <span className={`text-xs font-mono font-bold ${preview.policy.mfa_required ? 'text-red-400' : 'text-slate-300'}`}>
                  {preview.policy.mfa_required ? 'OTP Verification Required' : 'Standard Session'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-mono">File Access:</span>
                <span className={`text-xs font-mono font-bold ${preview.policy.mfa_required ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {preview.policy.mfa_required ? 'Download Restricted' : 'Unrestricted Access'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono mt-4 leading-relaxed p-3 bg-[#0B1020] rounded-xl border border-[#1E293B]">
              {preview.policy.response_text}
            </p>
          </div>

          <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-center">
            <span className="text-[11px] font-mono text-cyan-400 block font-semibold">
              Live Preview Synchronized
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              Click "Apply To Active Session" to enforce this policy.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskSimulator;
