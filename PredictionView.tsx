import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Sliders,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  Layers,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Info,
  ChevronDown,
  Activity,
  MessageSquare,
  Copy,
  Check,
  Radio,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { LocationData, Language, PredictionInput, PredictionResult, StructuredAiPrediction } from '../types';
import { calculateFloodRisk } from '../utils/floodAlgorithm';
import { RiskBadge } from '../components/RiskBadge';
import { ExplainabilityModal } from '../components/intelligence/ExplainabilityModal';
import { t } from '../utils/translations';

interface PredictionViewProps {
  locations: LocationData[];
  selectedLocation?: LocationData | null;
  language: Language;
  onNavigate: (view: string) => void;
}

export const PredictionView: React.FC<PredictionViewProps> = ({
  locations,
  selectedLocation: initialLocation,
  language,
  onNavigate,
}) => {
  const tr = t[language];

  const defaultLoc = initialLocation || locations[2] || locations[0]; // Gowainghat or Sylhet
  const [selectedStationId, setSelectedStationId] = useState<string>(defaultLoc.id);

  const activeStation = locations.find((l) => l.id === selectedStationId) || defaultLoc;

  // Prediction input state
  const [rainfallMm, setRainfallMm] = useState<number>(activeStation.rainfall24h);
  const [waterLevelM, setWaterLevelM] = useState<number>(activeStation.currentWaterLevel);
  const [waterLevelChangeM, setWaterLevelChangeM] = useState<number>(activeStation.waterLevelChange24h);
  const [rainfallTrend, setRainfallTrend] = useState<'rising' | 'steady' | 'falling'>(activeStation.rainfallTrend);
  const [upstreamRainfallMm, setUpstreamRainfallMm] = useState<number>(activeStation.upstreamRainfallMm);
  const [durationHours, setDurationHours] = useState<number>(24);

  // Synchronize inputs when station changes
  const handleStationChange = (id: string) => {
    setSelectedStationId(id);
    const loc = locations.find((l) => l.id === id);
    if (loc) {
      setRainfallMm(loc.rainfall24h);
      setWaterLevelM(loc.currentWaterLevel);
      setWaterLevelChangeM(loc.waterLevelChange24h);
      setRainfallTrend(loc.rainfallTrend);
      setUpstreamRainfallMm(loc.upstreamRainfallMm);
    }
  };

  // Run transparent hydrological calculation
  const predictionInput: PredictionInput = {
    locationId: activeStation.id,
    rainfallMm,
    waterLevelM,
    waterLevelChangeM,
    rainfallTrend,
    durationHours,
    upstreamRainfallMm,
  };

  const baselineResult = calculateFloodRisk(predictionInput, activeStation);

  // Gemini AI Structured Prediction State
  const [structuredAi, setStructuredAi] = useState<StructuredAiPrediction | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);

  const fetchAiSynthesis = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/predict-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: activeStation.nameEn,
          waterLevel: waterLevelM,
          dangerLevel: activeStation.dangerLevel,
          rainfallMm,
          waterLevelChange: waterLevelChangeM,
          upstreamRainfall: upstreamRainfallMm,
          riskLevel: baselineResult.riskLevel,
          language,
        }),
      });

      if (res.ok) {
        const data: StructuredAiPrediction = await res.json();
        setStructuredAi(data);
      }
    } catch (err) {
      console.warn('Failed to fetch AI prediction:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Auto-fetch AI prediction when station changes or on initial mount
  useEffect(() => {
    fetchAiSynthesis();
  }, [selectedStationId]);

  const handleCopySms = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2500);
  };

  // Default evacuation SMS if AI hasn't synthesized yet
  const evacuationSmsText =
    structuredAi?.smsAlertBn ||
    `বন্যা সতর্কবার্তা: ${activeStation.nameBn}-এ নদীর পানি বিপদসীমার উপরে। দ্রুত উঁচু স্থানে বা আশ্রয়কেন্দ্রে যান। গবাদিপশু সরিয়ে নিন। জরুরি: ১০৯০/৯৯৯`;

  return (
    <div className="space-y-8 pb-16">
      {/* Title & Methodology Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-cyan-400" />
              <span>{tr.navPrediction}</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              BWDB Calibrated Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Multi-variable predictive analytics combining river crests, transboundary runoff, and precipitation'
              : 'নদীর পানির বৃদ্ধি, চেরাপুঞ্জির পাহাড়ি ঢল ও বৃষ্টিপাত বিশ্লেষণের এআই মডেল'}
          </p>
        </div>

        {/* Transparency Badge */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-[11px]">
            <span className="font-bold text-white block">
              {language === 'en' ? 'Methodology Transparency:' : 'পদ্ধতিগত স্বচ্ছতা:'}
            </span>
            <span className="text-slate-400">
              {language === 'en'
                ? 'Rule-based hydrological physics + Gemini structured intelligence.'
                : 'হাইড্রোলজিক্যাল সূত্র ও জেমিনাই এআই বিশ্লেষণী মডেলের সমন্বয়।'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>{language === 'en' ? 'Hydrological Input Parameters' : 'হাইড্রোলজিক্যাল ইনপুট পরামিতি'}</span>
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                activeStation.isSimulated
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
              }`}>
                STAGE: {activeStation.isSimulated ? 'SIMULATED' : 'REFERENCE INPUT'}
              </span>
            </div>

            {/* Station Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'en' ? 'Target River Station & Upazila' : 'টার্গেট নদী স্টেশন ও উপজেলা'}
              </label>
              <select
                value={selectedStationId}
                onChange={(e) => handleStationChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {language === 'en' ? loc.nameEn : loc.nameBn} - {loc.riverNameEn} (DL: {loc.dangerLevel}m)
                  </option>
                ))}
              </select>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>District: {activeStation.district}</span>
                <span>Danger Mark: {activeStation.dangerLevel.toFixed(2)}m</span>
              </div>
            </div>

            {/* Slider 1: 24h Rainfall */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">{tr.rainfall24h}:</span>
                <span className="font-mono font-bold text-sky-400">{rainfallMm} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="400"
                step="5"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 mm (Dry)</span>
                <span>100 mm (Heavy)</span>
                <span>400 mm (Deluge)</span>
              </div>
            </div>

            {/* Slider 2: River Water Level */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">{tr.waterLevel}:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {waterLevelM.toFixed(2)} meters
                </span>
              </div>
              <input
                type="range"
                min={Number((activeStation.dangerLevel - 3).toFixed(1))}
                max={Number((activeStation.dangerLevel + 2.5).toFixed(1))}
                step="0.05"
                value={waterLevelM}
                onChange={(e) => setWaterLevelM(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>{(activeStation.dangerLevel - 3).toFixed(1)}m</span>
                <span className="text-rose-400 font-bold">DL: {activeStation.dangerLevel}m</span>
                <span>{(activeStation.dangerLevel + 2.5).toFixed(1)}m</span>
              </div>
            </div>

            {/* Slider 3: 24h Rate of Water Rise */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">{tr.rateOfRise}:</span>
                <span className="font-mono font-bold text-amber-300">
                  {waterLevelChangeM >= 0 ? `+${waterLevelChangeM.toFixed(2)}` : waterLevelChangeM.toFixed(2)} m
                </span>
              </div>
              <input
                type="range"
                min="-0.5"
                max="2.0"
                step="0.05"
                value={waterLevelChangeM}
                onChange={(e) => setWaterLevelChangeM(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>-0.5m (Receding)</span>
                <span>0.0m (Stable)</span>
                <span>+2.0m (Flash Surge)</span>
              </div>
            </div>

            {/* Slider 4: Upstream Meghalaya / Cherrapunji Influx */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">{tr.upstreamRainfall}:</span>
                <span className="font-mono font-bold text-purple-400">{upstreamRainfallMm} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={upstreamRainfallMm}
                onChange={(e) => setUpstreamRainfallMm(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 mm</span>
                <span>200 mm</span>
                <span>500 mm (Cherrapunji Surge)</span>
              </div>
            </div>

            {/* Rainfall Trend Select & Forecast Duration */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Rainfall Trend
                </label>
                <select
                  value={rainfallTrend}
                  onChange={(e) => setRainfallTrend(e.target.value as 'rising' | 'steady' | 'falling')}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="rising">Rising (তীব্রতর হচ্ছে)</option>
                  <option value="steady">Steady (স্থিতিশীল)</option>
                  <option value="falling">Falling (হ্রাস পাচ্ছে)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Duration Horizon
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="12">Next 12 Hours</option>
                  <option value="24">Next 24 Hours</option>
                  <option value="48">Next 48 Hours</option>
                </select>
              </div>
            </div>

            {/* Action Buttons: AI Synthesis & Generate Evacuation SMS */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={fetchAiSynthesis}
                disabled={isLoadingAi}
                className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoadingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Synthesizing with Gemini...' : 'জেমিনাই দিয়ে বিশ্লেষণ হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'en' ? 'Re-Analyze with Gemini AI' : 'জেমিনাই দিয়ে পুনরায় বিশ্লেষণ'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsSmsOpen(!isSmsOpen)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>
                  {language === 'en'
                    ? isSmsOpen ? 'Hide Evacuation Message' : 'Generate Evacuation Message (SMS)'
                    : isSmsOpen ? 'বার্তা লুকান' : 'জরুরি এসএমএস বার্তা তৈরি করুন'}
                </span>
              </button>
            </div>
          </div>

          {/* Collapsible / Floating Evacuation SMS Box */}
          {isSmsOpen && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/50 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <Radio className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {language === 'en' ? 'Community Broadcast SMS Alert' : 'গ্রামীণ জনপদে সম্প্রচারযোগ্য জরুরি এসএমএস'}
                    </h3>
                    <p className="text-[10px] text-purple-300/80">
                      Standard GSM SMS format (Target: &lt;160 characters)
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  evacuationSmsText.length <= 160
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                }`}>
                  {evacuationSmsText.length} / 160 chars
                </span>
              </div>

              {/* SMS Text Content */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-500/30 text-xs font-medium text-slate-100 leading-relaxed font-sans select-all">
                {evacuationSmsText}
              </div>

              {/* Copy & Status Controls */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {language === 'en' ? 'For Haor union loudspeakers & SMS broadcast' : 'হাওর ইউনিয়নের মাইকিং ও এসএমএস সতর্কতার জন্য'}
                </span>

                <button
                  onClick={() => handleCopySms(evacuationSmsText)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 active:scale-95 shadow-md"
                >
                  {copiedSms ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{language === 'en' ? 'Copied!' : 'কপি হয়েছে!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Copy SMS' : 'বার্তা কপি'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Prediction Results & "Why this prediction?" panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Risk Output Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400">
                  {language === 'en' ? 'Modelled Risk Indicator' : 'মডেলভিত্তিক ঝুঁকি সূচক'}
                </span>
                <div className="mt-1 flex items-center gap-3">
                  <RiskBadge level={structuredAi?.riskLevel || baselineResult.riskLevel} language={language} size="lg" />
                  <span className="text-xs font-mono text-slate-400">
                    Score: <strong className="text-white">{baselineResult.riskScore}/100</strong>
                  </span>
                </div>
              </div>

              {/* Confidence Metric & Explainability Button */}
              <div className="text-left sm:text-right space-y-1.5">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {language === 'en' ? 'Input Coverage:' : 'ইনপুটের উপস্থিতি:'}
                  </span>
                  <div className="text-base font-bold font-mono text-cyan-300">
                    {baselineResult.inputCoveragePercent}% of fields
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {language === 'en' ? 'Data completeness only; not model confidence' : 'শুধু তথ্যের পূর্ণতা; মডেলের নির্ভরযোগ্যতার হার নয়'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExplainModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition flex items-center gap-1.5 sm:ml-auto cursor-pointer"
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                  <span>{language === 'en' ? 'How is this score calculated?' : 'এই স্কোর কীভাবে হিসাব করা হয়েছে?'}</span>
                </button>
              </div>
            </div>

            {/* Illustrative model scenario outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  24h Scenario Stage (Illustrative)
                </span>
                <div className="text-2xl font-black font-mono text-white">
                  {baselineResult.scenarioStage24hM.toFixed(2)} m
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {baselineResult.scenarioStage24hM >= activeStation.dangerLevel ? (
                    <span className="text-rose-400 font-bold">
                      +{(baselineResult.scenarioStage24hM - activeStation.dangerLevel).toFixed(2)}m Above Danger Mark
                    </span>
                  ) : (
                    <span className="text-emerald-400">
                      {(activeStation.dangerLevel - baselineResult.scenarioStage24hM).toFixed(2)}m Below Danger Mark
                    </span>
                  )}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Scenario Horizon (Not Peak Timing)
                </span>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  ~{baselineResult.scenarioHorizonHours} Hours
                </div>
                <span className="text-[11px] text-slate-400">
                  Illustrative chart window; not a validated arrival-time estimate
                </span>
              </div>
            </div>

            {/* UPGRADE FEATURE: "Why this prediction?" Explanation Panel */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-cyan-950/20 border border-cyan-500/40 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {language === 'en' ? 'Why this model indicator?' : 'এই মডেল সূচকের ব্যাখ্যা'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Rule-based factor weights
                </span>
              </div>

              {/* Top 3 Contributing Reasons */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  {language === 'en' ? 'Top Contributing Drivers:' : 'ঝুঁকির শীর্ষ ৩টি চালিকাশক্তি:'}
                </span>

                {(structuredAi
                  ? (language === 'bn' ? structuredAi.topReasonsBn : structuredAi.topReasons)
                  : baselineResult.factors.slice(0, 3).map((f) => (language === 'en' ? f.description : f.descriptionBn))
                ).map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/30">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{reason}</span>
                  </div>
                ))}
              </div>

              {/* 6h / 24h Short & Medium Term Outlook */}
              {structuredAi && structuredAi.outlook && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? '6-Hour Immediate Outlook' : 'আগামী ৬ ঘণ্টার সম্ভাবনা'}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {language === 'bn' ? structuredAi.outlook.sixHourBn : structuredAi.outlook.sixHour}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? '24-Hour Basin Outlook' : 'আগামী ২৪ ঘণ্টার অববাহিকা চিত্র'}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {language === 'bn' ? structuredAi.outlook.twentyFourHourBn : structuredAi.outlook.twentyFourHour}
                    </p>
                  </div>
                </div>
              )}

              {/* Natural Language Diagnostic Summary */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{language === 'en' ? 'Hydrological Narrative Report' : 'হাইড্রো-বর্ণনামূলক সারসংক্ষেপ'}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {structuredAi
                    ? (language === 'bn' ? structuredAi.aiAnalysisBn : structuredAi.aiAnalysis)
                    : (language === 'en' ? baselineResult.explanationEn : baselineResult.explanationBn)}
                </p>
              </div>
            </div>

            {/* Contributing Hydrological Factors Breakdown (Physics baseline weights) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {language === 'en' ? 'All Factor Weights Breakdown' : 'কারণসমূহের সার্বিক অনুপাত'}
              </h3>

              <div className="space-y-2.5">
                {baselineResult.factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">
                        {language === 'en' ? factor.factor : factor.factorBn}
                      </span>
                      <span className="font-mono text-cyan-300 font-semibold">
                        Weight: {factor.weight}%
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      {language === 'en' ? factor.description : factor.descriptionBn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Safety Actions */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>{language === 'en' ? 'Actionable Safety & Evacuation Guidance' : 'জীবন সুরক্ষা ও জরুরি পদক্ষেপ'}</span>
              </h3>

              <div className="space-y-2">
                {(structuredAi?.recommendedActions
                  ? (language === 'bn' ? structuredAi.recommendedActions.bn : structuredAi.recommendedActions.en)
                  : (language === 'en' ? baselineResult.actionsEn : baselineResult.actionsBn)
                ).map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Explainability & Model Factor Breakdown Modal */}
      <ExplainabilityModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        location={activeStation}
        language={language}
      />
    </div>
  );
};
