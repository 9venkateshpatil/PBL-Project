import React, { useState, useEffect } from 'react';
import {
  History,
  Shield,
  ShieldAlert,
  Lock,
  LogIn,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  Trash2,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useSecurity } from '../context/SecurityContext';

const SecurityActivity = () => {
  const { addNotification } = useSecurity();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getActivityLogs(severityFilter, search, 50);
      if (res.success) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error(err);
      addNotification('danger', 'Failed to retrieve audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [severityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleClear = async () => {
    if (!window.confirm('Purge and reinitialize security activity log?')) return;
    try {
      const res = await api.clearActivityLogs();
      if (res.success) {
        addNotification('info', 'Security audit trail reset to baseline.');
        fetchEvents();
      }
    } catch (err) {
      addNotification('danger', 'Failed to clear audit trail.');
    }
  };

  const getEventIcon = (type, severity) => {
    if (type.includes('AUTH')) return <LogIn className="w-4 h-4" />;
    if (type.includes('FILE') || type.includes('ENCRYPT')) return <Lock className="w-4 h-4" />;
    if (severity === 'HIGH' || type.includes('THREAT')) return <ShieldAlert className="w-4 h-4" />;
    if (severity === 'MEDIUM') return <AlertTriangle className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const getNodeColor = (severity) => {
    if (severity === 'HIGH') return 'border-red-500 bg-red-950 text-red-400 shadow-glow-danger';
    if (severity === 'MEDIUM') return 'border-amber-500 bg-amber-950 text-amber-400 shadow-glow-warning';
    return 'border-cyan-400 bg-cyan-950 text-cyan-300 shadow-glow-cyan';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 glass-panel rounded-2xl border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              IMMUTABLE AUDIT TRAIL
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              SOC LOGGING ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-sans mt-1">
            Security Event Activity
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Chronological audit stream recording risk evaluations, adaptive cipher upgrades, and authentication attempts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchEvents}
            className="p-2.5 bg-[#111827] hover:bg-[#1E293B] text-slate-300 rounded-xl border border-[#1E293B] transition-colors"
            title="Refresh Log Stream"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={handleClear}
            className="p-2.5 bg-[#111827] hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl border border-[#1E293B] hover:border-red-500/30 transition-colors"
            title="Reset Audit Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls: Search & Severity Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] text-xs text-slate-200 placeholder-slate-500 pl-10 pr-4 py-2 rounded-xl border border-[#1E293B] focus:outline-none focus:border-cyan-500/50 font-mono"
          />
        </form>

        <div className="flex items-center space-x-1.5 p-1 bg-[#0B1020] border border-[#1E293B] rounded-xl self-start sm:self-auto">
          {['ALL', 'INFO', 'MEDIUM', 'HIGH'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                severityFilter === sev
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1E293B]">
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500/50 before:via-blue-500/30 before:to-transparent">
          {events.length > 0 ? (
            events.map((ev) => {
              const nodeClass = getNodeColor(ev.severity);
              return (
                <div key={ev.id} className="relative flex items-start space-x-4 group">
                  {/* Glowing Node Marker */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${nodeClass}`}
                  >
                    {getEventIcon(ev.event_type, ev.severity)}
                  </div>

                  {/* Event Details Card */}
                  <div className="flex-1 bg-[#111827]/80 hover:bg-[#111827] border border-[#1E293B] hover:border-cyan-500/40 p-4 rounded-xl transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200 font-sans">
                          {ev.title}
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase ${
                          ev.severity === 'HIGH'
                            ? 'text-red-400 bg-red-500/10 border-red-500/30'
                            : ev.severity === 'MEDIUM'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                            : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                        }`}>
                          {ev.severity}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-cyan-400/80" />
                        <span>{ev.created_at}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-mono leading-relaxed">
                      {ev.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Event Type: <span className="text-cyan-400">{ev.event_type}</span></span>
                      <span>Telemetry IP: <span className="text-slate-300">{ev.ip_address}</span></span>
                      <span>Computed Risk: <span className="text-amber-300 font-semibold">{ev.risk_score} pts</span></span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono">
              {loading ? 'Decrypting audit records...' : 'No security events match the active filter.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityActivity;
