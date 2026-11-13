import React from 'react';
import { MapPin, AlertTriangle, BellRing, Users, Home } from 'lucide-react';
import { NetworkSummary } from '../../utils/landingSummary';
import { Language } from '../../types';
import { t } from '../../utils/translations';

interface LiveKpiStripProps {
  summary: NetworkSummary;
  language: Language;
}

export const LiveKpiStrip: React.FC<LiveKpiStripProps> = ({ summary, language }) => {
  const tr = t[language];

  const millionsExposed = (summary.totalPopulationExposed / 1_000_000).toFixed(2);

  const kpis = [
    {
      label: tr.monitoredUpazilas,
      value: summary.totalLocations.toString(),
      subtext: `${summary.totalSheltersCount} ${tr.registeredSheltersCount}`,
      provenance: 'BWDB SENSORS',
      icon: MapPin,
      accent: 'text-cyan-400',
    },
    {
      label: tr.highCriticalUpazilas,
      value: summary.highOrCriticalCount.toString(),
      subtext:
        summary.countsByRisk.CRITICAL > 0
          ? `${summary.countsByRisk.CRITICAL} ${language === 'en' ? 'Breaching DL' : 'বিপদসীমার উপরে'}`
          : `${summary.countsByRisk.HIGH} ${language === 'en' ? 'Warning stage' : 'সতর্কসীমায়'}`,
      provenance: 'DERIVED: RISK ALGORITHM',
      icon: AlertTriangle,
      accent: summary.highOrCriticalCount > 0 ? 'text-amber-400' : 'text-emerald-400',
    },
    {
      label: tr.unreadAlertsCount,
      value: summary.totalUnreadAlerts.toString(),
      subtext: `${summary.totalEmergencyAlerts} ${tr.emergencyBulletinsActive}`,
      provenance: 'OFFICIAL & DERIVED',
      icon: BellRing,
      accent: summary.totalEmergencyAlerts > 0 ? 'text-rose-400' : 'text-cyan-400',
    },
    {
      label: tr.populationInFloodExposedAreas,
      value: `${millionsExposed}M`,
      subtext: language === 'en' ? 'Sylhet & Sunamganj Basin' : 'সিলেট ও সুনামগঞ্জ অববাহিকা',
      provenance: 'BBS CENSUS DERIVED',
      icon: Users,
      accent: 'text-emerald-400',
    },
  ];

  return (
    <section aria-label="Network Status Telemetry" className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.accent}`} />
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
                  {kpi.value}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">{kpi.subtext}</div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>PROVENANCE:</span>
                <span className="font-semibold text-slate-300">{kpi.provenance}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
