import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const SecurityContext = createContext(null);

export const SecurityProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState({
    risk_score: 20,
    risk_level: 'LOW',
    active_factors: {},
    detected_factors: [],
    policy: {
      encryption: 'AES-128',
      key_bits: 128,
      status_label: 'Protected',
      session_status: 'Trusted',
      mfa_required: false,
      description: 'Standard high-performance encryption for trusted sessions.'
    },
    otp_verified: false,
    last_ip: '192.168.1.104',
    device_name: 'Corporate Secure Node (Ubuntu/X11)'
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', text: 'Shield Engine v2.4 initialized. All cryptosystems nominal.', time: 'Just now' }
  ]);

  // Modal states
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpSuccessCallback, setOtpSuccessCallback] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectData, setInspectData] = useState(null);

  const addNotification = useCallback((type, text) => {
    const newNotif = {
      id: Date.now(),
      type, // 'info', 'warning', 'danger', 'success'
      text,
      time: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await api.getSession();
      if (data.success) {
        setUser(data.user);
        setSession(data.session);
      }
    } catch (err) {
      console.error('Failed to sync session with backend:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleLogin = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.success) {
        setUser(res.user);
        setSession(prev => ({ ...prev, ...res.session }));
        addNotification('success', `Authentication verified for ${res.user.name}`);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err) {
      return { success: false, error: 'Connection failed to security server' };
    }
  };

  const handleQuickLogin = async (mode) => {
    try {
      const res = await api.quickLogin(mode);
      if (res.success) {
        setUser(res.user);
        setSession(prev => ({ ...prev, ...res.session }));
        addNotification(
          mode === 'high' ? 'danger' : mode === 'medium' ? 'warning' : 'info',
          `Quick demo session loaded: ${mode.toUpperCase()} risk tier engaged.`
        );
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err) {
      return { success: false, error: 'Failed to initialize preset session' };
    }
  };

  const handleLogout = () => {
    setUser(null);
    addNotification('info', 'Session terminated. Cryptographic keys scrubbed from memory.');
  };

  const verifyOtp = async (code) => {
    try {
      const res = await api.verifyOtp(code);
      if (res.success) {
        setSession(prev => ({ ...prev, otp_verified: true }));
        addNotification('success', 'Two-factor OTP verified. High-risk restriction lifted.');
        if (otpSuccessCallback) {
          otpSuccessCallback();
          setOtpSuccessCallback(null);
        }
        setOtpModalOpen(false);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err) {
      return { success: false, error: 'OTP validation service failure' };
    }
  };

  const triggerOtpChallenge = (onSuccess) => {
    setOtpSuccessCallback(() => onSuccess);
    setOtpModalOpen(true);
  };

  const openInspection = async (fileId) => {
    try {
      const res = await api.inspectFile(fileId);
      if (res.success) {
        setInspectData(res.inspection);
        setInspectModalOpen(true);
      }
    } catch (err) {
      addNotification('danger', 'Cryptographic metadata retrieval failed');
    }
  };

  const updateSimulation = async (factors) => {
    try {
      const res = await api.applySimulation(factors);
      if (res.success) {
        setSession(prev => ({
          ...prev,
          ...res.session
        }));
        addNotification(
          res.session.risk_level === 'HIGH' ? 'danger' : res.session.risk_level === 'MEDIUM' ? 'warning' : 'info',
          `Adaptive policy adjusted: Risk Score ${res.session.risk_score}/100 (${res.session.risk_level})`
        );
        return { success: true, session: res.session };
      }
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  };

  const resetSimulation = async () => {
    try {
      const res = await api.resetRisk();
      if (res.success) {
        setSession(prev => ({
          ...prev,
          ...res.session
        }));
        addNotification('info', 'Risk telemetry restored to baseline (Score 15 - LOW)');
        return { success: true };
      }
    } catch (err) {
      return { success: false };
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        user,
        session,
        setSession,
        activeTab,
        setActiveTab,
        loading,
        notifications,
        addNotification,
        refreshSession,
        handleLogin,
        handleQuickLogin,
        handleLogout,
        verifyOtp,
        otpModalOpen,
        setOtpModalOpen,
        triggerOtpChallenge,
        inspectModalOpen,
        setInspectModalOpen,
        inspectData,
        openInspection,
        updateSimulation,
        resetSimulation,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
