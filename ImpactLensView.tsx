import React, { useState } from 'react';
import {
  Building2,
  HeartPulse,
  Zap,
  ShieldAlert,
  Car,
  Home,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Layers,
  MapPin,
} from 'lucide-react';
import { Language, InfrastructureAsset } from '../types';
import { INFRASTRUCTURE_ASSETS } from '../data/globalIntelligenceData';

interface ImpactLensViewProps {
  language: Language;
}

export const ImpactLensView: React.FC<ImpactLensViewProps> = ({ language }) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredAssets = INFRASTRUCTURE_ASSETS.filter((asset) => {
    const matchesType = selectedType === 'ALL' || asset.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || asset.currentStatus === selectedStatus;
    return matchesType && matchesStatus;
  });

  const totalMonitored = INFRASTRUCTURE_ASSETS.length;
  const atRiskCount = INFRASTRUCTURE_ASSETS.filter((a) => a.currentStatus === 'AT_RISK').length;
  const inundatedCount = INFRASTRUCTURE_ASSETS.filter(
    (a) => a.currentStatus === 'INUNDATED' || a.currentStatus === 'ACCESS_CUT'
  ).length;
  const operationalCount = INFRASTRUCTURE_ASSETS.filter(
    (a) => a.currentStatus === 'OPERATIONAL'
  ).length;

  const getTypeIcon = (type: InfrastructureAsset['type']) => {
    switch (type) {
      case 'hospital':
      case 'clinic':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'power_substation':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'shelter':
        return <Home className="w-4 h-4 text-cyan-400" />;
      case 'bridge':
      case 'major_road':
        return <Car className="w-4 h-4 text-blue-400" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: InfrastructureAsset['currentStatus']) => {
    switch (status) {
      case 'OPERATIONAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            OPERATIONAL
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            AT RISK
          </span>
        );
      case 'INUNDATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            INUNDATED
          </span>
        );
      case 'ACCESS_CUT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            ACCESS CUT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {language === 'en' ? 'Critical Infrastructure Vulnerability' : 'গুরুত্বপূর্ণ স্থাপনা ও অবকাঠামো ঝুঁকি'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                Asset Exposure Audit
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'en' ? 'ImpactLens: Lifeline Asset Exposure' : 'ইমপ্যাক্টলেন্স: জরুরি অবকাঠামো পর্যবেক্ষণ'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              {language === 'en'
                ? 'Monitors high-value emergency assets across Sylhet and Sunamganj. Evaluates hospitals, electrical substations, highway bridges, and evacuation shelters against real-time inundation tolerances.'
                : 'সিলেট ও সুনামগঞ্জের হাসপাতাল, বিদ্যুৎ উপকেন্দ্র, সড়ক সেতু এবং জরুরি আশ্রয়কেন্দ্রের বন্যা ঝুঁকি ও নিষ্ক্রিয়তার রিয়েল-টাইম অডিট।'}
            </p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-2 self-start md:self-auto">
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block">Operational</span>
              <span className="text-base font-bold font-mono text-emerald-400">{operationalCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block">At Risk</span>
              <span className="text-base font-bold font-mono text-amber-400">{atRiskCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block">Inundated / Cut</span>
              <span className="text-base font-bold font-mono text-rose-400">{inundatedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            {language === 'en' ? 'Asset Category:' : 'স্থাপনা শ্রেণি:'}
          </span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
          >
            <option value="ALL">All Lifeline Assets</option>
            <option value="hospital">Hospitals & Medical Centers</option>
            <option value="clinic">Upazila Health Clinics</option>
            <option value="shelter">Designated Flood Shelters</option>
            <option value="power_substation">Power Grid Substations</option>
            <option value="bridge">Highway Bridges</option>
            <option value="major_road">Major Arterial Roads</option>
          </select>

          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-2">
            Status:
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPERATIONAL">Operational</option>
            <option value="AT_RISK">At Risk</option>
            <option value="INUNDATED">Inundated</option>
            <option value="ACCESS_CUT">Access Cut Off</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredAssets.length} of {totalMonitored} Facilities
        </span>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => {
          const margin = Number((asset.floodToleranceM - asset.elevationM).toFixed(2));

          return (
            <div
              key={asset.id}
              className={`p-4 rounded-xl border transition-all ${
                asset.currentStatus === 'INUNDATED' || asset.currentStatus === 'ACCESS_CUT'
                  ? 'bg-rose-950/20 border-rose-900/60'
                  : asset.currentStatus === 'AT_RISK'
                  ? 'bg-amber-950/20 border-amber-900/50'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getTypeIcon(asset.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 leading-snug">{asset.name}</h3>
                    <span className="text-xs text-slate-400">
                      {asset.upazilaEn}, {asset.district}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {getStatusBadge(asset.currentStatus)}
                <span className="text-[10px] text-slate-400 font-mono">
                  Verified {asset.lastVerified}
                </span>
              </div>

              {/* Physical Parameters */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Elevation</span>
                  <span className="font-mono font-bold text-slate-200">{asset.elevationM}m MSL</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Tolerance</span>
                  <span className="font-mono font-bold text-cyan-400">{asset.floodToleranceM}m MSL</span>
                </div>
                {asset.capacity && (
                  <div className="col-span-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase">Emergency Capacity</span>
                    <span className="font-mono font-bold text-amber-400">
                      {asset.capacity.toLocaleString()} persons / beds
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
