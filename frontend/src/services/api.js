const API_BASE = '/api';

export const api = {
  // Authentication & Session
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  quickLogin: async (mode) => {
    const res = await fetch(`${API_BASE}/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    return res.json();
  },

  getSession: async () => {
    const res = await fetch(`${API_BASE}/auth/session`);
    return res.json();
  },

  verifyOtp: async (code) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return res.json();
  },

  // Files & Secure Storage
  listFiles: async () => {
    const res = await fetch(`${API_BASE}/files`);
    return res.json();
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  inspectFile: async (fileId) => {
    const res = await fetch(`${API_BASE}/files/${fileId}/inspect`);
    return res.json();
  },

  downloadFileUrl: (fileId) => {
    return `${API_BASE}/files/${fileId}/download`;
  },

  downloadFile: async (fileId) => {
    const res = await fetch(`${API_BASE}/files/${fileId}/download`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Download failed' }));
      throw err;
    }
    const blob = await res.blob();
    return { blob, filename: res.headers.get('content-disposition') };
  },

  deleteFile: async (fileId) => {
    const res = await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Risk Engine & Simulator
  getRiskStatus: async () => {
    const res = await fetch(`${API_BASE}/risk/status`);
    return res.json();
  },

  getRiskFactors: async () => {
    const res = await fetch(`${API_BASE}/risk/factors`);
    return res.json();
  },

  evaluateRiskPreview: async (factors) => {
    const res = await fetch(`${API_BASE}/risk/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factors }),
    });
    return res.json();
  },

  applySimulation: async (factors) => {
    const res = await fetch(`${API_BASE}/risk/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factors }),
    });
    return res.json();
  },

  resetRisk: async () => {
    const res = await fetch(`${API_BASE}/risk/reset`, {
      method: 'POST',
    });
    return res.json();
  },

  // Security Activity Audit
  getActivityLogs: async (severity = '', search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit);
    const res = await fetch(`${API_BASE}/activity?${params.toString()}`);
    return res.json();
  },

  clearActivityLogs: async () => {
    const res = await fetch(`${API_BASE}/activity/clear`, {
      method: 'POST',
    });
    return res.json();
  },

  // Analytics
  getAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics`);
    return res.json();
  },
};
