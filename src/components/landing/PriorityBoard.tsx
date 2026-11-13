import React from 'react';
import { ArrowRight, AlertTriangle, Stethoscope, Navigation, CheckCircle2, XCircle } from 'lucide-react';
import { PriorityUpazilaItem } from '../../utils/landingSummary';
import { Language } from '../../types';
import { t } from '../../utils/translations';

interface PriorityBoardProps {
  priorityUpazilas: PriorityUpazilaItem[];
  language: Language;
  onNavigate: (view: string, targetId?: string) => void;
}

export const PriorityBoard: React.FC<PriorityBoardProps> = ({
  priorityUpazilas,
  language,
  onNavigate,
}) => {
  const tr = t[language];

  const getClinicBadge = (status: PriorityUpazilaItem['clinicAccessStatus']) => {
    switch (status) {
      case 'PASSABLE':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            PASSABLE
          </span>
        );
      case 'WATERLOGGED':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            WATERLOGGED
          </span>
        );
      case 'CUT_OFF':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-400" />
            CUT OFF
          </span>
        );
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              {tr.priorityBoardTitle}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              DERIVED RANKING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{tr.priorityBoardSubtitle}</p>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto min-h-[36px]"
        >
          <span>{tr.viewAllStations}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Priority Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {priorityUpazilas.map((item, idx) => {
          const loc = item.location;
          const deltaDL = loc.currentWaterLevel - loc.dangerLevel;
          const isBreached = deltaDL >= 0;
          const topDisease = item.healthRisk.diseaseBreakdown[0];

          return (
            <div
              key={loc.id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-lg"
            >
              <div className="space-y-3">
                {/* Card Top: Rank & Upazila Name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center text-slate-300">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {language === 'en' ? loc.nameEn : loc.nameBn}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {loc.district} • {language === 'en' ? loc.riverNameEn : loc.riverNameBn}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      loc.riskLevel === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                        : loc.riskLevel === 'HIGH'
                        ? 'bg-orange-950 text-orange-300 border border-orange-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {loc.riskLevel}
                  </span>
                </div>

                {/* Hydrological Stage Readout */}
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{tr.waterLevel}:</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {loc.currentWaterLevel.toFixed(2)}m
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{tr.dangerLevel}:</span>
                    <span className="font-mono text-slate-300 tabular-nums">
                      {loc.dangerLevel.toFixed(2)}m
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono pt-1 border-t border-slate-900">
                    <span className="text-slate-400">Delta vs DL:</span>
                    <span className={`font-bold ${isBreached ? 'text-rose-400' : 'text-slate-300'}`}>
                      {isBreached ? `+${deltaDL.toFixed(2)}m DL` : `${Math.abs(deltaDL).toFixed(2)}m below DL`}
                    </span>
                  </div>
                </div>

                {/* Primary Disease Vector & Clinic Status */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-rose-300 flex items-center gap-1 font-medium">
                      <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
                      <span>{language === 'en' ? topDisease?.nameEn : topDisease?.nameBn}:</span>
                    </span>
                    <span className="font-mono font-bold text-rose-300">
                      {topDisease?.score}/100 ({topDisease?.tier})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{tr.clinicAccessStatus}:</span>
                    </span>
                    <div>{getClinicBadge(item.clinicAccessStatus)}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Predict & Health Watch */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => onNavigate('prediction', loc.id)}
                  className="py-2 px-3 rounded-lg text-xs font-semibold bg-slate-950 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-900 transition flex items-center justify-center gap-1 min-h-[38px]"
                >
                  <span>{tr.viewPrediction}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onNavigate('healthWatch', loc.id)}
                  className="py-2 px-3 rounded-lg text-xs font-semibold bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/70 transition flex items-center justify-center gap-1 min-h-[38px]"
                >
                  <Stethoscope className="w-3 h-3 text-rose-400" />
                  <span>{tr.viewHealthWatch}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
