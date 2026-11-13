import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Droplets,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  Pill,
  Navigation,
  PhoneCall,
  Sparkles,
  Copy,
  Check,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Flame,
  Bug,
  FileText,
  Printer,
  Share2,
  Activity,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { LocationData, Language } from '../types';
import { PrepositionPlannerCard } from '../components/PrepositionPlannerCard';
import { t } from '../utils/translations';
import {
  computeHealthRisk,
  computeHealthRiskProjection,
  HealthRiskOutput,
  SAMPLE_SHELTER_MEDICAL_BOARD,
  ShelterMedicalItem,
} from '../utils/healthRisk';

interface HealthWatchViewProps {
  locations: LocationData[];
  language: Language;
  onNavigate?: (view: string, targetId?: string) => void;
  initialAreaId?: string | null;
}

export const HealthWatchView: React.FC<HealthWatchViewProps> = ({
  locations,
  language,
  onNavigate,
  initialAreaId,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    if (initialAreaId) {
      const match = locations.find(
        (l) =>
          l.id.toLowerCase() === initialAreaId.toLowerCase() ||
          l.nameEn.toLowerCase() === initialAreaId.toLowerCase() ||
          l.upazilaEn.toLowerCase() === initialAreaId.toLowerCase()
      );
      if (match) return match.id;
    }
    return locations[0]?.id || 'sylhet-sadar';
  });

  const [copiedGuidance, setCopiedGuidance] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [healthGuidance, setHealthGuidance] = useState<any>(null);

  const tr = t[language];
  const isBn = language === 'bn';

  // Synchronize when initialAreaId changes via URL deep link
  useEffect(() => {
    if (initialAreaId) {
      const match = locations.find(
        (l) =>
          l.id.toLowerCase() === initialAreaId.toLowerCase() ||
          l.nameEn.toLowerCase() === initialAreaId.toLowerCase() ||
          l.upazilaEn.toLowerCase() === initialAreaId.toLowerCase()
      );
      if (match) {
        setSelectedLocationId(match.id);
      }
    }
  }, [initialAreaId, locations]);

  // Selected station location data
  const selectedLoc =
    locations.find((l) => l.id === selectedLocationId) || locations[0];

  // Compute hand-weighted waterborne-health preparedness indicators
  const healthAssessment: HealthRiskOutput = computeHealthRisk({
    district: selectedLoc?.district || 'Sylhet',
    upazilaEn: selectedLoc?.upazilaEn || 'Sylhet Sadar',
    upazilaBn: selectedLoc?.upazilaBn || 'সিলেট সদর',
    floodRiskScore: selectedLoc?.riskScore || 65,
    waterLevel: selectedLoc?.currentWaterLevel || 10.8,
    dangerLevel: selectedLoc?.dangerLevel || 10.5,
  });

  // Compute 48-Hour Health Risk Projection Timeline
  const healthProjection = computeHealthRiskProjection({
    district: selectedLoc.district,
    nameEn: selectedLoc.nameEn || selectedLoc.upazilaEn,
    nameBn: selectedLoc.nameBn || selectedLoc.upazilaBn,
    currentWaterLevel: selectedLoc.currentWaterLevel,
    dangerLevel: selectedLoc.dangerLevel,
    warningLevel: selectedLoc.warningLevel,
    riskScore: selectedLoc.riskScore,
    rateOfRise24h: selectedLoc.waterLevelChange24h,
  });

  // Load fixed bilingual health safety guidance for the selected area
  const fetchGuidance = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/health-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upazila: selectedLoc?.upazilaEn,
          district: selectedLoc?.district,
          riskTier: healthAssessment.overallTier,
          standingDays: healthAssessment.standingWaterDays,
          language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHealthGuidance(data);
      }
    } catch {
      // Fallback already built into static display
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchGuidance();
  }, [selectedLocationId, language]);

  const handleCopyGuidance = () => {
    const textToCopy = `FloodGuard AI Health Guidance - ${selectedLoc?.upazilaEn} (${healthAssessment.overallTier} Risk)
1. ORS: ${healthGuidance?.orsPreparation?.text || 'Mix the entire ORS sachet in exactly the water volume printed on the packet. If no sachet is available, mix 6 level teaspoons of sugar and 1/2 level teaspoon of salt in 1 litre of safe water. Seek medical help for danger signs.'}
2. Safe Water: ${healthGuidance?.safeWater?.text || 'Boil water or use purification tablets as per the product label.'}
3. Wound Care: ${healthGuidance?.woundCare?.text || 'Clean wounds immediately with boiled water and soap.'}
4. Snakebite: ${healthGuidance?.snakebiteSteps?.text || 'Keep bitten limb immobilized with splint. Do not cut or apply tourniquet. Rush to clinic.'}
Emergency Hotlines: 999 (Ambulance), 16263 (Shastho Batayan)`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedGuidance(true);
    setTimeout(() => setCopiedGuidance(false), 2500);
  };

  // Concise <160 char Bangla SMS copy helper
  const handleCopyBanglaSms = () => {
    const upazila = selectedLoc?.upazilaBn || selectedLoc?.nameBn || 'সিলেট';
    const wl = selectedLoc.currentWaterLevel.toFixed(1);
    const dl = selectedLoc.dangerLevel.toFixed(1);
    const sms = `[নমুনা—যাচাই করুন] ${upazila}: প্রদর্শিত পানি ${wl}মি; রেফারেন্স ${dl}মি। স্থানীয় সরকারি সতর্কতা যাচাই করুন। নিরাপদ পানি ও ORS প্রস্তুত রাখুন। হেল্পলাইন: ১০৯০ / ৯৯৯`;;

    navigator.clipboard.writeText(sms);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2500);
  };

  const handlePrintBrief = () => {
    window.print();
  };

  // Tier color styling
  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'SEVERE':
        return {
          bg: 'bg-rose-950/60 text-rose-300 border-rose-500/50',
          badge: 'bg-rose-500 text-white font-black',
          bar: 'bg-rose-500',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/60 text-orange-300 border-orange-500/50',
          badge: 'bg-orange-500 text-slate-950 font-black',
          bar: 'bg-orange-500',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-950/60 text-amber-300 border-amber-500/50',
          badge: 'bg-amber-500 text-slate-950 font-black',
          bar: 'bg-amber-500',
        };
      default:
        return {
          bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50',
          badge: 'bg-emerald-500 text-slate-950 font-black',
          bar: 'bg-emerald-500',
        };
    }
  };

  const currentTierStyles = getTierStyles(healthAssessment.overallTier);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header Banner: Flood-health preparedness prototype */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                FLOOD-HEALTH PREPAREDNESS • RESEARCH PROTOTYPE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                DERIVED: Disease Risk Index
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/30">
                SIMULATED: Shelter Supplies
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <HeartPulse className="w-6 h-6 text-emerald-400" />
              <span>{language === 'en' ? 'Flood Health Watch' : 'প্লাবন স্বাস্থ্য নজরদারি'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {language === 'en'
                ? 'Floods can create serious health risks. This view uses hand-weighted planning indicators for water contamination, displacement and disrupted healthcare access; it does not predict outbreaks or diagnose illness.'
                : 'প্লাবন স্বাস্থ্যঝুঁকি বাড়াতে পারে। এই ভিউ পানিদূষণ, বাস্তুচ্যুতি ও চিকিৎসাসেবায় বাধার জন্য পরিকল্পনাভিত্তিক সূচক দেখায়; এটি রোগের প্রাদুর্ভাবের পূর্বাভাস বা রোগ নির্ণয় করে না।'}
            </p>
          </div>

          {/* Quick Emergency Helplines Callout */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <a
              href="tel:16263"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 transition"
              title="DGHS Shastho Batayan 24/7 Telemedicine Hotline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>16263 {language === 'en' ? 'Health Batayan' : 'স্বাস্থ্য বাতায়ন'}</span>
            </a>
            <a
              href="tel:999"
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-2 transition"
              title="National Emergency Ambulance"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span>999 {language === 'en' ? 'Ambulance' : 'অ্যাম্বুলেন্স'}</span>
            </a>
          </div>
        </div>

        {/* Upazila / Station Switcher Bar & Situation Brief Actions */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold">
              {language === 'en' ? 'Monitored Upazila Basin:' : 'পর্যবেক্ষণকৃত উপজেলা:'}
            </span>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {language === 'en'
                    ? `${loc.upazilaEn} (${loc.district}) — ${loc.stationName}`
                    : `${loc.upazilaBn} (${loc.district}) — ${loc.stationName}`}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono ml-2">
              <span>
                Stage: <strong className="text-white">{selectedLoc.currentWaterLevel}m</strong> / DL: {selectedLoc.dangerLevel}m
              </span>
              <span>
                Standing: <strong className="text-cyan-300">{healthAssessment.standingWaterDays} days</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBanglaSms}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium text-xs transition-colors cursor-pointer"
              title="Copy <160 char emergency SMS alert in Bangla"
            >
              {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedSms ? (isBn ? 'এসএমএস কপি হয়েছে!' : 'SMS Copied!') : (isBn ? 'বাংলা এসএমএস কপি (<১৬০)' : 'Copy Bangla SMS')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintBrief}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-medium text-xs transition-colors cursor-pointer"
              title="Print or export A4 Situation Brief"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isBn ? 'ব্রিফ প্রিন্ট / পিডিএফ' : 'Download Brief (A4)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Waterborne Disease Risk Index */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <span>{tr.healthRiskIndex}</span>
            </h2>
            <p className="text-xs text-slate-400">{tr.healthRiskSubtitle}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border font-mono uppercase tracking-wider ${currentTierStyles.badge}`}>
            {healthAssessment.overallTier}
          </span>
        </div>

        {/* Overall Health Score & Top Factors Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Composite Disease Vulnerability</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-white">{healthAssessment.overallScore}</span>
                <span className="text-xs text-slate-400 font-mono">/ 100</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${currentTierStyles.bar}`}
                  style={{ width: `${healthAssessment.overallScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Low (&lt;35)</span>
                <span>Mod (35-54)</span>
                <span>High (55-74)</span>
                <span>Severe (75+)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>Est. Displaced: <strong className="text-slate-200">{healthAssessment.displacedPopulationEstimate.toLocaleString()}</strong></div>
              <div>Shelter Density: <strong className="text-slate-200">{Math.round(healthAssessment.shelterCrowdingRatio * 100)}% capacity</strong></div>
            </div>
          </div>

          {/* Top 3 Contributing Health Factors */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {language === 'en'
                  ? 'Top 3 Contributing Hydrological & Sanitary Drivers'
                  : 'স্বাস্থ্যঝুঁকি বৃদ্ধির প্রধান ৩টি কারণ'}
              </span>
            </span>

            <div className="space-y-2">
              {(language === 'en' ? healthAssessment.topFactorsEn : healthAssessment.topFactorsBn).map((factor, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    0{idx + 1}
                  </span>
                  <span className="leading-relaxed">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Disease-Specific Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthAssessment.diseaseBreakdown.map((dis) => {
            const styles = getTierStyles(dis.tier);
            return (
              <div
                key={dis.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${styles.badge}`}>
                      {dis.tier}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{dis.score}/100</span>
                  </div>

                  <h3 className="font-bold text-white text-sm">
                    {language === 'en' ? dis.nameEn : dis.nameBn}
                  </h3>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {language === 'en' ? dis.transmissionMechanismEn : dis.transmissionMechanismBn}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 text-[11px] text-emerald-300 leading-snug">
                  <strong className="text-slate-400 block mb-0.5">
                    {language === 'en' ? 'Clinical Advisory:' : 'জরুরি পরামর্শ:'}
                  </strong>
                  {language === 'en' ? dis.preventiveAdviceEn : dis.preventiveAdviceBn}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 1.5: 48-Hour Disease Vulnerability & Healthcare Projection */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>
                  {isBn
                    ? '৪৮ ঘণ্টার রোগ বিস্তার ও স্বাস্থ্যঝুঁকি প্রজেকশন'
                    : '48-Hour Disease Vulnerability & Healthcare Projection'}
                </span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                DERIVED: Crest Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'নদীর সম্ভাব্য পানি বৃদ্ধি ও জলাবদ্ধতা অনুযায়ী পরবর্তী ৪৮ ঘণ্টার স্বাস্থ্যঝুঁকির গতিধারা।'
                : 'Projected epidemiological vulnerability curves based on river crest rate and standing water accumulation.'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full inline-block" />
              <span>{isBn ? 'সার্বিক ঝুঁকি' : 'Composite Risk'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full inline-block border-b border-dashed border-cyan-400" />
              <span>{isBn ? 'কলেরা/ডায়রিয়া' : 'Cholera'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-400 rounded-full inline-block border-b border-dotted border-rose-400" />
              <span>{isBn ? 'সাপের কামড়' : 'Snakebite'}</span>
            </span>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={healthProjection.timeline}
              margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis
                dataKey="hourLabel"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                }}
              />
              <ReferenceLine
                x={healthProjection.peakHourLabel}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{
                  value: isBn ? 'সর্বোচ্চ চূড়া' : 'Peak Risk',
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Line
                type="monotone"
                dataKey="overallHealthScore"
                name={isBn ? 'সার্বিক স্বাস্থ্যঝুঁকি' : 'Composite Disease Risk'}
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="choleraScore"
                name={isBn ? 'কলেরা ও ডায়রিয়া' : 'Cholera & Diarrhoea'}
                stroke="#06b6d4"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#06b6d4' }}
              />
              <Line
                type="monotone"
                dataKey="snakebiteScore"
                name={isBn ? 'সাপের কামড়' : 'Snakebite Risk'}
                stroke="#f43f5e"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={{ r: 3, fill: '#f43f5e' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plain-Language Peak Projection Callout */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-start gap-3">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            {isBn ? (
              <span>
                সম্ভাব্য সর্বোচ্চ স্বাস্থ্যঝুঁকি সময়: <strong className="text-white">+{healthProjection.peakHourOffset} ঘণ্টা</strong>{' '}
                (সার্বিক ঝুঁকি স্কোর: <strong className="text-emerald-400">{healthProjection.peakScore}/১০০</strong>, স্তর:{' '}
                <strong className="text-amber-400">{healthProjection.peakTier}</strong>)। নদীর পানি চূড়ায় পৌঁছার পূর্বেই উপজেলা স্বাস্থ্য কমপ্লেক্স এবং আশ্রয়কেন্দ্রে খাবার স্যালাইন, পানি বিশুদ্ধকরণ হ্যালোজেন ট্যাবলেট ও অ্যান্টিভেনম কিট সরবরাহ নিশ্চিত করা প্রয়োজন।
              </span>
            ) : (
              <span>
                Projected peak disease vulnerability window:{' '}
                <strong className="text-white">+{healthProjection.peakHourOffset}h</strong> (Composite Score:{' '}
                <strong className="text-emerald-400">{healthProjection.peakScore}/100</strong>, Tier:{' '}
                <strong className="text-amber-400">{healthProjection.peakTier}</strong>). Prepositioning of ORS sachets, halogen purification tablets, and antivenom vials at primary shelters is advised prior to upstream river crest.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preposition Planner Logistics Component (Phase 4 & 8) */}
      <PrepositionPlannerCard
        locations={locations}
        language={language}
        selectedUpazilaId={selectedLocationId}
      />

      {/* SECTION 2: Shelter Medical Readiness Board */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Pill className="w-4 h-4 text-cyan-400" />
                <span>{tr.shelterReadiness}</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/30">
                SIMULATED DATA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'en'
                ? 'ORS sachets, potable water reserves, first-aid kits, and ambulance route status for registered shelters.'
                : 'নিবন্ধিত আশ্রয়কেন্দ্রে খাবার স্যালাইন, বিশুদ্ধ পানি, ফার্স্ট এইড ও হাসপাতাল যাতায়াতের লাইভ অবস্থা।'}
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('routeSafe')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>{language === 'en' ? 'View RouteSafe Evac Map' : 'রুটসেফ ম্যাপ দেখুন'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Shelters Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Shelter Facility</th>
                <th className="py-2.5 px-3">Occupancy</th>
                <th className="py-2.5 px-3">ORS Packets</th>
                <th className="py-2.5 px-3">Drinking Water</th>
                <th className="py-2.5 px-3">Nearest Clinic</th>
                <th className="py-2.5 px-3">Route Access</th>
                <th className="py-2.5 px-3 text-right">Medical Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {SAMPLE_SHELTER_MEDICAL_BOARD.map((shelter) => {
                const orsPercent = Math.min(100, Math.round((shelter.orsSachets / shelter.orsTarget) * 100));
                const waterPercent = Math.min(100, Math.round((shelter.cleanWaterLitres / shelter.waterTargetLitres) * 100));

                return (
                  <tr key={shelter.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">
                        {language === 'en' ? shelter.shelterNameEn : shelter.shelterNameBn}
                      </div>
                      <span className="text-[11px] text-slate-400">{shelter.upazilaEn}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-200">
                        {shelter.currentOccupancy} / {shelter.capacity}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {Math.round((shelter.currentOccupancy / shelter.capacity) * 100)}% density
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-200">
                        {shelter.orsSachets.toLocaleString()}
                      </div>
                      <div className="w-20 bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-800">
                        <div
                          className={`h-full rounded-full ${orsPercent < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${orsPercent}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-200">
                        {shelter.cleanWaterLitres.toLocaleString()} L
                      </div>
                      <div className="w-20 bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-800">
                        <div
                          className={`h-full rounded-full ${waterPercent < 50 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                          style={{ width: `${waterPercent}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">
                        {language === 'en' ? shelter.nearestClinicEn : shelter.nearestClinicBn}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {shelter.clinicDistanceKm} km away {shelter.antivenomAvailable && '• Antivenom ✓'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          shelter.clinicAccessStatus === 'PASSABLE'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                            : shelter.clinicAccessStatus === 'WATERLOGGED'
                            ? 'bg-amber-950/70 text-amber-300 border-amber-500/30'
                            : 'bg-rose-950/70 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {shelter.clinicAccessStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {shelter.shortageFlag ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Shortage</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Supplied</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Fixed Health Safety Guidance */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{language === 'en' ? 'Health Safety Guide' : 'স্বাস্থ্য সুরক্ষা নির্দেশনা'}</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                FIXED SAFETY TEXT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'en'
                ? `General safety information for ${selectedLoc.upazilaEn}; not a diagnosis or personalised treatment plan.`
                : `${selectedLoc.upazilaBn}-এর জন্য সাধারণ স্বাস্থ্য সুরক্ষা তথ্য; এটি রোগ নির্ণয় বা ব্যক্তিগত চিকিৎসা পরিকল্পনা নয়।`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyGuidance}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedGuidance ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedGuidance ? (language === 'en' ? 'Copied!' : 'কপি হয়েছে!') : (language === 'en' ? 'Copy Guide' : 'গাইড কপি')}</span>
            </button>
          </div>
        </div>

        {/* Model and medical safety disclaimer */}
        <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
          {language === 'en'
            ? 'Risk scores are hand-weighted planning indicators based on configured or demo inputs. They are not clinical diagnoses, outbreak predictions, or proof of current local conditions. Verify official warnings and seek qualified medical care.'
            : 'ঝুঁকির স্কোর নির্ধারিত বা ডেমো ইনপুটের ওপর তৈরি পরিকল্পনামূলক সূচক। এগুলো রোগ নির্ণয়, রোগ ছড়ানোর পূর্বাভাস বা বর্তমান এলাকার অবস্থার প্রমাণ নয়। সরকারি সতর্কতা যাচাই করুন এবং প্রয়োজন হলে চিকিৎসকের সহায়তা নিন।'}
        </div>

        {/* Visible Statutory Medical Disclaimer */}
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">{tr.healthDisclaimer}</span>
        </div>

        {/* AI Guidance Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* ORS Preparation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-emerald-400">
              <Droplets className="w-4 h-4" />
              <span>{healthGuidance?.orsPreparation?.title || 'ORS Preparation'}</span>
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {healthGuidance?.orsPreparation?.text ||
                (language === 'en'
                  ? 'Mix 1 packet of government ORS in 500ml of clean/boiled cooled water. Drink after every loose stool.'
                  : '৫০০ মি.লি. বিশুদ্ধ পানিতে ১ প্যাকেট খাবার স্যালাইন গুলিয়ে প্রতিবার পাতলা পায়খানার পর পান করুন।')}
            </p>
          </div>

          {/* Safe Water Purification */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-cyan-400">
              <Flame className="w-4 h-4" />
              <span>{healthGuidance?.safeWater?.title || 'Water Purification'}</span>
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {healthGuidance?.safeWater?.text ||
                (language === 'en'
                  ? 'Bring water to a rolling boil, or use purification tablets exactly as the product label says (dose and waiting time vary by product).'
                  : 'পানি টগবগিয়ে ফোটান অথবা বিশুদ্ধকরণ ট্যাবলেট প্যাকেটের নির্দেশনা অনুযায়ী ব্যবহার করুন (মাত্রা ও সময় পণ্যভেদে আলাদা)।')}
            </p>
          </div>

          {/* Wound Care */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{healthGuidance?.woundCare?.title || 'Wound & Skin Care'}</span>
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {healthGuidance?.woundCare?.text ||
                (language === 'en'
                  ? 'Wash abrasions immediately with clean water and soap. Keep wounds elevated and dry to prevent waterlogged cellulitis.'
                  : 'ক্ষত তৎক্ষণাৎ পরিষ্কার পানি ও সাবান দিয়ে ধুয়ে অ্যান্টিসেপটিক মলম লাগান। ক্ষত শুকনো রাখুন।')}
            </p>
          </div>

          {/* Snakebite Protocol */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-rose-400">
              <Bug className="w-4 h-4" />
              <span>{healthGuidance?.snakebiteSteps?.title || 'Snakebite Protocol'}</span>
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {healthGuidance?.snakebiteSteps?.text ||
                (language === 'en'
                  ? 'Keep victim calm; immobilize bitten limb with a splint. DO NOT cut, suck venom, or use tight tourniquets. Rush to clinic.'
                  : 'রোগীকে শান্ত রাখুন, আক্রান্ত অঙ্গ অনড় রাখুন। কখনোই কাটবেন না বা বাঁধন দেবেন না। দ্রুত হাসপাতালে নিন।')}
            </p>
          </div>

          {/* Hospital Red Flags */}
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 lg:col-span-2 space-y-2">
            <h4 className="font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{healthGuidance?.clinicRedFlags?.title || 'When to Evacuate to Clinic'}</span>
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {healthGuidance?.clinicRedFlags?.text ||
                (language === 'en'
                  ? 'Transfer immediately if: no urination for >6h, sunken eyes, inability to retain ORS due to persistent vomiting, fever >102°F, or snakebite puncture marks.'
                  : '৬ ঘণ্টার বেশি প্রস্রাব না হওয়া, চোখ গর্তে যাওয়া, ক্রমাগত বমিতে স্যালাইন ধরে রাখতে না পারা বা তীব্র জ্বর থাকলে তৎক্ষণাৎ হাসপাতালে নিন।')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
