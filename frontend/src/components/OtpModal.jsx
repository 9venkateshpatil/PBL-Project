import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Check, X, AlertTriangle } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

const OtpModal = () => {
  const { otpModalOpen, setOtpModalOpen, verifyOtp } = useSecurity();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!otpModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await verifyOtp(code);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Invalid OTP code.');
    }
  };

  const handleFillDemoCode = () => {
    setCode('749215');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-red-500/40 rounded-2xl p-6 shadow-glow-danger">
        {/* Close Button */}
        <button
          onClick={() => setOtpModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-[#1E293B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-glow-danger">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-sans">
              Two-Factor Challenge Required
            </h3>
            <p className="text-xs font-mono text-red-400">
              HIGH RISK RESTRICTION // STEP-UP AUTH
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          This asset is secured under military-grade <span className="font-mono text-cyan-300 font-semibold">AES-256</span> policy. Due to elevated session risk telemetry, biometric or OTP verification is required to authorize cryptographic decryption.
        </p>

        {/* Demo Hint Banner */}
        <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl mb-4 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-400 font-mono">Academic Demo Token: </span>
            <span className="font-mono text-cyan-300 font-bold tracking-widest">749215</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemoCode}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline font-semibold"
          >
            Auto-Fill
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              6-Digit Authenticator Token
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-[#111827] text-center tracking-[0.5em] text-2xl font-mono text-white py-3 px-4 rounded-xl border border-[#1E293B] focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setOtpModalOpen(false)}
              className="flex-1 py-2.5 px-4 bg-[#111827] hover:bg-[#1E293B] text-slate-300 rounded-xl text-xs font-mono font-medium border border-[#1E293B] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-glow-danger disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Verifying...' : 'Authorize Decryption'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpModal;
