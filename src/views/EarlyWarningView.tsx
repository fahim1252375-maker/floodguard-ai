import React, { useState } from 'react';
import {
  BellRing,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  Radio,
  Send,
  Users,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { AlertItem, Language, District } from '../types';
import { t } from '../utils/translations';

interface EarlyWarningViewProps {
  alerts: AlertItem[];
  language: Language;
  onMarkAsRead: (id: string) => void;
  onNavigate: (view: string, targetId?: string) => void;
}

export const EarlyWarningView: React.FC<EarlyWarningViewProps> = ({
  alerts,
  language,
  onMarkAsRead,
  onNavigate,
}) => {
  const tr = t[language];

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<'ALL' | District>('ALL');
  const [expandedAlertIds, setExpandedAlertIds] = useState<Record<string, boolean>>({});

  const toggleEvidence = (id: string) => {
    setExpandedAlertIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Broadcast Notification Simulator State
  const [broadcastMessage, setBroadcastMessage] = useState(
    'URGENT: Sari-Gowain river level rising 4cm/hr. Residents in low-lying wards of Gowainghat are advised to move to Union Shelter.'
  );
  const [targetDistrict, setTargetDistrict] = useState<District>('Sylhet');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    const matchSev = severityFilter === 'ALL' || alert.severity === severityFilter;
    const matchDist = districtFilter === 'ALL' || alert.district === districtFilter;
    return matchSev && matchDist;
  });

  const handleSimulateBroadcast = () => {
    setIsBroadcasting(true);
    setBroadcastSuccess(null);
    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcastSuccess(
        `Simulation Test Broadcast dispatched successfully! Simulated push delivered to 78,400 subscriber mobile nodes in ${targetDistrict}.`
      );
    }, 1200);
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return {
          border: 'border-rose-500/60 bg-rose-950/30',
          badge: 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse',
          icon: AlertOctagon,
          iconColor: 'text-rose-400',
        };
      case 'warning':
        return {
          border: 'border-orange-500/50 bg-orange-950/20',
          badge: 'bg-orange-950 text-orange-300 border-orange-500/40',
          icon: AlertTriangle,
          iconColor: 'text-orange-400',
        };
      case 'watch':
        return {
          border: 'border-amber-500/40 bg-amber-950/20',
          badge: 'bg-amber-950 text-amber-300 border-amber-500/30',
          icon: BellRing,
          iconColor: 'text-amber-400',
        };
      default:
        return {
          border: 'border-cyan-500/40 bg-cyan-950/20',
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-500/30',
          icon: Info,
          iconColor: 'text-cyan-400',
        };
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <BellRing className="w-6 h-6 text-rose-400" />
              <span>{tr.navAlerts}</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
              DEMO ALERTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Example alert cards for demonstration — not official government warnings'
              : 'ডেমোর জন্য নমুনা সতর্কবার্তা—এগুলো সরকারি বা বাস্তব জরুরি নির্দেশনা নয়।'}
          </p>
        </div>

        {/* Notice on Real SMS */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 max-w-sm">
          <span className="font-bold text-slate-200 block">Civil Defense Notice:</span>
          Do not broadcast real emergency sirens without verified authorization from the District Disaster Cell.
        </div>
      </div>

      {/* Alert data disclosure */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-100 leading-relaxed">
        <strong className="text-amber-300">SIMULATED DEMO — NOT AN OFFICIAL WARNING.</strong> Alert cards, timestamps, affected-population estimates and trigger examples may be preloaded sample data. Confirm current warnings with FFWC/DDM and local authorities before taking action.
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-2 uppercase text-[10px]">Severity:</span>
          {['ALL', 'emergency', 'warning', 'watch', 'advisory'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                severityFilter === sev
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sev === 'ALL' ? 'All Alerts' : sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase text-[10px]">District:</span>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value as District | 'ALL')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
          >
            <option value="ALL">All Districts</option>
            <option value="Sylhet">Sylhet Only</option>
            <option value="Sunamganj">Sunamganj Only</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            const Icon = style.icon;

            return (
              <div
                key={alert.id}
                className={`p-6 rounded-2xl border ${style.border} transition shadow-xl space-y-4 ${
                  !alert.isRead ? 'ring-1 ring-cyan-500/30' : 'opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-slate-950 border border-white/10 ${style.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${style.badge}`}>
                          {alert.severity}
                        </span>
                        {!alert.isRead && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {alert.timestamp}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {language === 'en' ? alert.titleEn : alert.titleBn}
                      </h3>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1 sm:justify-end">
                      <MapPin className="w-3.5 h-3.5" />
                      {language === 'en' ? alert.locationEn : alert.locationBn}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {(alert.affectedPopulation / 1000).toFixed(0)}k Population Impacted
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-200 leading-relaxed">
                  {language === 'en' ? alert.messageEn : alert.messageBn}
                </p>

                {/* Action Required Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-300 block mb-0.5">
                      {language === 'en' ? 'Recommended Emergency Action:' : 'প্রস্তাবিত জরুরি করণীয়:'}
                    </span>
                    <span className="text-slate-300">
                      {language === 'en' ? alert.actionEn : alert.actionBn}
                    </span>
                  </div>
                </div>

                {/* Evidence & Triggering Conditions Accordion Toggle */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleEvidence(alert.id)}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-slate-300 transition flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-300">
                      <FileText className="w-3.5 h-3.5" />
                      {language === 'bn' ? 'সতর্কতার বৈজ্ঞানিক ভিত্তি ও প্রমাণকসমূহ' : 'Evidence & Triggering Conditions'}
                    </span>
                    {expandedAlertIds[alert.id] ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedAlertIds[alert.id] && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2.5 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Primary Hydrological Trigger
                          </span>
                          <span className="font-mono text-cyan-300 font-semibold">
                            Water Level exceeded Danger Mark (+0.35m to +0.82m) with rising momentum.
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Transboundary Forcing
                          </span>
                          <span className="font-mono text-purple-300 font-semibold">
                            Cherrapunji catchment heavy rainfall (&gt;180mm/24h) arriving downstream.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                        <span>Indicative demo scenario only — no validated warning lead time</span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          SIMULATED EXAMPLE
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Source and Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Source: {alert.source}
                  </span>

                  <div className="flex items-center gap-2">
                    {!alert.isRead ? (
                      <button
                        onClick={() => onMarkAsRead(alert.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                      >
                        {language === 'en' ? 'Mark as Read' : 'পঠিত হিসেবে চিহ্নিত করুন'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Read</span>
                    )}

                    <button
                      onClick={() => onNavigate('map')}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Locate on Map</span> &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
            No alerts match your current filter criteria.
          </div>
        )}
      </div>

      {/* Community Alert Broadcast Simulator */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-base font-bold text-white">
              {language === 'en' ? 'Notification Channel Dispatch Simulator' : 'জরুরি বিজ্ঞপ্তি সম্প্রচার সিমুলেটর'}
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            SMS & Web Push Architecture
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Simulate dispatching automated multi-channel community broadcasts to registered mobile subscribers and local disaster volunteers.
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Target District
              </label>
              <select
                value={targetDistrict}
                onChange={(e) => setTargetDistrict(e.target.value as District)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="Sylhet">Sylhet District (All Upazilas)</option>
                <option value="Sunamganj">Sunamganj District (Haor Basin)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Emergency Broadcast Text
              </label>
              <input
                type="text"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Channels: Cell Broadcast Service (CBS), Web Push, IVR 1090
            </span>

            <button
              onClick={handleSimulateBroadcast}
              disabled={isBroadcasting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition flex items-center gap-2 shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isBroadcasting ? 'Disseminating...' : 'Simulate Community Dispatch'}</span>
            </button>
          </div>

          {broadcastSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{broadcastSuccess}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
