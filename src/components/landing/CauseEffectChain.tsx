import React, { useState } from 'react';
import {
  CloudRain,
  Waves,
  Droplet,
  Stethoscope,
  Navigation,
  ArrowRight,
  ExternalLink,
  Info,
  X,
  Code,
  CheckCircle2,
} from 'lucide-react';
import { LocationData, Language } from '../../types';
import { t } from '../../utils/translations';
import { computeHealthRisk, estimateStandingWaterDays, SAMPLE_SHELTER_MEDICAL_BOARD } from '../../utils/healthRisk';

interface CauseEffectChainProps {
  locations: LocationData[];
  selectedUpazilaId: string;
  onSelectUpazila: (id: string) => void;
  language: Language;
  onNavigate: (view: string, targetId?: string) => void;
  cherrapunjiRainfall24h?: number;
}

export const CauseEffectChain: React.FC<CauseEffectChainProps> = ({
  locations,
  selectedUpazilaId,
  onSelectUpazila,
  language,
  onNavigate,
  cherrapunjiRainfall24h = 0,
}) => {
  const tr = t[language];
  const selectedLoc = locations.find((l) => l.id === selectedUpazilaId) || locations[0];
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  const standingDays = estimateStandingWaterDays(selectedLoc.currentWaterLevel, selectedLoc.dangerLevel);
  const healthRisk = computeHealthRisk({
    district: selectedLoc.district,
    upazilaEn: selectedLoc.nameEn,
    upazilaBn: selectedLoc.nameBn,
    floodRiskScore: selectedLoc.riskScore,
    waterLevel: selectedLoc.currentWaterLevel,
    dangerLevel: selectedLoc.dangerLevel,
    standingWaterDays: standingDays,
  });

  const deltaDL = selectedLoc.currentWaterLevel - selectedLoc.dangerLevel;
  const isBreached = deltaDL >= 0;

  const matchedShelter = SAMPLE_SHELTER_MEDICAL_BOARD.find(
    (s) =>
      s.upazilaEn.toLowerCase().includes(selectedLoc.nameEn.toLowerCase()) ||
      selectedLoc.nameEn.toLowerCase().includes(s.upazilaEn.toLowerCase())
  );

  const clinicStatus = matchedShelter?.clinicAccessStatus || (deltaDL >= 0.5 ? 'CUT_OFF' : deltaDL >= 0 ? 'WATERLOGGED' : 'PASSABLE');
  const clinicName = language === 'en' ? matchedShelter?.nearestClinicEn || 'Upazila Health Complex' : matchedShelter?.nearestClinicBn || 'উপজেলা স্বাস্থ্য কমপ্লেক্স';

  const steps = [
    {
      num: '01',
      title: tr.step1Title,
      icon: CloudRain,
      metric: `${cherrapunjiRainfall24h.toFixed(1)} mm`,
      metricLabel: language === 'en' ? 'Cherrapunji 24h Rainfall' : 'চেরাপুঞ্জি ২৪ ঘণ্টার বৃষ্টি',
      desc: tr.step1Desc,
      targetView: 'basinTwin',
      badge: 'LIVE: METEO',
      accent: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20',
      formula: 'Q_upstream = C * P_cherrapunji * A_catchment / lag_hours',
      scientificLinkEn: 'Orographic precipitation on the southern Khasi-Jaintia ridge creates immediate violent runoff into Surma-Kushiyara headwaters.',
      scientificLinkBn: 'খাসিয়া পাহাড়ের খাড়া ঢালে মেঘ আটকে অতিভারী বৃষ্টি সরাসরি সুরমা ও কুশিয়ারার উজানে পাহাড়ি ঢল তৈরি করে।',
      variables: [
        { name: 'P_cherrapunji', value: `${cherrapunjiRainfall24h.toFixed(1)} mm / 24h`, note: 'Live Open-Meteo Cherrapunji gauge' },
        { name: 'Hydrological Lag (τ)', value: `${selectedLoc.travelLagHours ?? 4.5} hours`, note: 'Downstream transit time to this upazila' },
        { name: 'Catchment Area', value: '~11,200 sq km', note: 'Transboundary Surma-Meghalaya watershed' },
      ],
    },
    {
      num: '02',
      title: tr.step2Title,
      icon: Waves,
      metric: `${selectedLoc.currentWaterLevel.toFixed(2)}m`,
      metricLabel: `${isBreached ? '+' : ''}${deltaDL.toFixed(2)}m ${isBreached ? (language === 'en' ? 'above DL' : 'বিপদসীমার উপরে') : (language === 'en' ? 'below DL' : 'বিপদসীমার নিচে')}`,
      desc: tr.step2Desc,
      targetView: 'dashboard',
      badge: 'BWDB BENCHMARK',
      accent: isBreached ? 'border-rose-500/40 text-rose-400 bg-rose-950/20' : 'border-amber-500/40 text-amber-400 bg-amber-950/20',
      formula: 'Delta_DL = H_stage - H_danger;  Trend = Delta_stage_24h',
      scientificLinkEn: 'River stage measured against Bangladesh Water Development Board surveyed danger datum. Positive delta indicates immediate bank overflow.',
      scientificLinkBn: 'পাউবো নির্ধারিত বিপদসীমার তুলনায় পানির উচ্চতা। ধনাত্মক মান নির্দেশ করে নদী উপচে লোকালয় প্লাবিত হচ্ছে।',
      variables: [
        { name: 'Current Water Level', value: `${selectedLoc.currentWaterLevel.toFixed(2)} m MSL`, note: 'River telemetry benchmark' },
        { name: 'Danger Mark (DL)', value: `${selectedLoc.dangerLevel.toFixed(2)} m MSL`, note: 'Official FFWC threshold' },
        { name: '24h Rate of Rise', value: `${selectedLoc.waterLevelChange24h >= 0 ? '+' : ''}${selectedLoc.waterLevelChange24h.toFixed(2)} m/24h`, note: 'Momentum indicator' },
      ],
    },
    {
      num: '03',
      title: tr.step3Title,
      icon: Droplet,
      metric: `${standingDays} ${language === 'en' ? 'Days' : 'দিন'}`,
      metricLabel: language === 'en' ? 'Submerged tube wells & latrines' : 'তলিয়ে যাওয়া অগভীর নলকূপ',
      desc: tr.step3Desc,
      targetView: 'satellite',
      badge: 'DERIVED HYDROLOGY',
      accent: standingDays >= 3 ? 'border-amber-500/40 text-amber-400 bg-amber-950/20' : 'border-slate-700 text-slate-300 bg-slate-900',
      formula: 'StandingDays = max(0, ceil(Delta_DL / 0.15 m_drainage_per_day))',
      scientificLinkEn: 'Natural bowl-shaped saucer topography in the Sylhet haor depression traps floodwater behind polders, submerging shallow tube wells and pit latrines.',
      scientificLinkBn: 'হাওরের বাটির মতো ভৌগোলিক গঠনের কারণে বাঁধ ও পল্ডারের ভেতর পানি জমে থাকে, যা অগভীর নলকূপ ও টয়লেট ডুবিয়ে দেয়।',
      variables: [
        { name: 'Estimated Standing Water', value: `${standingDays} days`, note: 'Hydrological drainage duration' },
        { name: 'Haor Soil Saturation', value: `${selectedLoc.soilSaturationPercent}%`, note: 'Ground moisture absorption capacity' },
        { name: 'Drainage Rate', value: '15 cm / day', note: 'Standard Sylhet post-monsoon sluice outflow' },
      ],
    },
    {
      num: '04',
      title: tr.step4Title,
      icon: Stethoscope,
      metric: `${healthRisk.overallScore}/100`,
      metricLabel: `${healthRisk.overallTier} ${language === 'en' ? 'Disease Vulnerability' : 'রোগ ঝুঁকি'}`,
      desc: tr.step4Desc,
      targetView: 'healthWatch',
      badge: 'HEALTH RISK INDEX',
      accent: healthRisk.overallScore >= 70 ? 'border-rose-500/40 text-rose-400 bg-rose-950/20' : 'border-amber-500/40 text-amber-400 bg-amber-950/20',
      formula: 'Score = (FloodRisk * 0.45) + (StandingDays * 5.5) + (ShelterCrowding * 25) + BreachedBonus(15)',
      scientificLinkEn: 'Heuristic index with hand-set weights, not fitted to surveillance data or clinically validated. Standing contaminated water is a recognised driver of waterborne disease such as cholera and typhoid.',
      scientificLinkBn: 'এটি হাতে-নির্ধারিত ওজনভিত্তিক একটি ঝুঁকি সূচক; ক্লিনিক্যালি যাচাইকৃত নয়। আবদ্ধ দূষিত পানি ডায়রিয়া, কলেরা ও চর্মরোগের ঝুঁকি বাড়াতে পারে।',
      variables: [
        { name: 'Cholera / Diarrhoea Score', value: `${healthRisk.diseases?.cholera.score ?? 45}/100 (${healthRisk.diseases?.cholera.tier ?? 'MODERATE'})`, note: 'Primary waterborne threat' },
        { name: 'Typhoid Score', value: `${healthRisk.diseases?.typhoid.score ?? 40}/100 (${healthRisk.diseases?.typhoid.tier ?? 'MODERATE'})`, note: 'Enteric fever transmission' },
        { name: 'Snakebite Risk', value: `${healthRisk.diseases?.snakebite.score ?? 35}/100`, note: 'Driven by loss of dry high ground' },
      ],
    },
    {
      num: '05',
      title: tr.step5Title,
      icon: Navigation,
      metric: clinicStatus,
      metricLabel: clinicName,
      desc: tr.step5Desc,
      targetView: 'routeSafe',
      badge: 'ROUTESAFE GIS',
      accent: clinicStatus === 'CUT_OFF' ? 'border-rose-500/40 text-rose-400 bg-rose-950/20' : clinicStatus === 'WATERLOGGED' ? 'border-amber-500/40 text-amber-400 bg-amber-950/20' : 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
      formula: 'PrepositionNeed = DisplacedPop * 2 sachets/day;  AccessStatus = f(RoadSubmergence)',
      scientificLinkEn: 'When road links submerge, medical transit relies entirely on engine country boats. Prepositioning supplies before the crest arrives prevents supply chain failure.',
      scientificLinkBn: 'সড়ক নিমজ্জিত হলে স্বাস্থ্য কমপ্লেক্সে সাধারণ যাতায়াত বন্ধ হয়ে যায়। পানি নামার আগেই স্যালাইন ও ওষুধ মজুত রাখা জীবন রক্ষাকারী।',
      variables: [
        { name: 'Access Classification', value: clinicStatus, note: clinicStatus === 'CUT_OFF' ? 'Boats required' : 'Motorized passable' },
        { name: 'Displaced Population (Est.)', value: `${(selectedLoc.displacedEstimated ?? Math.round(selectedLoc.populationExposed * 0.12)).toLocaleString()} people`, note: 'Evacuees in shelters/relatives' },
        { name: 'Daily ORS Requirement', value: `${((selectedLoc.displacedEstimated ?? Math.round(selectedLoc.populationExposed * 0.12)) * 2).toLocaleString()} sachets/day`, note: 'Sphere Humanitarian Minimum Standard' },
      ],
    },
  ];

  const activeStep = selectedStepIndex !== null ? steps[selectedStepIndex] : null;

  return (
    <section className="space-y-4">
      {/* Header with Upazila Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <span>{tr.causeEffectTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{tr.causeEffectSubtitle}</p>
        </div>

        {/* Upazila Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="chain-upazila" className="text-xs text-slate-400 font-medium">
            {tr.selectUpazilaForStory}
          </label>
          <select
            id="chain-upazila"
            value={selectedUpazilaId}
            onChange={(e) => onSelectUpazila(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {language === 'en' ? loc.nameEn : loc.nameBn} ({loc.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stepper Chain: 5 Columns on Desktop, Vertical on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = selectedStepIndex === idx;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 space-y-3 ${
                isSelected ? 'ring-2 ring-cyan-400 bg-slate-900' : step.accent
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-[10px] font-bold text-slate-400">{step.num}</span>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    {step.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1 text-white font-bold text-xs">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{step.title}</span>
                </div>

                <div className="my-2">
                  <div className="text-lg font-mono font-black text-white tabular-nums">
                    {step.metric}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">{step.metricLabel}</div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedStepIndex(isSelected ? null : idx)}
                  className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  <Code className="w-3 h-3" />
                  <span>{isSelected ? (language === 'bn' ? 'সূত্র লুকান' : 'Hide Formula') : (language === 'bn' ? 'গাণিতিক সূত্র দেখুন' : 'Inspect Formula')}</span>
                </button>

                <button
                  onClick={() => onNavigate(step.targetView, selectedLoc.id)}
                  className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 group transition-colors min-h-[28px]"
                >
                  <span>{tr.openRelatedView}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Formula & Scientific Variables Inspection Card */}
      {activeStep && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border border-cyan-500/40 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                <activeStep.icon className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Step {activeStep.num}: {activeStep.title} — {language === 'bn' ? 'গাণিতিক সূত্র ও চলকসমূহ' : 'Governing Equation & Parameters'}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                    {language === 'bn' ? selectedLoc.nameBn : selectedLoc.nameEn}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'bn' ? activeStep.scientificLinkBn : activeStep.scientificLinkEn}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStepIndex(null)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close formula details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mathematical Formula Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Mathematical Model Formulation
              </span>
              <span className="text-sm font-bold text-white">{activeStep.formula}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {activeStep.badge}
            </span>
          </div>

          {/* Dynamic Variable Values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeStep.variables.map((v, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block">
                  {v.name}
                </span>
                <div className="text-sm font-bold font-mono text-white">{v.value}</div>
                <p className="text-[10px] text-slate-400">{v.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
