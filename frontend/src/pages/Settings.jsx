import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Key,
  Sliders,
  RotateCcw,
  Save,
  CheckCircle,
  Database,
  Lock,
  Cpu,
  Info
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { api } from '../services/api';

const Settings = () => {
  const { addNotification, resetSimulation } = useSecurity();
  const [lowCutoff, setLowCutoff] = useState(30);
  const [medCutoff, setMedCutoff] = useState(70);
  const [cipherMode, setCipherMode] = useState('GCM');
  const [otpToken, setOtpToken] = useState('749215');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    addNotification('success', 'Security framework parameters updated.');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetDB = async () => {
    if (!window.confirm('Reset all demo files, risk telemetry, and audit logs to factory state?')) return;
    try {
      await api.clearActivityLogs();
      await resetSimulation();
      addNotification('info', 'System reset to clean academic demonstration state.');
    } catch (err) {
      addNotification('danger', 'Reset failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="p-6 glass-panel rounded-2xl border border-[#1E293B]">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            SYSTEM ARCHITECTURE & POLICIES
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white font-sans mt-1">
          Security Engine Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Configure adaptive thresholds, cipher primitives, and demo authentication seeds.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Risk Thresholds Card */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Adaptive Risk Scoring Cutoffs
            </h3>
            <span className="text-[10px] font-mono text-slate-400">0 - 100 Range</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Low Risk Maximum Threshold (AES-128 Limit)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="10"
                  max="50"
                  value={lowCutoff}
                  onChange={(e) => setLowCutoff(Number(e.target.value))}
                  className="w-24 bg-[#111827] text-sm text-cyan-300 font-mono py-2 px-3 rounded-xl border border-[#1E293B] focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-xs font-mono text-slate-400">Current: 0 – {lowCutoff} pts</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Medium Risk Maximum Threshold (AES-192 Limit)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="51"
                  max="85"
                  value={medCutoff}
                  onChange={(e) => setMedCutoff(Number(e.target.value))}
                  className="w-24 bg-[#111827] text-sm text-amber-300 font-mono py-2 px-3 rounded-xl border border-[#1E293B] focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-xs font-mono text-slate-400">Current: {lowCutoff + 1} – {medCutoff} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Primitives Card */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Cryptographic Primitives & KDF
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">NIST SP 800-38D</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Block Cipher Operation Mode
              </label>
              <select
                value={cipherMode}
                onChange={(e) => setCipherMode(e.target.value)}
                className="w-full bg-[#111827] text-xs font-mono text-slate-200 py-2.5 px-3 rounded-xl border border-[#1E293B] focus:outline-none focus:border-cyan-500/50"
              >
                <option value="GCM">Galois/Counter Mode (GCM) - Authenticated AEAD</option>
                <option value="CBC">Cipher Block Chaining (CBC) with HMAC-SHA256</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Demo Two-Factor OTP Seed
              </label>
              <input
                type="text"
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                className="w-full bg-[#111827] text-xs font-mono text-slate-200 py-2.5 px-3 rounded-xl border border-[#1E293B] focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetDB}
            className="py-2.5 px-4 bg-[#111827] hover:bg-red-950/30 text-slate-400 hover:text-red-400 rounded-xl border border-[#1E293B] hover:border-red-500/30 text-xs font-mono transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data to Factory State</span>
          </button>

          <button
            type="submit"
            className="py-2.5 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-glow-cyan flex items-center gap-2"
          >
            {saved ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Settings Saved' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
