import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  UploadCloud,
  FileText,
  FileCode,
  FileArchive,
  FileImage,
  File,
  Lock,
  Download,
  Eye,
  Trash2,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { api } from '../services/api';

const SecureStorage = () => {
  const { session, openInspection, triggerOtpChallenge, addNotification } = useSecurity();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const fileInputRef = useRef(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.listFiles();
      if (res.success) {
        setFiles(res.files);
      }
    } catch (err) {
      console.error(err);
      addNotification('danger', 'Failed to retrieve storage ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [session.otp_verified]);

  const handleFileUpload = async (fileObj) => {
    if (!fileObj) return;
    try {
      setUploading(true);
      const res = await api.uploadFile(fileObj);
      if (res.success) {
        addNotification(
          'success',
          `Encrypted '${fileObj.name}' with ${res.file.encryption_algo} (${res.file.risk_level} Risk Tier)`
        );
        fetchFiles();
      } else {
        addNotification('danger', res.error || 'Upload encryption failed');
      }
    } catch (err) {
      addNotification('danger', 'Network fault during file transmission');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file) => {
    if (file.requires_otp && !session.otp_verified) {
      triggerOtpChallenge(async () => {
        window.location.href = api.downloadFileUrl(file.id);
      });
      return;
    }
    window.location.href = api.downloadFileUrl(file.id);
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Permanently scrub cryptographic records for '${fileName}'?`)) return;
    try {
      const res = await api.deleteFile(fileId);
      if (res.success) {
        addNotification('info', `File '${fileName}' purged from vault.`);
        fetchFiles();
      }
    } catch (err) {
      addNotification('danger', 'Failed to delete file.');
    }
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Helper file icon by extension
  const getFileIcon = (type) => {
    const t = (type || '').toUpperCase();
    if (['PDF', 'DOC', 'DOCX', 'TXT'].includes(t)) return <FileText className="w-4 h-4 text-cyan-400" />;
    if (['PNG', 'JPG', 'JPEG', 'SVG'].includes(t)) return <FileImage className="w-4 h-4 text-emerald-400" />;
    if (['ZIP', 'TAR', 'GZ', '7Z', 'RAR'].includes(t)) return <FileArchive className="w-4 h-4 text-amber-400" />;
    if (['JS', 'PY', 'JSON', 'HTML'].includes(t)) return <FileCode className="w-4 h-4 text-blue-400" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.encryption_algo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || f.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const isHighRisk = session.risk_level === 'HIGH';
  const isMedRisk = session.risk_level === 'MEDIUM';

  const tierNoticeBg = isHighRisk
    ? 'bg-red-950/30 border-red-500/40 text-red-300'
    : isMedRisk
    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
    : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300';

  return (
    <div className="space-y-6">
      {/* Top Banner with Dynamic Adaptive Security Notice */}
      <div className={`p-4 rounded-2xl border ${tierNoticeBg} flex flex-col md:flex-row items-center justify-between gap-4 transition-all shadow-sm`}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0B1020] border border-inherit">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-sans">
              Adaptive Security Engine Active // Dynamic Allocation: {session.policy?.encryption || 'AES-128'}
            </h3>
            <p className="text-xs font-mono opacity-90 mt-0.5">
              Current Session Risk: <span className="font-bold">{session.risk_score} / 100 ({session.risk_level})</span> • New uploads will be sealed with {session.policy?.encryption}
              {isHighRisk && ' (OTP Verification Required for Download)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="py-2 px-4 bg-[#111827] hover:bg-[#1E293B] border border-inherit text-xs font-mono font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New File</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-panel p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center relative overflow-hidden ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20 shadow-glow-cyan'
            : 'border-[#1E293B] hover:border-cyan-500/40 hover:bg-[#111827]/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            {uploading ? (
              <RefreshCw className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">
              {uploading ? 'Encrypting with Adaptive GCM Cipher...' : 'Drag and drop files here, or browse from system'}
            </p>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Supports documents, archives, database dumps, and source files • Automatic key derivation
            </p>
          </div>
        </div>
      </div>

      {/* Table Controls (Search & Risk Filters) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter files by name or cipher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] text-xs text-slate-200 placeholder-slate-500 pl-10 pr-4 py-2 rounded-xl border border-[#1E293B] focus:outline-none focus:border-cyan-500/50 font-mono"
          />
        </div>

        {/* Risk Level Filter Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-[#0B1020] border border-[#1E293B] rounded-xl self-start sm:self-auto">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((tier) => (
            <button
              key={tier}
              onClick={() => setRiskFilter(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                riskFilter === tier
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Storage Files Table */}
      <div className="glass-panel rounded-2xl border border-[#1E293B] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0B1020]/60 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Encryption</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60 font-sans">
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => {
                  const isHigh = file.risk_level === 'HIGH';
                  const isMed = file.risk_level === 'MEDIUM';

                  const badgeClass = isHigh
                    ? 'text-red-400 bg-red-500/10 border-red-500/30'
                    : isMed
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

                  const isLocked = file.requires_otp && !session.otp_verified;

                  return (
                    <tr key={file.id} className="hover:bg-[#111827]/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div className="flex items-center space-x-2.5">
                          {getFileIcon(file.file_type)}
                          <span className="font-semibold">{file.original_name}</span>
                          {file.requires_otp && (
                            <span className="text-[10px] text-amber-400 font-mono" title="Requires OTP">
                              🔒
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 uppercase">
                        {file.file_type}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] border uppercase font-semibold ${badgeClass}`}>
                          {file.risk_level} ({file.risk_score})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                          {file.encryption_algo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-mono ${isLocked ? 'text-amber-400' : 'text-slate-300'}`}>
                          {file.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {file.created_at}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openInspection(file.id)}
                            className="p-1.5 hover:bg-[#1E293B] text-slate-400 hover:text-cyan-300 rounded-lg transition-colors"
                            title="Inspect Cryptographic Envelope"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            className={`p-1.5 hover:bg-[#1E293B] rounded-lg transition-colors ${
                              isLocked ? 'text-amber-400 hover:text-amber-300' : 'text-slate-400 hover:text-cyan-300'
                            }`}
                            title={isLocked ? 'Requires OTP Verification' : 'Download Decrypted'}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(file.id, file.original_name)}
                            className="p-1.5 hover:bg-[#1E293B] text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-mono">
                    {loading ? 'Decrypting ledger metadata...' : 'No files matching criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecureStorage;
