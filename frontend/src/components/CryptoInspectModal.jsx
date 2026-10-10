import React, { useState } from 'react';
import { Shield, Key, Lock, Copy, Check, X, Cpu, Hash, FileCheck } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

const CryptoInspectModal = () => {
  const { inspectModalOpen, setInspectModalOpen, inspectData } = useSecurity();
  const [copiedKey, setCopiedKey] = useState(null);

  if (!inspectModalOpen || !inspectData) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const { original_name, file_type, file_size, risk_score, risk_level, encryption_algo, key_size_bits, crypto_metadata } = inspectData;

  const isHigh = risk_level === 'HIGH';
  const isMed = risk_level === 'MEDIUM';

  const badgeColor = isHigh ? 'text-red-400 bg-red-500/10 border-red-500/30' : isMed ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-cyan-500/40 rounded-2xl p-6 shadow-glow-cyan max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setInspectModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-[#1E293B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5 border-b border-[#1E293B] pb-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white font-sans">
                Cryptographic Envelope Inspection
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}>
                {encryption_algo}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Target: <span className="text-cyan-300 font-semibold">{original_name}</span> ({file_type} • {(file_size / 1024).toFixed(1)} KB)
            </p>
          </div>
        </div>

        {/* Security Parameters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Key Length</span>
            <span className="text-sm font-mono font-bold text-cyan-300">{key_size_bits} Bits</span>
            <span className="text-[10px] font-mono text-slate-500 block">({key_size_bits / 8} Bytes)</span>
          </div>

          <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Cipher Mode</span>
            <span className="text-sm font-mono font-bold text-white">GCM (AEAD)</span>
            <span className="text-[10px] font-mono text-slate-500 block">Authenticated</span>
          </div>

          <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Upload Risk</span>
            <span className="text-sm font-mono font-bold text-amber-300">{risk_score} / 100</span>
            <span className={`text-[10px] font-mono block ${isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-cyan-400'}`}>{risk_level}</span>
          </div>

          <div className="p-3 bg-[#111827] border border-[#1E293B] rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Key Derivation</span>
            <span className="text-sm font-mono font-bold text-white">PBKDF2</span>
            <span className="text-[10px] font-mono text-slate-500 block">100k SHA-256</span>
          </div>
        </div>

        {/* Cryptographic Primitives Details */}
        <div className="space-y-3 mb-5">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-cyan-400" /> Cryptographic Parameters
          </h4>

          {/* Salt */}
          <div className="p-2.5 bg-[#111827] border border-[#1E293B] rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-slate-400">Cryptographic Salt (128-bit)</span>
              <button
                onClick={() => handleCopy(crypto_metadata?.salt_hex, 'salt')}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedKey === 'salt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'salt' ? 'Copied' : 'Copy Hex'}
              </button>
            </div>
            <code className="text-xs font-mono text-slate-300 break-all select-all block bg-[#0B1020] p-1.5 rounded border border-[#1E293B]/70">
              {crypto_metadata?.salt_hex || 'N/A'}
            </code>
          </div>

          {/* Nonce / IV */}
          <div className="p-2.5 bg-[#111827] border border-[#1E293B] rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-slate-400">Initialization Vector / Nonce (96-bit GCM)</span>
              <button
                onClick={() => handleCopy(crypto_metadata?.nonce_iv_hex, 'nonce')}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedKey === 'nonce' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'nonce' ? 'Copied' : 'Copy Hex'}
              </button>
            </div>
            <code className="text-xs font-mono text-slate-300 break-all select-all block bg-[#0B1020] p-1.5 rounded border border-[#1E293B]/70">
              {crypto_metadata?.nonce_iv_hex || 'N/A'}
            </code>
          </div>

          {/* Auth Tag */}
          <div className="p-2.5 bg-[#111827] border border-[#1E293B] rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-slate-400">GCM Authentication Tag (128-bit MAC)</span>
              <button
                onClick={() => handleCopy(crypto_metadata?.auth_tag_hex, 'tag')}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedKey === 'tag' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'tag' ? 'Copied' : 'Copy Hex'}
              </button>
            </div>
            <code className="text-xs font-mono text-slate-300 break-all select-all block bg-[#0B1020] p-1.5 rounded border border-[#1E293B]/70">
              {crypto_metadata?.auth_tag_hex || 'N/A'}
            </code>
          </div>

          {/* SHA-256 Plaintext & Ciphertext hashes */}
          <div className="p-2.5 bg-[#111827] border border-[#1E293B] rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-slate-400">Plaintext SHA-256 Digest (Integrity Hash)</span>
              <button
                onClick={() => handleCopy(crypto_metadata?.plaintext_sha256, 'plain_hash')}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedKey === 'plain_hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'plain_hash' ? 'Copied' : 'Copy Hex'}
              </button>
            </div>
            <code className="text-xs font-mono text-emerald-300/90 break-all select-all block bg-[#0B1020] p-1.5 rounded border border-[#1E293B]/70">
              {crypto_metadata?.plaintext_sha256 || 'N/A'}
            </code>
          </div>
        </div>

        {/* Security Assessment Footer */}
        <div className="p-3 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/20 rounded-xl">
          <div className="flex items-start space-x-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="text-slate-200 font-semibold">
                Security Assurance: <span className="text-cyan-300">{crypto_metadata?.security_margin}</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Quantum Resistance: <span className="text-slate-300 font-mono">{crypto_metadata?.quantum_resistance}</span> • Performance: <span className="text-slate-300">{crypto_metadata?.operational_overhead}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoInspectModal;
