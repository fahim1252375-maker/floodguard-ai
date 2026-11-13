import React, { useState } from 'react';
import { Sliders, ArrowRight, Activity, Stethoscope, Droplets, Zap } from 'lucide-react';
import { LocationData, Language } from '../../types';
import { t } from '../../utils/translations';
import { calculateFloodRisk } from '../../utils/floodAlgorithm';
import { computeHealthRisk, estimateStandingWaterDays } from '../../utils/healthRisk';

interface TryItPanelProps {
  locations: LocationData[];
  selectedUpazilaId: string;
  onSelectUpazila: (id: string) => void;
  language: Language;
  onNavigate: (view: string, targetId?: string) => void;
}

export const TryItPanel: React.FC<TryItPanelProps> = ({
  locations,
  selectedUpazilaId,
  onSelectUpazila,
  language,
  onNavigate,
}) => {
  const tr = t[language];
  const [hypotheticalRainMm, setHypotheticalRainMm] = useState<number>(180);
  const [includeUpstreamSurge, setIncludeUpstreamSurge] = useState<boolean>(true);

  const selectedLoc = locations.find((l) => l.id === selectedUpazilaId) || locations[0];

  // 1. Baseline Values
  const baselineFloodRisk = selectedLoc.riskScore;
  const baselineStandingDays = estimateStandingWaterDays(selectedLoc.currentWaterLevel, selectedLoc.dangerLevel);
  const baselineHealth = computeHealthRisk({
    district: selectedLoc.district,
    upazilaEn: selectedLoc.nameEn,
    upazilaBn: selectedLoc.nameBn,
    floodRiskScore: baselineFloodRisk,
    waterLevel: selectedLoc.currentWaterLevel,
    dangerLevel: selectedLoc.dangerLevel,
    standingWaterDays: baselineStandingDays,
  });

  // 2. Simulated Scenario Values
  // Extra stage rise from heavy rainfall & transboundary surge
  const additionalStageM = (hypotheticalRainMm / 300) * 0.9 + (includeUpstreamSurge ? 0.75 : 0);
  const simulatedWaterLevel = Number((selectedLoc.currentWaterLevel + additionalStageM).toFixed(2));
  const simulatedStandingDays = Math.min(10, baselineStandingDays + (simulatedWaterLevel > selectedLoc.dangerLevel ? 2 : 1));

  const simulatedFloodPrediction = calculateFloodRisk(
    {
      locationId: selectedLoc.id,
      waterLevelM: simulatedWaterLevel,
      rainfallMm: hypotheticalRainMm,
      waterLevelChangeM: includeUpstreamSurge ? 0.65 : 0.25,
      rainfallTrend: 'rising',
      durationHours: 24,
      upstreamRainfallMm: includeUpstreamSurge ? 280 : 0,
    },
    selectedLoc
  );

  const simulatedFloodRisk = simulatedFloodPrediction.riskScore;
  const simulatedHealth = computeHealthRisk({
    district: selectedLoc.district,
    upazilaEn: selectedLoc.nameEn,
    upazilaBn: selectedLoc.nameBn,
    floodRiskScore: simulatedFloodRisk,
    waterLevel: simulatedWaterLevel,
    dangerLevel: selectedLoc.dangerLevel,
    standingWaterDays: simulatedStandingDays,
  });

  const getTierColor = (score: number) => {
    if (score >= 75) return 'text-rose-400 bg-rose-500';
    if (score >= 55) return 'text-orange-400 bg-orange-500';
    if (score >= 35) return 'text-amber-400 bg-amber-500';
    return 'text-emerald-400 bg-emerald-500';
  };

  return (
    <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>{tr.tryItTitle}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                SIMULATED
              </span>
            </h2>
            <p className="text-xs text-slate-400">{tr.tryItSubtitle}</p>
          </div>
        </div>

        {/* Upazila Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="tryit-upazila" className="text-xs text-slate-400">
            {tr.upazila}:
          </label>
          <select
            id="tryit-upazila"
            value={selectedUpazilaId}
            onChange={(e) => onSelectUpazila(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:border-cyan-500 focus:outline-none"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {language === 'en' ? loc.nameEn : loc.nameBn} ({loc.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-5 space-y-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {/* Rainfall Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">{tr.rainSliderLabel}</span>
              <span className="font-mono font-bold text-cyan-400 tabular-nums text-sm">
                {hypotheticalRainMm} mm
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={hypotheticalRainMm}
              onChange={(e) => setHypotheticalRainMm(Number(e.target.value))}
              aria-label={tr.rainSliderLabel}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0 mm (Normal)</span>
              <span>250 mm (Heavy)</span>
              <span>500 mm (Extreme)</span>
            </div>
          </div>

          {/* Upstream Surge Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-200 block">
                {tr.upstreamSurgeToggle}
              </span>
              <span className="text-[10px] text-slate-400">
                +280 mm Cherrapunji mountain runoff
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={includeUpstreamSurge}
              onClick={() => setIncludeUpstreamSurge(!includeUpstreamSurge)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                includeUpstreamSurge ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  includeUpstreamSurge ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Open Full Simulator CTA */}
          <button
            onClick={() => onNavigate('simulator', selectedLoc.id)}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-cyan-300 border border-cyan-500/30 hover:bg-slate-800 transition flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span>{tr.openFullSimulator}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Before / After Impact Comparison */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 1. Flood Risk Comparison */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  {tr.riskScore}
                </span>
              </div>

              {/* Baseline Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{tr.baselineRisk}</span>
                  <span className="font-bold text-white">{baselineFloodRisk}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 transition-all duration-300"
                    style={{ width: `${baselineFloodRisk}%` }}
                  />
                </div>
              </div>

              {/* Simulated Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-cyan-300 font-semibold">{tr.projectedRisk}</span>
                  <span className="font-bold text-cyan-300">{simulatedFloodRisk}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${simulatedFloodRisk >= 75 ? 'bg-rose-500' : 'bg-cyan-400'}`}
                    style={{ width: `${simulatedFloodRisk}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Disease Risk Comparison */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-rose-300">
                  <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
                  {tr.healthRiskIndex}
                </span>
              </div>

              {/* Baseline Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{tr.baselineRisk}</span>
                  <span className="font-bold text-white">{baselineHealth.overallScore}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 transition-all duration-300"
                    style={{ width: `${baselineHealth.overallScore}%` }}
                  />
                </div>
              </div>

              {/* Simulated Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-rose-300 font-semibold">{tr.projectedRisk}</span>
                  <span className="font-bold text-rose-400">{simulatedHealth.overallScore}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${simulatedHealth.overallScore >= 75 ? 'bg-rose-500' : 'bg-amber-400'}`}
                    style={{ width: `${simulatedHealth.overallScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 Contributing Factors */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              {tr.topContributingDrivers}
            </span>
            <ul className="space-y-1 text-slate-300">
              {(language === 'en' ? simulatedHealth.topFactorsEn : simulatedHealth.topFactorsBn).map((factor, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
