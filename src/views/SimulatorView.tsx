import React, { useState, useMemo } from 'react';
import {
  Sliders,
  AlertOctagon,
  CloudRain,
  Zap,
  SunMedium,
  RotateCcw,
  TrendingUp,
  Waves,
  ShieldCheck,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
  Layers,
  Table,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { LocationData, Language, SimulationPreset } from '../types';
import { SIMULATION_PRESETS } from '../data/mockData';
import { calculateFloodRisk } from '../utils/floodAlgorithm';
import { RiskBadge } from '../components/RiskBadge';
import { t } from '../utils/translations';

interface SimulatorViewProps {
  locations: LocationData[];
  preselectedLocationId?: string | null;
  language: Language;
  onNavigate: (view: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  locations,
  preselectedLocationId,
  language,
  onNavigate,
}) => {
  const tr = t[language];

  // Select initial location
  const initialLoc = locations.find((l) => l.id === preselectedLocationId) || locations[2]; // Gowainghat
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLoc.id);

  const location = locations.find((l) => l.id === selectedLocationId) || initialLoc;

  // Simulation Parameters
  const [rainfallMm, setRainfallMm] = useState<number>(140);
  const [waterLevelM, setWaterLevelM] = useState<number>(location.currentWaterLevel);
  const [waterLevelChangeM, setWaterLevelChangeM] = useState<number>(0.65);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [upstreamRainfallMm, setUpstreamRainfallMm] = useState<number>(220);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'sliders' | 'lab'>('sliders');

  // Apply a scenario preset
  const handleApplyPreset = (preset: SimulationPreset) => {
    setActivePresetId(preset.id);
    setRainfallMm(preset.rainfallMm);
    setWaterLevelM(
      Number((location.dangerLevel + (preset.id === 'preset-normal' ? -1.8 : preset.id === 'preset-extreme-2022' ? 0.75 : 0.1)).toFixed(2))
    );
    setWaterLevelChangeM(preset.waterLevelChangeM);
    setDurationHours(preset.durationHours);
    setUpstreamRainfallMm(preset.upstreamRainfallMm);
  };

  // Reset to current station baseline
  const handleResetToBaseline = () => {
    setActivePresetId(null);
    setRainfallMm(location.rainfall24h);
    setWaterLevelM(location.currentWaterLevel);
    setWaterLevelChangeM(location.waterLevelChange24h);
    setDurationHours(24);
    setUpstreamRainfallMm(location.upstreamRainfallMm);
  };

  // Compute Baseline vs Simulated Risk
  const baselineResult = useMemo(() => {
    return calculateFloodRisk(
      {
        locationId: location.id,
        rainfallMm: location.rainfall24h,
        waterLevelM: location.currentWaterLevel,
        waterLevelChangeM: location.waterLevelChange24h,
        rainfallTrend: location.rainfallTrend,
        durationHours: 24,
        upstreamRainfallMm: location.upstreamRainfallMm,
      },
      location
    );
  }, [location]);

  const simulatedResult = useMemo(() => {
    return calculateFloodRisk(
      {
        locationId: location.id,
        rainfallMm,
        waterLevelM,
        waterLevelChangeM,
        rainfallTrend: 'rising',
        durationHours,
        upstreamRainfallMm,
      },
      location
    );
  }, [location, rainfallMm, waterLevelM, waterLevelChangeM, durationHours, upstreamRainfallMm]);

  // Delta comparison values
  const stageDelta = simulatedResult.scenarioStage24hM - baselineResult.scenarioStage24hM;
  const scoreDelta = simulatedResult.riskScore - baselineResult.riskScore;

  // Generate hydrograph trajectory curve over 48 hours for chart
  const hydrographData = useMemo(() => {
    const data = [];
    const steps = 12; // 0, 4, 8, ... 48h
    const scenarioHorizon = simulatedResult.scenarioHorizonHours;

    for (let i = 0; i <= steps; i++) {
      const hour = i * 4;
      // Simulated curve
      let simLevel = waterLevelM;
      if (hour <= scenarioHorizon) {
        simLevel = waterLevelM + (simulatedResult.scenarioStage24hM - waterLevelM) * (hour / scenarioHorizon);
      } else {
        const drop = (hour - scenarioHorizon) * 0.03;
        simLevel = simulatedResult.scenarioStage24hM - drop;
      }

      // Baseline curve
      let baseLevel = location.currentWaterLevel;
      if (hour <= 24) {
        baseLevel = location.currentWaterLevel + (baselineResult.scenarioStage24hM - location.currentWaterLevel) * (hour / 24);
      } else {
        baseLevel = baselineResult.scenarioStage24hM - (hour - 24) * 0.015;
      }

      data.push({
        time: `${hour}h`,
        simulated: Number(simLevel.toFixed(2)),
        baseline: Number(baseLevel.toFixed(2)),
        dangerLevel: location.dangerLevel,
        warningLevel: location.warningLevel,
      });
    }
    return data;
  }, [location, waterLevelM, simulatedResult, baselineResult]);

  // Drivers of increased risk
  const riskDrivers = [];
  if (rainfallMm > 100) riskDrivers.push(`Extreme rainfall volume (+${rainfallMm}mm) exceeding drainage coefficient`);
  if (waterLevelM >= location.dangerLevel) riskDrivers.push(`Initial river stage starts above official Danger Level (${location.dangerLevel}m)`);
  if (waterLevelChangeM >= 0.5) riskDrivers.push(`Rapid crest rate of change (+${waterLevelChangeM}m/24h) creates flash inundation`);
  if (upstreamRainfallMm > 150) riskDrivers.push(`Mountain catchment runoff from Meghalaya hills discharging into Surma/Kushiyara haor`);

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Prominent Simulator Disclaimer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-6 h-6 text-cyan-400" />
              <span>{tr.navSimulator}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              Interactive Stress-Test
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Model hypothetical precipitation spikes, upstream flash floods, and river level surges'
              : 'কাল্পনিক বৃষ্টিপাত ও পাহাড়ি ঢলের দৃশ্যপট তৈরি করে আগেভাগেই বন্যার সম্ভাব্য মাত্রা নিরীক্ষণ করুন'}
          </p>
        </div>

        {/* Disclaimer Warning */}
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 max-w-md">
          <Info className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-[11px] leading-tight">
            <strong>{language === 'en' ? 'HYPOTHETICAL SIMULATION:' : 'কাল্পনিক সিমুলেশন:'}</strong>{' '}
            {language === 'en'
              ? 'Outputs are predictive simulations for disaster preparedness drills and stress-testing, not official forecasts.'
              : 'প্রদর্শিত ফলাফল প্রশিক্ষণ ও প্রস্তুতির জন্য কাল্পনিক সিমুলেশন, সরকারি পূর্বাভাস নয়।'}
          </span>
        </div>
      </div>

      {/* Scenario Presets Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {language === 'en' ? 'Select Scenario Preset' : 'পরিস্থিতির প্রিসেট নির্বাচন করুন'}
          </h2>
          <button
            onClick={handleResetToBaseline}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Reset to Actual Live Stage' : 'বর্তমান মানে রিসেট'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SIMULATION_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">
                      {language === 'en' ? preset.titleEn : preset.titleBn}
                    </span>
                    {preset.id === 'preset-extreme-2022' ? (
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : preset.id === 'preset-rapid-surge' ? (
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : preset.id === 'preset-heavy' ? (
                      <CloudRain className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <SunMedium className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {language === 'en' ? preset.descriptionEn : preset.descriptionBn}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                  <span>Rain: {preset.rainfallMm}mm</span>
                  <span>Rise: +{preset.waterLevelChangeM}m</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Switcher: Sliders vs 3-Scenario Comparison Lab */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('sliders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'sliders'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'স্লাইডার ও হাইড্রোগ্রাফ' : 'Interactive Sliders & Hydrograph'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('lab')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'lab'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'দৃশ্যপট তুলনা ল্যাব (৩টি পরিস্থিতি)' : 'Scenario Comparison Lab (3 Scenarios Side-by-Side)'}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
              SIMULATED
            </span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Active Station: <strong className="text-white">{location.nameEn} ({location.district})</strong>
        </span>
      </div>

      {viewMode === 'lab' ? (
        /* 3-Scenario Side-by-Side Comparison Lab */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scenario 1: Baseline */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Scenario 01</span>
                  <h3 className="text-sm font-bold text-white">Current Observed Baseline</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {location.isSimulated ? 'SIMULATED' : 'LIVE'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">River Stage:</span>
                  <span className="font-mono font-bold text-white">{location.currentWaterLevel.toFixed(2)}m (DL {location.dangerLevel}m)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">24h Rainfall:</span>
                  <span className="font-mono text-sky-400">{location.rainfall24h} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Risk Score:</span>
                  <span className="font-mono font-bold text-cyan-300">{baselineResult.riskScore}/100 ({baselineResult.riskLevel})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Estimated Evacuees:</span>
                  <span className="font-mono text-white">{(location.displacedEstimated ?? Math.round(location.populationExposed * 0.12)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Daily ORS Demand:</span>
                  <span className="font-mono text-white">{((location.displacedEstimated ?? Math.round(location.populationExposed * 0.12)) * 2).toLocaleString()} sachets</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Clinic Access:</span>
                  <span className="font-mono text-emerald-400">Passable / Motorized</span>
                </div>
              </div>
            </div>

            {/* Scenario 2: 2022 Deluge */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/20 border border-rose-500/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 block">Scenario 02</span>
                  <h3 className="text-sm font-bold text-white">2022 Extreme Deluge</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                  SIMULATED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">River Stage:</span>
                  <span className="font-mono font-bold text-rose-300">{(location.dangerLevel + 0.95).toFixed(2)}m (+0.95m DL)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">24h Rainfall:</span>
                  <span className="font-mono text-rose-400">320 mm (Cherra: 450mm)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Risk Score:</span>
                  <span className="font-mono font-bold text-rose-400">96/100 (CRITICAL)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Estimated Evacuees:</span>
                  <span className="font-mono text-white">{(Math.round((location.displacedEstimated ?? Math.round(location.populationExposed * 0.12)) * 2.4)).toLocaleString()} (+140%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Daily ORS Demand:</span>
                  <span className="font-mono text-amber-300">{(Math.round((location.displacedEstimated ?? Math.round(location.populationExposed * 0.12)) * 4.8)).toLocaleString()} sachets</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Clinic Access:</span>
                  <span className="font-mono text-rose-400 font-bold">CUT_OFF (Boats Only)</span>
                </div>
              </div>
            </div>

            {/* Scenario 3: Shelter Capacity & Prolonged Waterlogging */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Scenario 03</span>
                  <h3 className="text-sm font-bold text-white">Shelter & Sluice Stress</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                  SIMULATED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">River Stage:</span>
                  <span className="font-mono font-bold text-amber-300">{(location.dangerLevel + 0.40).toFixed(2)}m (+0.40m DL)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Standing Water:</span>
                  <span className="font-mono text-amber-400">7+ Days Trapped in Haor</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Risk Score:</span>
                  <span className="font-mono font-bold text-amber-400">82/100 (HIGH)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Shelter Occupancy:</span>
                  <span className="font-mono text-rose-400 font-bold">142% of Capacity</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Diarrhoea Attack Rate:</span>
                  <span className="font-mono text-rose-300">22.4 per 1,000 / week</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Transfer Action:</span>
                  <span className="font-mono text-cyan-300">Relocate to Sadar Hub</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
      /* Main Simulator Workspace: Sliders & Live Comparison */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Parameter Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>{language === 'en' ? 'Adjust Stress Variables' : 'প্যারামিটার পরিবর্তন করুন'}</span>
              <span className="text-xs font-mono text-cyan-400 font-normal">
                {location.nameEn}
              </span>
            </h2>

            {/* Target Location Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Upazila & River Gauge
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  const loc = locations.find((l) => l.id === e.target.value);
                  if (loc) setWaterLevelM(loc.currentWaterLevel);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nameEn} - {loc.riverNameEn} (DL: {loc.dangerLevel}m)
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 1: Simulated Rainfall (0 - 500 mm) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Simulated 24h Rainfall:</span>
                <span className="font-mono font-bold text-sky-400 text-sm">{rainfallMm} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={rainfallMm}
                onChange={(e) => {
                  setRainfallMm(Number(e.target.value));
                  setActivePresetId(null);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 mm (None)</span>
                <span>150 mm (Heavy)</span>
                <span>500 mm (Cherrapunji Max)</span>
              </div>
            </div>

            {/* Slider 2: River Stage (meters) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Simulated Initial River Level:</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {waterLevelM.toFixed(2)} meters
                </span>
              </div>
              <input
                type="range"
                min={(location.dangerLevel - 3).toFixed(1)}
                max={(location.dangerLevel + 2.5).toFixed(1)}
                step="0.05"
                value={waterLevelM}
                onChange={(e) => {
                  setWaterLevelM(Number(e.target.value));
                  setActivePresetId(null);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Safe ({(location.dangerLevel - 3).toFixed(1)}m)</span>
                <span className="text-rose-400 font-bold">Danger: {location.dangerLevel}m</span>
                <span>Severe ({(location.dangerLevel + 2.5).toFixed(1)}m)</span>
              </div>
            </div>

            {/* Slider 3: River Water Level Increase (0 to 3.0 m) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">River Water-Level Increase (Rate):</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  +{waterLevelChangeM.toFixed(2)} m / 24h
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.05"
                value={waterLevelChangeM}
                onChange={(e) => {
                  setWaterLevelChangeM(Number(e.target.value));
                  setActivePresetId(null);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>+0.0 m (Stable)</span>
                <span>+1.0 m (Fast)</span>
                <span>+3.0 m (Flash Surge)</span>
              </div>
            </div>

            {/* Slider 4: Upstream Meghalaya Catchment Runoff */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Transboundary Upstream Runoff:</span>
                <span className="font-mono font-bold text-purple-400 text-sm">
                  {upstreamRainfallMm} mm
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="600"
                step="10"
                value={upstreamRainfallMm}
                onChange={(e) => {
                  setUpstreamRainfallMm(Number(e.target.value));
                  setActivePresetId(null);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 mm</span>
                <span>250 mm</span>
                <span>600 mm (2022 Mega Runoff)</span>
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Duration of Sustained Heavy Downpour
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[12, 24, 48].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setDurationHours(hours)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      durationHours === hours
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {hours} Hours
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Comparison, Hydrograph & Preparedness (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Side-by-Side Baseline vs Simulated Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Baseline Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Actual Baseline
              </span>
              <div className="flex items-center justify-between">
                <RiskBadge level={baselineResult.riskLevel} language={language} size="md" />
                <span className="font-mono text-sm text-slate-300">
                  Score: <strong>{baselineResult.riskScore}</strong>/100
                </span>
              </div>
              <div className="text-xs space-y-1 text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>River Stage:</span>
                  <span className="font-mono text-white">{location.currentWaterLevel.toFixed(2)}m</span>
                </div>
                <div className="flex justify-between">
                  <span>24h Rainfall:</span>
                  <span className="font-mono text-white">{location.rainfall24h} mm</span>
                </div>
              </div>
            </div>

            {/* Simulated Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 space-y-3 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
                <span>Simulated Scenario</span>
                <span className="text-[10px] font-mono text-slate-400">
                  Delta: {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts
                </span>
              </span>
              <div className="flex items-center justify-between">
                <RiskBadge level={simulatedResult.riskLevel} language={language} size="md" />
                <span className="font-mono text-sm text-cyan-300">
                  Score: <strong>{simulatedResult.riskScore}</strong>/100
                </span>
              </div>
              <div className="text-xs space-y-1 text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Scenario Stage:</span>
                  <span className="font-mono font-bold text-white">
                    {simulatedResult.scenarioStage24hM.toFixed(2)}m ({stageDelta >= 0 ? `+${stageDelta.toFixed(2)}m` : `${stageDelta.toFixed(2)}m`})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Scenario Horizon:</span>
                  <span className="font-mono text-cyan-300">~{simulatedResult.scenarioHorizonHours} hours (illustrative)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Hydrograph Simulation */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>48-Hour Hydrograph Trajectory Simulation</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Simulated water stage curve vs Actual Baseline and Danger Mark ({location.dangerLevel}m)
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Simulated
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Baseline
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2.5 h-0.5 bg-rose-500" /> Danger Line
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hydrographData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    domain={['auto', 'auto']}
                    unit="m"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <ReferenceLine
                    y={location.dangerLevel}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{ value: 'Danger Level', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="baseline"
                    stroke="#64748b"
                    fillOpacity={1}
                    fill="url(#baseGrad)"
                    strokeWidth={2}
                    name="Baseline Stage (m)"
                  />
                  <Area
                    type="monotone"
                    dataKey="simulated"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#simGrad)"
                    strokeWidth={2.5}
                    name="Simulated Scenario (m)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* What Inputs Increased the Risk? */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {language === 'en' ? 'Vulnerability Drivers in this Scenario' : 'এই দৃশ্যপটে ঝুঁকির মূল কারণসমূহ'}
            </h3>

            {riskDrivers.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-300">
                {riskDrivers.map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-400">
                All simulated inputs are currently within normal baseline thresholds.
              </p>
            )}
          </div>

          {/* Preparedness Recommendations for this Scenario */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>
                {language === 'en'
                  ? `Pre-Emptive Preparedness Actions for ${location.nameEn}`
                  : `${location.nameBn} উপজেলার জন্য আগাম প্রস্তুতিমূলক ব্যবস্থা`}
              </span>
            </h3>

            <div className="space-y-2">
              {(language === 'en' ? simulatedResult.actionsEn : simulatedResult.actionsBn).map(
                (act, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-200 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
