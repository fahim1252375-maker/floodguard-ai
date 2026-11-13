import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  BellRing,
  Database,
  Radio,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sliders,
  Plus,
  RefreshCw,
  Server,
  Activity,
  Layers,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
} from 'lucide-react';
import {
  LocationData,
  CommunityReport,
  AlertItem,
  DataSourceStatus,
  Language,
  District,
} from '../types';
import { DATA_SOURCES } from '../data/mockData';
import { t } from '../utils/translations';

interface AdminViewProps {
  locations: LocationData[];
  reports: CommunityReport[];
  alerts: AlertItem[];
  language: Language;
  onUpdateLocationDangerLevel: (id: string, newDL: number, warningLevel?: number) => Promise<boolean>;
  onVerifyReport: (id: string, status: 'verified' | 'flagged') => Promise<boolean>;
  onCreateAlert: (alert: Omit<AlertItem, 'id' | 'timestamp' | 'isVerified' | 'isRead'>) => Promise<boolean>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  locations,
  reports,
  alerts,
  language,
  onUpdateLocationDangerLevel,
  onVerifyReport,
  onCreateAlert,
}) => {
  const tr = t[language];

  // Admin PIN Protection State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [thresholdOverrides, setThresholdOverrides] = useState<Record<string, { warning_level: number; danger_level: number }>>({});

  const loadThresholds = async (pin: string) => {
    const response = await fetch('/api/admin/station-thresholds', { headers: { 'x-admin-pin': pin } });
    if (!response.ok) return;
    const payload = await response.json();
    const next: Record<string, { warning_level: number; danger_level: number }> = {};
    for (const row of payload.thresholds ?? []) {
      if (typeof row.station_id === 'string' && Number.isFinite(row.warning_level) && Number.isFinite(row.danger_level)) {
        next[row.station_id] = { warning_level: row.warning_level, danger_level: row.danger_level };
      }
    }
    setThresholdOverrides(next);
  };

  useEffect(() => {
    let active = true;
    const savedPin = sessionStorage.getItem('floodguard_admin_pin');
    if (savedPin) {
      fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'x-admin-pin': savedPin },
      })
        .then(async (res) => {
          if (!active) return;
          if (res.ok) {
            setIsAuthenticated(true);
            await loadThresholds(savedPin);
          } else {
            sessionStorage.removeItem('floodguard_admin_pin');
          }
        })
        .catch(() => {
          if (!active) return;
          // A network failure is not authentication. Keep the gate locked.
          sessionStorage.removeItem('floodguard_admin_pin');
          setPinError('Could not reach the server to verify your session. Please reconnect and enter the PIN again.');
        });
    }
    return () => { active = false; };
  }, []);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pinInput.trim(),
        },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });

      if (res.ok) {
        sessionStorage.setItem('floodguard_admin_pin', pinInput.trim());
        setIsAuthenticated(true);
        await loadThresholds(pinInput.trim());
        setPinInput('');
      } else {
        setPinError(res.status === 429 ? 'Too many attempts. Try again in a few minutes.' : 'Invalid Admin PIN. Check the ADMIN_PIN value in your .env file.');
      }
    } catch (err) {
      setPinError('Failed to verify PIN with server. Please try again.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('floodguard_admin_pin');
    setIsAuthenticated(false);
    setPinInput('');
    setPinError(null);
  };

  // New alert form modal
  const [isNewAlertOpen, setIsNewAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertTitleBn, setAlertTitleBn] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'advisory' | 'watch' | 'warning' | 'emergency'>('warning');
  const [alertDistrict, setAlertDistrict] = useState<District>('Sylhet');
  const [alertLocation, setAlertLocation] = useState('Gowainghat Upazila');
  const [alertLocationBn, setAlertLocationBn] = useState('গোয়াইনঘাট উপজেলা');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertMessageBn, setAlertMessageBn] = useState('');
  const [alertAction, setAlertAction] = useState('');
  const [alertActionBn, setAlertActionBn] = useState('');
  const [alertPopulation, setAlertPopulation] = useState(50000);

  // Station danger level editing state
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [editDangerVal, setEditDangerVal] = useState<number>(10.8);
  const [editWarningVal, setEditWarningVal] = useState<number>(10.3);

  const handleCreateAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;
    setBusyActionId('create-alert');
    setActionNotice(null);
    const saved = await onCreateAlert({
      severity: alertSeverity,
      titleEn: alertTitle.trim(),
      titleBn: alertTitleBn.trim() || alertTitle.trim(),
      locationEn: alertLocation,
      locationBn: alertLocationBn.trim() || alertLocation,
      district: alertDistrict,
      messageEn: alertMessage.trim(),
      messageBn: alertMessageBn.trim() || alertMessage.trim(),
      actionEn: alertAction.trim() || 'Follow local flood evacuation procedures and official instructions.',
      actionBn: alertActionBn.trim() || alertAction.trim() || 'স্থানীয় প্রশাসনের নির্দেশনা অনুসরণ করে নিরাপদ স্থানে আশ্রয় নিন।',
      affectedPopulation: Math.max(0, Math.min(10000000, Math.round(alertPopulation))),
      source: 'FloodGuard Emergency Operation Center',
    });
    setBusyActionId(null);
    if (!saved) {
      setActionNotice('Alert was not saved. Check the server connection and Admin PIN, then try again.');
      return;
    }
    setActionNotice('Alert saved and published.');
    setIsNewAlertOpen(false);
    setAlertTitle('');
    setAlertTitleBn('');
    setAlertMessage('');
    setAlertMessageBn('');
    setAlertAction('');
    setAlertActionBn('');
  };

  const handleModeration = async (id: string, status: 'verified' | 'flagged') => {
    setBusyActionId(`report:${id}`);
    setActionNotice(null);
    const saved = await onVerifyReport(id, status);
    setBusyActionId(null);
    setActionNotice(saved ? `Report ${status === 'verified' ? 'verified and published' : 'flagged'} successfully.` : 'Report update failed. Check the Admin PIN and server connection.');
  };

  // PIN Authentication Gate Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-cyan-500/30 shadow-2xl space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-950/50">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {language === 'en' ? 'Admin Portal Authentication' : 'অ্যাডমিন পোর্টাল সিকিউরিটি'}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {language === 'en'
                ? 'Enter your administrative PIN to access station threshold controls, community report moderation, and emergency broadcast dispatch.'
                : 'স্টেশন থ্রেশহোল্ড পরিবর্তন ও জরুরি অ্যালার্ট জারির জন্য অ্যাডমিন পিন প্রদান করুন।'}
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                {language === 'en' ? 'Security PIN' : 'নিরাপত্তা পিন'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter the Admin PIN shown in the server setup"
                  maxLength={16}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition shadow-inner"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifyingPin || !pinInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-950/50"
            >
              {isVerifyingPin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Admin Portal</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
            Set a private PIN in your local <code className="text-cyan-400">.env</code> file using <code className="text-cyan-400">ADMIN_PIN</code>. No shared default PIN is enabled.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Verified admin controls and session logout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <span>{tr.navAdmin}</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Server-verified Admin Access
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Unlock className="w-3 h-3 text-emerald-400" />
              PIN Authenticated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Station thresholds, community report verification, broadcast alerts, and data stream health'
              : 'স্টেশন থ্রেশহোল্ড পরিবর্তন, কমিউনিটি রিপোর্ট ভেরিফিকেশন এবং সিস্টেম মনিটরিং'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold text-slate-400 hover:text-rose-300 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Lock administrative console and clear session"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Lock Admin</span>
          </button>

        <button
          onClick={() => { setIsNewAlertOpen(true); setActionNotice(null); }}
          className="px-3 py-2 rounded-xl bg-rose-500 text-slate-950 text-xs font-bold flex items-center gap-2 hover:bg-rose-400 transition"
        >
          <Plus className="w-4 h-4" /> Create alert
        </button>
        <span className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          All write actions are checked by the server using your administrator PIN.
        </span>
      </div>
    </div>

      {actionNotice && (
        <div role="status" aria-live="polite" className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200">
          {actionNotice}
        </div>
      )}

      {/* Quick Admin Actions Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Pending Community Reports</span>
            <div className="text-2xl font-black text-amber-400">
              {reports.filter((r) => r.status === 'pending').length}
            </div>
          </div>
          <UserCheck className="w-6 h-6 text-amber-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Active Alert Broadcasts</span>
            <div className="text-2xl font-black text-rose-400">{alerts.length}</div>
          </div>
          <BellRing className="w-6 h-6 text-rose-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Monitored Sensor Nodes</span>
            <div className="text-2xl font-black text-cyan-400">{locations.length}</div>
          </div>
          <Database className="w-6 h-6 text-cyan-400" />
        </div>
      </div>

      {isNewAlertOpen && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Create emergency alert</h2>
              <p className="text-xs text-slate-400 mt-1">This alert is saved to the server and appears in the public alert feed.</p>
            </div>
            <button type="button" onClick={() => setIsNewAlertOpen(false)} className="text-xs text-slate-400 hover:text-white">Close</button>
          </div>
          <form onSubmit={handleCreateAlertSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs text-slate-300 space-y-1">
              <span>Alert title</span>
              <input required maxLength={180} value={alertTitle} onChange={(e) => setAlertTitle(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white" placeholder="Flood warning for affected area" />
            </label>
            <label className="text-xs text-slate-300 space-y-1">
              <span>Alert title (বাংলা)</span>
              <input maxLength={180} value={alertTitleBn} onChange={(e) => setAlertTitleBn(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white" placeholder="বন্যা সতর্কবার্তার শিরোনাম" />
            </label>
            <label className="text-xs text-slate-300 space-y-1">
              <span>Severity</span>
              <select value={alertSeverity} onChange={(e) => setAlertSeverity(e.target.value as typeof alertSeverity)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white">
                <option value="advisory">Advisory</option><option value="watch">Watch</option><option value="warning">Warning</option><option value="emergency">Emergency</option>
              </select>
            </label>
            <label className="text-xs text-slate-300 space-y-1">
              <span>District</span>
              <select value={alertDistrict} onChange={(e) => setAlertDistrict(e.target.value as District)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white">
                <option value="Sylhet">Sylhet</option><option value="Sunamganj">Sunamganj</option>
              </select>
            </label>
            <label className="text-xs text-slate-300 space-y-1">
              <span>Location / Upazila</span>
              <input required maxLength={120} value={alertLocation} onChange={(e) => setAlertLocation(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
            </label>
            <label className="text-xs text-slate-300 space-y-1">
              <span>Location / Upazila (বাংলা)</span>
              <input maxLength={120} value={alertLocationBn} onChange={(e) => setAlertLocationBn(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
            </label>
            <label className="md:col-span-2 text-xs text-slate-300 space-y-1">
              <span>Public message</span>
              <textarea required maxLength={3000} rows={3} value={alertMessage} onChange={(e) => setAlertMessage(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white" placeholder="Describe the observed risk and affected area. Include the source and time where possible." />
            </label>
            <label className="md:col-span-2 text-xs text-slate-300 space-y-1">
              <span>Public message (বাংলা)</span>
              <textarea maxLength={3000} rows={3} value={alertMessageBn} onChange={(e) => setAlertMessageBn(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white" placeholder="বার্তাটি বাংলায় লিখুন" />
            </label>
            <label className="md:col-span-2 text-xs text-slate-300 space-y-1">
              <span>Recommended action</span>
              <textarea maxLength={1500} rows={2} value={alertAction} onChange={(e) => setAlertAction(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white" placeholder="Follow local authority instructions and move to a designated shelter if told to evacuate." />
            </label>
            <label className="md:col-span-2 text-xs text-slate-300 space-y-1">
              <span>Recommended action (বাংলা)</span>
              <textarea maxLength={1500} rows={2} value={alertActionBn} onChange={(e) => setAlertActionBn(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white" placeholder="করণীয় বাংলায় লিখুন" />
            </label>
            <label className="text-xs text-slate-300 space-y-1">
              <span>Estimated affected population (optional)</span>
              <input type="number" min={0} max={10000000} value={alertPopulation} onChange={(e) => setAlertPopulation(Number(e.target.value))} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white" />
            </label>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsNewAlertOpen(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs">Cancel</button>
              <button type="submit" disabled={busyActionId === 'create-alert'} className="px-4 py-2 rounded-lg bg-rose-500 text-slate-950 font-bold text-xs disabled:opacity-50">
                {busyActionId === 'create-alert' ? 'Saving…' : 'Save & publish alert'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 1: Community Reports Verification Workflow */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <span>Community Ground-Truth Reports Moderation</span>
            </h2>
            <p className="text-xs text-slate-400">
              Review, verify, or flag field reports submitted by community residents.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-300">
            {reports.length} Total Reports
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Depth & Road</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white">
                    {rep.reporterName}
                    <span className="block text-[10px] font-mono text-slate-400">
                      {rep.timestamp}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="font-semibold">{rep.villageOrArea}</span>
                    <span className="block text-[10px] text-slate-400">
                      {rep.upazilaEn}, {rep.district}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-cyan-300 font-bold">
                      {rep.waterDepthValue} {rep.waterDepthUnit}
                    </span>
                    <span className="block text-[10px] text-slate-400 capitalize">
                      {rep.roadCondition.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        rep.status === 'verified'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                          : rep.status === 'flagged'
                          ? 'bg-rose-950 text-rose-300 border-rose-500/30'
                          : 'bg-amber-950 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {rep.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                        {rep.status !== 'verified' && (
                          <button
                            onClick={() => void handleModeration(rep.id, 'verified')}
                            disabled={busyActionId === `report:${rep.id}`}
                            className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition"
                          >
                            Verify & Publish
                          </button>
                        )}
                        {rep.status !== 'flagged' && (
                          <button
                            onClick={() => void handleModeration(rep.id, 'flagged')}
                            disabled={busyActionId === `report:${rep.id}`}
                            className="px-2 py-1 text-[11px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition"
                          >
                            Flag / Hide
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Manage River Station Danger Marks */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>Station Calibrations & Danger Level Thresholds</span>
            </h2>
            <p className="text-xs text-slate-400">
              Update official BWDB warning and danger levels (in meters) for flood prediction calculations.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Station / Upazila</th>
                <th className="py-3 px-4">River Name</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Warning Mark</th>
                <th className="py-3 px-4">Danger Mark (DL)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {locations.map((loc) => {
                const isEditing = editingStationId === loc.id;
                const savedThreshold = thresholdOverrides[loc.id];
                const displayedWarning = savedThreshold?.warning_level ?? loc.warningLevel;
                const displayedDanger = savedThreshold?.danger_level ?? loc.dangerLevel;

                return (
                  <tr key={loc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {loc.nameEn}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {loc.district}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{loc.riverNameEn}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {loc.currentWaterLevel.toFixed(2)} m
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {isEditing ? (
                        <input type="number" step="0.05" value={editWarningVal} onChange={(e) => setEditWarningVal(Number(e.target.value))} className="w-20 px-2 py-1 rounded bg-slate-950 border border-cyan-500 text-white font-mono text-xs" />
                      ) : `${displayedWarning.toFixed(2)} m`}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.05"
                          value={editDangerVal}
                          onChange={(e) => setEditDangerVal(Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded bg-slate-950 border border-cyan-500 text-white font-mono text-xs"
                        />
                      ) : (
                        `${displayedDanger.toFixed(2)} m`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => void (async () => {
                              setBusyActionId(`threshold:${loc.id}`);
                              setActionNotice(null);
                              const saved = await onUpdateLocationDangerLevel(loc.id, editDangerVal, editWarningVal);
                              setBusyActionId(null);
                              if (saved) {
                                setThresholdOverrides((prev) => ({
                                  ...prev,
                                  [loc.id]: { warning_level: editWarningVal, danger_level: editDangerVal },
                                }));
                                setActionNotice('Station threshold saved to the SQLite database and will be used by monitoring.');
                                setEditingStationId(null);
                              } else {
                                setActionNotice('Threshold update failed. Check the Admin PIN and ensure the warning mark is non-negative and below the danger mark.');
                              }
                            })()}
                            disabled={busyActionId === `threshold:${loc.id}`}
                            className="px-2.5 py-1 text-xs font-bold rounded bg-cyan-500 text-slate-950 disabled:opacity-50"
                          >
                            {busyActionId === `threshold:${loc.id}` ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingStationId(null)}
                            className="px-2 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingStationId(loc.id);
                            setEditDangerVal(displayedDanger);
                            setEditWarningVal(displayedWarning);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                        >
                          Edit DL
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Data Sources Health Status Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>Configured Integrations & Data References</span>
            </h2>
            <p className="text-xs text-slate-400">
              Reference cards are not live health checks. Optional Gemini status is reported by /api/health; BWDB, BMD, FFWC and satellite feeds are not connected in this release.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DATA_SOURCES.map((src, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between text-xs space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">{src.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      src.status === 'connected'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                        : src.status === 'simulated'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                        : 'bg-rose-950 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {src.status}
                  </span>
                </div>
                <p className="text-[11px] text-cyan-300 font-medium">{src.agency}</p>
                <p className="text-slate-400 text-[11px] mt-1.5">{src.details}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Status detail: {src.latency}</span>
                <span>{src.lastSync}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
