import React, { useState } from 'react';
import {
  ShieldCheck,
  Radio,
  Satellite,
  FileCheck,
  CloudRain,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Clock,
  Layers,
} from 'lucide-react';
import { Language, SourceType, EvidenceRecord } from '../types';
import { EVIDENCE_RECORDS } from '../data/globalIntelligenceData';
import {
  calculateCompositeQualityScore,
  classifyFreshness,
  detectEvidenceConflicts,
} from '../utils/evidenceFusion';

interface EvidenceFusionViewProps {
  language: Language;
}

export const EvidenceFusionView: React.FC<EvidenceFusionViewProps> = ({ language }) => {
  const [selectedSourceType, setSelectedSourceType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const compositeQuality = calculateCompositeQualityScore(EVIDENCE_RECORDS);
  const conflictReport = detectEvidenceConflicts(EVIDENCE_RECORDS);

  const filteredRecords = EVIDENCE_RECORDS.filter((rec) => {
    const matchesType = selectedSourceType === 'ALL' || rec.sourceType === selectedSourceType;
    const matchesSearch =
      rec.sourceOrganization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.stationOrArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.parameterName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getSourceTypeBadge = (type: SourceType) => {
    switch (type) {
      case 'DIRECT_SENSOR':
        return {
          icon: Radio,
          label: 'Simulated Demo Record',
          className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'OFFICIAL_BULLETIN':
        return {
          icon: FileCheck,
          label: 'Simulated Demo Record',
          className: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      case 'SATELLITE_OBSERVATION':
        return {
          icon: Satellite,
          label: 'Simulated Demo Record',
          className: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
      case 'WEATHER_FORECAST':
        return {
          icon: CloudRain,
          label: 'Simulated Demo Record',
          className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      case 'COMMUNITY_REPORT':
      case 'SIMULATED_DEMO':
        return {
          icon: Layers,
          label: 'Simulated Demo Record',
          className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      default:
        return {
          icon: Layers,
          label: type,
          className: 'bg-slate-700 text-slate-300 border-slate-600',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {language === 'en' ? 'Evidence Provenance Workflow Demo' : 'তথ্যের উৎস যাচাইয়ের ডেমো'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                STATIC SAMPLE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'en' ? 'Evidence Provenance Demo Ledger' : 'এভিডেন্স ফিউশন ইন্টেলিজেন্স লেজার'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              {language === 'en'
                ? 'This screen uses bundled example records to demonstrate provenance, freshness labels and conflict checks. No live BWDB, ESA, NASA, FFWC, BMD or volunteer feed is connected here; sample scores are illustrative, not verified data quality or statistical confidence.'
                : 'এই স্ক্রিনে তথ্যের উৎস, freshness label এবং conflict check বোঝাতে অ্যাপের সঙ্গে থাকা নমুনা রেকর্ড দেখানো হয়। এখানে BWDB, ESA, NASA, FFWC, BMD বা স্বেচ্ছাসেবকদের কোনো live feed যুক্ত নেই; স্কোরগুলো কেবল উদাহরণ।'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {language === 'en' ? 'Sample Score' : 'নমুনা স্কোর'}
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {compositeQuality}%
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {language === 'en' ? 'Demo Record Check' : 'ডেমো রেকর্ড পরীক্ষা'}
              </span>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded inline-block mt-1 ${
                  conflictReport.conflictDetected
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {conflictReport.conflictDetected ? 'SAMPLE FLAGGED' : 'NO SAMPLE FLAGS'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo data disclosure */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-100 leading-relaxed">
        <strong className="block mb-1 text-amber-300">{language === 'en' ? 'SIMULATED DEMO — NOT CONNECTED' : 'সিমুলেটেড ডেমো — কোনো live সংযোগ নেই'}</strong>
        {language === 'en'
          ? 'Every row below is a static illustrative example, not a real sensor, satellite pass, official bulletin or verified community report. The sample score is a UI demonstration only. “No sample flags” does not mean that real-world sources agree.'
          : 'নিচের প্রতিটি সারি স্থির উদাহরণ; এটি বাস্তব সেন্সর, স্যাটেলাইট পাস, সরকারি বুলেটিন বা যাচাইকৃত কমিউনিটি রিপোর্ট নয়। নমুনা স্কোরটি শুধু UI ডেমো। “কোনো sample flag নেই” মানে বাস্তব উৎসগুলোর মধ্যে মিল আছে—এমন নয়।'}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            {language === 'en' ? 'Source Channel:' : 'উৎস চ্যানেল:'}
          </span>
          <select
            value={selectedSourceType}
            onChange={(e) => setSelectedSourceType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
          >
            <option value="ALL">{language === 'en' ? 'All Channels (Fusion View)' : 'সকল উৎস'}</option>
            <option value="SIMULATED_DEMO">Simulated Demo Records</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search by station, source, or param...' : 'স্টেশন বা উৎস দিয়ে খুঁজুন...'}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Evidence Ledger Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            {language === 'en' ? 'Illustrative Record Ledger' : 'টেলিমেট্রি প্রোভেন্যান্স ও ক্যালিব্রেশন লেজার'}
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {filteredRecords.length} static sample records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-semibold bg-slate-950/60">
                <th className="py-3 px-4">Source & Organization</th>
                <th className="py-3 px-4">Station / Grid Area</th>
                <th className="py-3 px-4">Parameter & Observed Value</th>
                <th className="py-3 px-4">Freshness & Sync</th>
                <th className="py-3 px-4">Sample Score</th>
                <th className="py-3 px-4">Audit Verification Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRecords.map((rec) => {
                const badge = getSourceTypeBadge(rec.sourceType);
                const BadgeIcon = badge.icon;
                const freshness = classifyFreshness(rec.observationTimestamp);

                return (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${badge.className}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-200 mt-1 block">
                        {rec.sourceOrganization}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {rec.sourceId}</span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-200">
                      {rec.stationOrArea}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-400 text-[11px] block">{rec.parameterName}</span>
                      <span className="font-mono text-sm font-bold text-cyan-300">
                        {rec.observedValue} <span className="text-xs font-normal text-slate-400">{rec.unit}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            freshness === 'FRESH'
                              ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                              : freshness === 'AGING'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-mono font-bold text-slate-200">{rec.observationTimestamp}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{rec.retrievalTimestamp}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-sm ${
                            rec.qualityScore >= 90
                              ? 'text-emerald-400'
                              : rec.qualityScore >= 75
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {rec.qualityScore}%
                        </span>
                      </div>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${
                            rec.qualityScore >= 90
                              ? 'bg-emerald-500'
                              : rec.qualityScore >= 75
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${rec.qualityScore}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs leading-relaxed">
                      {rec.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
