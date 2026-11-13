import React from 'react';
import { Database, CheckCircle2, Cpu, Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/translations';

interface ProvenanceStripProps {
  language: Language;
  onNavigate: (view: string) => void;
}

export const ProvenanceStrip: React.FC<ProvenanceStripProps> = ({ language, onNavigate }) => {
  const tr = t[language];

  return (
    <section className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-950 text-cyan-400 border border-slate-800">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base tracking-wide">
              {tr.provenanceTitle}
            </h3>
            <p className="text-xs text-slate-400">{tr.provenanceSubtitle}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('about')}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto min-h-[36px]"
        >
          <span>{tr.learnMoreMethodology}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LIVE DATA */}
        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {tr.provenanceLive}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
              OPERATIONAL API
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {tr.provenanceLiveDesc}
          </p>
        </div>

        {/* DERIVED MODELS */}
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              {tr.provenanceDerived}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
              STATISTICAL / OLS
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {tr.provenanceDerivedDesc}
          </p>
        </div>

        {/* SIMULATED BENCHMARKS */}
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {tr.provenanceSimulated}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
              CALIBRATED BENCHMARKS
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {tr.provenanceSimulatedDesc}
          </p>
        </div>
      </div>
    </section>
  );
};
