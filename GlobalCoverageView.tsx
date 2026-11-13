import React, { useState } from 'react';
import {
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { Language, DataCoverageStatus } from '../types';
import { GLOBAL_COUNTRIES } from '../data/globalIntelligenceData';

interface GlobalCoverageViewProps {
  language: Language;
}

export const GlobalCoverageView: React.FC<GlobalCoverageViewProps> = ({ language }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCountries = GLOBAL_COUNTRIES.filter((country) => {
    const matchesStatus =
      selectedStatus === 'ALL' || country.coverageStatus === selectedStatus;
    const matchesSearch =
      country.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.primaryBasinName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.continent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: DataCoverageStatus) => {
    switch (status) {
      case 'verified_connected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            VERIFIED CONNECTED
          </span>
        );
      case 'partially_connected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 font-mono">
            <Clock className="w-3 h-3 text-cyan-400" />
            PARTIALLY CONNECTED
          </span>
        );
      case 'historical_only':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 font-mono">
            <Layers className="w-3 h-3 text-amber-400" />
            HISTORICAL ARCHIVE ONLY
          </span>
        );
      case 'simulated_demo':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 font-mono">
            SIMULATED DEMO
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600 font-mono">
            NO CONNECTION
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 border border-blue-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {language === 'en' ? 'Illustrative Global Basin Portfolio' : 'গ্লোবাল রিভার বেসিন কভারেজ মডেল'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                STATIC DEMO DATA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'en' ? 'Global Flood Intelligence Coverage' : 'আন্তর্জাতিক বন্যা পূর্বাভাস নেটওয়ার্ক ও কভারেজ'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              {language === 'en'
                ? 'An illustrative portfolio map of river basins that could be supported in future. No national hydrology agency telemetry adapters are connected in this release.'
                : 'ভবিষ্যতে সম্প্রসারণযোগ্য নদী অববাহিকার একটি নমুনা তালিকা। এই সংস্করণে কোনো জাতীয় হাইড্রোলজি সংস্থার live telemetry adapter যুক্ত নেই।'}
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-right self-start md:self-auto">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Example Basins
            </span>
            <span className="text-xl font-bold font-mono text-cyan-400">
              {GLOBAL_COUNTRIES.length} Examples
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            {language === 'en' ? 'Portfolio Status:' : 'সংযোগের অবস্থা:'}
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
          >
            <option value="ALL">All Statuses (Global View)</option>
                        <option value="simulated_demo">Simulated Demo Portfolio</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search country, basin, or region...' : 'দেশ বা নদী অববাহিকা খুঁজুন...'}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Countries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCountries.map((country) => (
          <div
            key={country.code}
            className={`p-5 rounded-xl border transition-all ${
              country.code === 'BD'
                ? 'bg-slate-900/90 border-cyan-500/50 shadow-md shadow-cyan-950/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">
                    {language === 'en' ? country.nameEn : country.nameBn}
                  </h3>
                  {country.code === 'BD' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      CORE PILOT
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {country.continent} • {country.primaryBasinName}
                </span>
              </div>

              {getStatusBadge(country.coverageStatus)}
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{country.notes}</p>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Connection Status</span>
                <span className="font-mono text-cyan-300 font-semibold text-[11px] block mt-0.5">
                  {country.dataLatencyDesc}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Illustrative Nodes</span>
                <span className="font-mono text-slate-200 font-bold text-sm block mt-0.5">
                  {country.stationsCount} Example nodes
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400">Reference agencies (not connected):</span>
              {country.referenceAgencies.map((agency, aIdx) => (
                <span
                  key={aIdx}
                  className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]"
                >
                  {agency}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
