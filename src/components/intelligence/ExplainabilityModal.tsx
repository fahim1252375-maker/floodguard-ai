import React from 'react';
import {
  X,
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { LocationData, Language } from '../../types';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationData;
  language: Language;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  isOpen,
  onClose,
  location,
  language,
}) => {
  if (!isOpen) return null;

  const isBn = language === 'bn';
  const deltaDL = Number((location.currentWaterLevel - location.dangerLevel).toFixed(2));
  const isAboveDL = deltaDL >= 0;

  // Transparent Contribution Factors (Rule-based weights, never falsely labeled SHAP)
  const factors = [
    {
      nameEn: 'Current Water Level vs Danger Mark',
      nameBn: 'বর্তমান পানির উচ্চতা বনাম বিপদসীমা',
      value: `${location.currentWaterLevel.toFixed(2)}m (DL ${location.dangerLevel.toFixed(2)}m)`,
      contribution: 40,
      direction: isAboveDL ? 'increases' : 'moderate',
      source: 'Demo/reference station input; no live BWDB gauge adapter',
      provenance: 'SIMULATED',
    },
    {
      nameEn: 'Transboundary Cherrapunji Inflow',
      nameBn: 'চেরাপুঞ্জি উজান পাহাড়ি ঢল',
      value: `${location.upstreamRainfallMm} mm / 24h`,
      contribution: 15,
      direction: location.upstreamRainfallMm > 100 ? 'increases' : 'neutral',
      source: 'Weather API when available; fallback may be simulated',
      provenance: 'WEATHER INPUT',
    },
    {
      nameEn: 'River Stage Rate of Rise (Momentum)',
      nameBn: 'নদীর পানি বৃদ্ধির হার (মোমেন্টাম)',
      value: `${location.waterLevelChange24h >= 0 ? '+' : ''}${location.waterLevelChange24h.toFixed(2)}m / 24h`,
      contribution: 15,
      direction: location.waterLevelChange24h > 0.2 ? 'increases' : 'receding',
      source: 'Demo/reference stage input; not rolling live telemetry',
      provenance: 'SIMULATED',
    },
    {
      nameEn: 'Local Precipitation & Haor Saturation',
      nameBn: 'স্থানীয় বৃষ্টিপাত ও মাটির সম্পৃক্ততা',
      value: `${location.rainfall24h} mm, Saturation ${location.soilSaturationPercent}%`,
      contribution: 30,
      direction: 'increases',
      source: 'Open-Meteo when available; fallback may be simulated',
      provenance: 'WEATHER INPUT',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isBn ? 'মডেল ব্যাখ্যা ও তথ্যের উৎস' : 'Model explanation and data provenance'}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-5 text-xs max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-300 border border-purple-500/30">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isBn ? 'মডেল ব্যাখ্যা ও তথ্যের উৎস' : 'Model Explanation & Data Sources'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                  {isBn ? location.nameBn : location.nameEn}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isBn
                  ? 'নিয়মভিত্তিক স্কোর কীভাবে তৈরি হয় এবং কোন তথ্য ব্যবহার করে তা দেখুন।'
                  : 'A plain-language view of the rule-based score and the limits of its input data.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Data provenance and model limitations: these are factual status notes, not confidence ratings. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block">
              {isBn ? '১. আবহাওয়ার তথ্য' : '1. Weather input'}
            </span>
            <div className="text-sm font-bold text-white">{isBn ? 'API / fallback' : 'API / fallback'}</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {isBn ? 'Open-Meteo পাওয়া গেলে বৃষ্টির তথ্য দেয়; সংযোগ না থাকলে নমুনা তথ্য থাকতে পারে। এটি নদীর গেজ রিডিং নয়।' : 'Open-Meteo rainfall is used when reachable; fallback values may be demo data. Rainfall is not a river-gauge reading.'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">
              {isBn ? '২. নদীর পানির স্তর' : '2. River-stage input'}
            </span>
            <div className="text-sm font-bold text-white">{isBn ? 'নমুনা / রেফারেন্স' : 'Demo / reference'}</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {isBn ? 'এই রিলিজে লাইভ BWDB গেজ সংযোগ নেই। স্টেশনের স্তর ও পরিবর্তনকে বাস্তব সেন্সর পর্যবেক্ষণ মনে করবেন না।' : 'This release has no live BWDB gauge adapter. Treat station level and change values as demo/reference inputs, not sensor observations.'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-purple-400 font-bold block">
              {isBn ? '৩. মডেল পদ্ধতি' : '3. Model method'}
            </span>
            <div className="text-sm font-bold text-white">{isBn ? 'নিয়মভিত্তিক' : 'Rule-based'}</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {isBn ? 'হাতে নির্ধারিত ওজন ব্যবহার করা হয়; পরিসংখ্যানগত সম্ভাবনা, ক্যালিব্রেশন বা মাঠপর্যায়ের বৈধতা দাবি করা হয় না।' : 'Hand-set weights are used; probabilities, statistical calibration and field validation are not claimed.'}
            </p>
          </div>
        </div>

        {/* Contribution Factors Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-200 uppercase tracking-wide text-xs">
              {isBn ? 'ঝুঁকি নির্ধারণে বিভিন্ন উপাদানের অবদান' : 'Contributing Model Factors Breakdown'}
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Total Score: {location.riskScore}/100</span>
          </div>

          <div className="space-y-2.5">
            {factors.map((f, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {f.direction === 'increases' ? (
                      <TrendingUp className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-100">
                      {isBn ? f.nameBn : f.nameEn}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {f.provenance}
                    </span>
                    <span className="font-bold text-white">{f.contribution} max points</span>
                  </div>
                </div>

                {/* Contribution Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      f.direction === 'increases' ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${(f.contribution / 40) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono text-slate-300">{f.value}</span>
                  <span className="truncate max-w-[280px]">{f.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations & Scientific Notice */}
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isBn ? 'মডেল সীমাবদ্ধতা ও বৈজ্ঞানিক সতর্কতা' : 'Model Limitations & Uncertainty Disclosure'}</span>
          </div>
          <p>
            {isBn
              ? 'এটি একটি একাডেমিক সিদ্ধান্ত-সহায়ক নমুনা, সরকারি সতর্কবার্তা নয়। স্টেশনের পানির স্তর নমুনা/রেফারেন্স তথ্য; নিয়মভিত্তিক স্কোর মাঠপর্যায়ে যাচাই বা সম্ভাবনা-হিসেবে ক্যালিব্রেট করা হয়নি। সরকারি FFWC/DDM নির্দেশনা ও স্থানীয় তথ্য অনুসরণ করুন.'
              : 'This is an academic decision-support prototype, not an official warning. Station stage values are demo/reference inputs; the hand-weighted score is not field-validated or probability-calibrated. Follow official FFWC/DDM guidance and local authorities.'}
          </p>
        </div>
      </div>
    </div>
  );
};
