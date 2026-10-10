import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, Sparkles, Key, CheckCircle, Terminal } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

const Login = ({ onLoginSuccess }) => {
  const { handleLogin, handleQuickLogin } = useSecurity();
  const [email, setEmail] = useState('secops@cloudcrypt.io');
  const [password, setPassword] = useState('cloudcrypt123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await handleLogin(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Authentication failed');
    } else if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleDemoPreset = async (mode) => {
    setError('');
    setLoading(true);
    const res = await handleQuickLogin(mode);
    setLoading(false);
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#E6F1FF] flex items-center justify-center p-6 relative overflow-hidden cyber-grid-bg">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo and Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-glow-cyan mb-4 border border-cyan-400/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-mono text-white">
            Cloud<span className="text-cyan-400">Crypt</span>
          </h1>
          <p className="text-sm font-semibold text-cyan-300 mt-1">
            Secure Your Cloud Intelligently
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Risk-Adaptive Encryption for Intelligent Cloud Security
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-2xl border border-[#1E293B] shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#1E293B]">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              SOC Terminal Access
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              AES-GCM // v2.4
            </span>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                Operator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111827] text-sm text-slate-200 placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-xl border border-[#1E293B] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 font-mono transition-all"
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                Cryptographic Passphrase
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111827] text-sm text-slate-200 placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-xl border border-[#1E293B] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 font-mono transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-400 font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-glow-cyan hover:shadow-glow-cyan-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Authenticate & Enter SOC'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Preset Selection for Academic Evaluators */}
          <div className="mt-6 pt-5 border-t border-[#1E293B]/70">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" /> PBL Review Quick Presets
              </span>
              <span className="text-[9px] text-cyan-400/80">1-Click Launch</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoPreset('low')}
                className="p-2 bg-[#111827] hover:bg-[#1E293B] border border-cyan-500/30 hover:border-cyan-400 rounded-lg text-center transition-all group"
              >
                <span className="text-[10px] font-mono font-bold text-cyan-400 block">LOW RISK</span>
                <span className="text-[9px] font-mono text-slate-400 block group-hover:text-slate-300">AES-128</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoPreset('medium')}
                className="p-2 bg-[#111827] hover:bg-[#1E293B] border border-amber-500/30 hover:border-amber-400 rounded-lg text-center transition-all group"
              >
                <span className="text-[10px] font-mono font-bold text-amber-400 block">MED RISK</span>
                <span className="text-[9px] font-mono text-slate-400 block group-hover:text-slate-300">AES-192</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoPreset('high')}
                className="p-2 bg-[#111827] hover:bg-[#1E293B] border border-red-500/30 hover:border-red-400 rounded-lg text-center transition-all group"
              >
                <span className="text-[10px] font-mono font-bold text-red-400 block">HIGH RISK</span>
                <span className="text-[9px] font-mono text-slate-400 block group-hover:text-slate-300">AES-256</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] font-mono text-slate-500 mt-6">
          B.Tech Cybersecurity PBL Prototype • Second-Year Project Review
        </p>
      </div>
    </div>
  );
};

export default Login;
