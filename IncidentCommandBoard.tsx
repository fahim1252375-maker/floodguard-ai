import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  PauseCircle,
  Plus,
  ShieldCheck,
  Stethoscope,
  Radio,
  FileText,
  Filter,
} from 'lucide-react';
import { LocationData, AlertItem, Language } from '../types';
import { safeGetItem, safeSetItem, STORAGE_KEYS } from '../utils/storage';
import { SAMPLE_SHELTER_MEDICAL_BOARD } from '../utils/healthRisk';

export type ActionStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface ActionItem {
  id: string;
  titleEn: string;
  titleBn: string;
  category: 'VERIFICATION' | 'LOGISTICS' | 'HEALTHCARE' | 'BULLETIN';
  status: ActionStatus;
  priority: 'CRITICAL' | 'HIGH' | 'ROUTINE';
  assignedTo: string;
}

const DEFAULT_ACTIONS: ActionItem[] = [
  {
    id: 'act-1',
    titleEn: 'Verify Community Field Report #cr-02 (Submerged Tube Well at Gowainghat)',
    titleBn: 'গোয়াইনঘাটের নলকূপ নিমজ্জিত সংক্রান্ত মাঠপর্যায়ের রিপোর্ট যাচাই',
    category: 'VERIFICATION',
    status: 'in_progress',
    priority: 'CRITICAL',
    assignedTo: 'Union Volunteer Team 1',
  },
  {
    id: 'act-2',
    titleEn: 'Preposition 500 ORS sachets to Tahirpur Hazi Joynal Abedin College',
    titleBn: 'তাহিরপুর হাজী জয়নাল আবেদীন কলেজে ৫০০ প্যাকেট খাবার স্যালাইন বরাদ্দ',
    category: 'LOGISTICS',
    status: 'not_started',
    priority: 'HIGH',
    assignedTo: 'Upazila Relief Officer',
  },
  {
    id: 'act-3',
    titleEn: 'Review emergency boat ambulance route for Chhatak Health Complex',
    titleBn: 'ছাতক উপজেলা স্বাস্থ্য কমপ্লেক্সের ওয়াটার অ্যাম্বুলেন্স রুট সচলতা যাচাই',
    category: 'HEALTHCARE',
    status: 'completed',
    priority: 'HIGH',
    assignedTo: 'Civil Surgeon Emergency Cell',
  },
  {
    id: 'act-4',
    titleEn: 'Publish bilingual draft preparedness bulletin for Surma basin crest',
    titleBn: 'সুরমা নদীর পানি বৃদ্ধি সংক্রান্ত দ্বিভাষিক বুলেটিন খসড়া প্রস্তুত',
    category: 'BULLETIN',
    status: 'not_started',
    priority: 'ROUTINE',
    assignedTo: 'Disaster Information Desk',
  },
  {
    id: 'act-5',
    titleEn: 'Recheck Sarighat gauge calibration against transboundary Cherrapunji surge',
    titleBn: 'চেরাপুঞ্জির পাহাড়ি ঢলের সাথে সারিঘাট গেজের রিডিং সমন্বয় ও যাচাই',
    category: 'VERIFICATION',
    status: 'in_progress',
    priority: 'HIGH',
    assignedTo: 'Hydrology Team',
  },
];

interface IncidentCommandBoardProps {
  locations: LocationData[];
  alerts: AlertItem[];
  language: Language;
}

export const IncidentCommandBoard: React.FC<IncidentCommandBoardProps> = ({
  locations,
  alerts,
  language,
}) => {
  const isBn = language === 'bn';

  const [actions, setActions] = useState<ActionItem[]>(() => {
    return safeGetItem<ActionItem[]>('floodguard_incident_actions', DEFAULT_ACTIONS);
  });

  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const updateActionStatus = (id: string, newStatus: ActionStatus) => {
    const updated = actions.map((act) =>
      act.id === id ? { ...act, status: newStatus } : act
    );
    setActions(updated);
    safeSetItem('floodguard_incident_actions', updated);
  };

  const filtered = actions.filter((act) =>
    filterStatus === 'ALL' ? true : act.status === filterStatus
  );

  const criticalLocations = locations.filter((l) => l.riskLevel === 'CRITICAL');
  const cutOffClinics = SAMPLE_SHELTER_MEDICAL_BOARD.filter(
    (s) => s.clinicAccessStatus === 'CUT_OFF'
  );

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isBn ? 'ইনসিডেন্ট কমান্ড সেন্টার ও অ্যাকশন বোর্ড' : 'Incident Command & Operations Action Board'}
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
              DECISION SUPPORT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isBn
              ? 'মাঠপর্যায়ের ত্রাণ বিতরণ, সেন্সর রি-চেক ও ক্লিনিক অ্যাক্সেস সংক্রান্ত স্থানীয় টাস্ক ম্যানেজমেন্ট।'
              : 'Local exercise task tracking for sensor calibration, shelter logistics, and clinic coordination.'}
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          {(['ALL', 'not_started', 'in_progress', 'completed', 'blocked'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition capitalize ${
                filterStatus === st
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL'
                ? isBn
                  ? 'সব'
                  : 'All'
                : st === 'not_started'
                ? isBn
                  ? 'বাকি'
                  : 'Pending'
                : st === 'in_progress'
                ? isBn
                  ? 'চলমান'
                  : 'Active'
                : st === 'completed'
                ? isBn
                  ? 'সম্পন্ন'
                  : 'Done'
                : isBn
                ? 'স্থগিত'
                : 'Blocked'}
            </button>
          ))}
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-sans">Critical Upazilas</span>
            <span className="text-lg font-bold text-rose-400 block">{criticalLocations.length}</span>
          </div>
          <span className="text-[10px] text-slate-500">Breached Danger Mark</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-sans">Clinic Access Disruptions</span>
            <span className="text-lg font-bold text-amber-400 block">{cutOffClinics.length}</span>
          </div>
          <span className="text-[10px] text-slate-500">Cut-Off Roads</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-sans">Active Tasks</span>
            <span className="text-lg font-bold text-cyan-300 block">
              {actions.filter((a) => a.status !== 'completed').length} / {actions.length}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">In Workflow</span>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-2">
        {filtered.map((action) => {
          const isDone = action.status === 'completed';
          const isBlocked = action.status === 'blocked';
          const isInProgress = action.status === 'in_progress';

          return (
            <div
              key={action.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                isDone
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                  : isInProgress
                  ? 'bg-cyan-950/20 border-cyan-500/30'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isInProgress ? (
                    <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                  ) : isBlocked ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <PauseCircle className="w-4 h-4 text-slate-500" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                      {action.category}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                        action.priority === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {action.priority}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">
                      {action.assignedTo}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-semibold ${
                      isDone ? 'line-through text-slate-400' : 'text-slate-100'
                    }`}
                  >
                    {isBn ? action.titleBn : action.titleEn}
                  </span>
                </div>
              </div>

              {/* Status Change Selector */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <select
                  value={action.status}
                  onChange={(e) => updateActionStatus(action.id, e.target.value as ActionStatus)}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200 focus:outline-none"
                >
                  <option value="not_started">{isBn ? 'শুরু হয়নি' : 'Not Started'}</option>
                  <option value="in_progress">{isBn ? 'চলমান' : 'In Progress'}</option>
                  <option value="completed">{isBn ? 'সম্পন্ন' : 'Completed'}</option>
                  <option value="blocked">{isBn ? 'স্থগিত' : 'Blocked'}</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Non-Statutory Disclaimer */}
      <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
        {isBn
          ? 'লক্ষ্য করুন: এটি একটি প্রোটোটাইপ সমন্বয় বোর্ড। এখানে সংরক্ষিত অ্যাকশনগুলো সরকারি আদেশের বিকল্প নয়।'
          : 'Notice: Operational decision-support board for simulation exercises. Does not represent officially assigned statutory emergency response orders.'}
      </div>
    </div>
  );
};
