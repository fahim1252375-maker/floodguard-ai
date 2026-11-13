import React, { useState, useMemo } from 'react';
import {
  Activity,
  Filter,
  Search,
  Waves,
  CloudRain,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  ExternalLink,
  Sliders,
  Sparkles,
  Info,
  RefreshCw,
  Radio,
  Clock,
  CloudLightning,
  HeartPulse,
  ChevronRight,
} from 'lucide-react';
import { LocationData, AlertItem, CommunityReport, Language, District } from '../types';
import { LiveWeatherPayload } from '../utils/weatherTransform';
import { LiveRiverPayload } from '../utils/riverDischarge';
import { t } from '../utils/translations';
import { RiskBadge } from '../components/RiskBadge';
import { IncidentCommandBoard } from '../components/IncidentCommandBoard';
import { DataProvenanceExplorer } from '../components/DataProvenanceExplorer';
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

interface DashboardViewProps {
  locations: LocationData[];
  alerts: AlertItem[];
  reports: CommunityReport[];
  language: Language;
  onNavigate: (view: string, targetId?: string) => void;
  onSelectLocationForPrediction: (loc: LocationData) => void;
  liveWeather?: LiveWeatherPayload | null;
  isWeatherLive?: boolean;
  weatherOfflineNotice?: string | null;
  onRefreshWeather?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  locations,
  alerts,
  reports,
  language,
  onNavigate,
  onSelectLocationForPrediction,
  liveWeather,
  isWeatherLive = false,
  weatherOfflineNotice,
  onRefreshWeather,
}) => {
  const tr = t[language];

  const [selectedDistrict, setSelectedDistrict] = useState<'ALL' | District>('ALL');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // GloFAS River Discharge State
  const [riverData, setRiverData] = useState<LiveRiverPayload | null>(null);
  const [selectedRiverStation, setSelectedRiverStation] = useState<'sylhet' | 'sunamganj'>('sylhet');
  const [isRiverLoading, setIsRiverLoading] = useState(false);

  const fetchRiver = async () => {
    try {
      setIsRiverLoading(true);
      const res = await fetch('/api/river/live');
      const data: LiveRiverPayload = await res.json();
      if (data && data.success) {
        setRiverData(data);
      }
    } catch (e) {
      console.warn('Failed to load river discharge:', e);
    } finally {
      setIsRiverLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRiver();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshWeather) {
      await onRefreshWeather();
    }
    await fetchRiver();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchDistrict = selectedDistrict === 'ALL' || loc.district === selectedDistrict;
      const matchUpazila = selectedUpazila === 'ALL' || loc.id === selectedUpazila;
      const matchSearch =
        searchQuery.trim() === '' ||
        loc.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.nameBn.includes(searchQuery) ||
        loc.riverNameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.riverNameBn.includes(searchQuery);

      return matchDistrict && matchUpazila && matchSearch;
    });
  }, [locations, selectedDistrict, selectedUpazila, searchQuery]);

  // Aggregate telemetry
  const criticalLocations = locations.filter((l) => l.riskLevel === 'CRITICAL');
  const highLocations = locations.filter((l) => l.riskLevel === 'HIGH');
  const moderateLocations = locations.filter((l) => l.riskLevel === 'MODERATE');
  const lowLocations = locations.filter((l) => l.riskLevel === 'LOW');

  const maxRainfallStation = [...locations].sort((a, b) => b.rainfall24h - a.rainfall24h)[0];
  const maxWaterLevelSurge = [...locations].sort((a, b) => b.waterLevelChange24h - a.waterLevelChange24h)[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Open-Meteo Live Weather Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {tr.navDashboard}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Live Basin Telemetry
            </span>

            {/* Prominent Live vs Simulated Source Indicator */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 shadow-sm ${
                isWeatherLive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-emerald-950/40'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isWeatherLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{isWeatherLive ? 'LIVE: Open-Meteo' : 'SIMULATED'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {language === 'en'
              ? 'Real-time multi-station river stage, precipitation feeds, and flood risk classification'
              : 'সুরমা ও কুশিয়ারা অববাহিকার নদীর পানি, বৃষ্টিপাত এবং বিপদসীমা বিশ্লেষণ'}
          </p>
        </div>

        {/* Live Weather Controls & Quick Refresh */}
        <div className="flex items-center gap-2.5">
          {onRefreshWeather && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              title="Refresh live weather feeds from Open-Meteo"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{language === 'en' ? 'Sync Weather' : 'আবহাওয়া আপডেট'}</span>
            </button>
          )}

          {/* Quick Demo vs Live Notice */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-md">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-[11px] leading-tight">
              {isWeatherLive ? (
                <>
                  <strong className="text-emerald-400 font-bold">Open-Meteo Sync Active:</strong>{' '}
                  {language === 'en' ? 'Rainfall feeds updating every 10 min.' : 'বৃষ্টিপাত লাইভ আপডেট হচ্ছে।'}
                </>
              ) : (
                <>
                  <strong className="text-amber-400 font-bold">{tr.demoNotice}:</strong>{' '}
                  {language === 'en' ? 'Calibrated monsoonal baseline.' : 'ডেমো সিমুলেশন সক্রিয়।'}
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Offline Notice Banner (If Open-Meteo fails and falls back to simulated) */}
      {weatherOfflineNotice && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Offline Fallback Active:</strong> {weatherOfflineNotice}
            </span>
          </div>
          {onRefreshWeather && (
            <button
              onClick={handleRefresh}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold text-[11px] border border-amber-500/40 shrink-0 transition"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Live Regional Rainfall Summary Bar */}
      {liveWeather && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-cyan-500/20 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <CloudLightning className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white tracking-wide">
                {language === 'en'
                  ? 'Real-Time Precipitation Feeds (Open-Meteo Live)'
                  : 'রিয়েল-টাইম বৃষ্টিপাত পর্যবেক্ষণ (ওপেন-মেটিও লাইভ)'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Updated: {new Date(liveWeather.fetchedAt).toLocaleTimeString()}
              </span>
              <span>TTL: {liveWeather.cacheExpiresInSeconds}s</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sylhet Weather */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Sylhet Basin</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/30">
                  {isWeatherLive ? 'LIVE' : 'SIMULATED'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black font-mono text-sky-400">
                  {liveWeather.regions.sylhet.past24hTotalMm} mm
                </span>
                <span className="text-[10px] text-slate-400">24h past</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Next 24h Proj: <strong className="text-cyan-300">{liveWeather.regions.sylhet.next24hTotalMm} mm</strong>
              </div>
            </div>

            {/* Sunamganj Weather */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Sunamganj Haor</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/30">
                  {isWeatherLive ? 'LIVE' : 'SIMULATED'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black font-mono text-sky-400">
                  {liveWeather.regions.sunamganj.past24hTotalMm} mm
                </span>
                <span className="text-[10px] text-slate-400">24h past</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Next 24h Proj: <strong className="text-cyan-300">{liveWeather.regions.sunamganj.next24hTotalMm} mm</strong>
              </div>
            </div>

            {/* Cherrapunji Upstream Catchment Weather */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300">Cherrapunji Runoff</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                  UPSTREAM CATCHMENT
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black font-mono text-purple-400">
                  {liveWeather.regions.cherrapunji.past24hTotalMm} mm
                </span>
                <span className="text-[10px] text-slate-400">24h past</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Next 24h Proj: <strong className="text-purple-300">{liveWeather.regions.cherrapunji.next24hTotalMm} mm</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modelled River Discharge (GloFAS) Card */}
      {riverData && (
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-cyan-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm md:text-base font-black text-white tracking-wide">
                    {language === 'en' ? 'GloFAS Modelled River Discharge' : 'গ্লোফাস মডেলভিত্তিক নদীপ্রবাহ অনুমান'}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide flex items-center gap-1.5 ${
                      riverData.isLive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${riverData.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span>{riverData.isLive ? 'LIVE API · MODEL ESTIMATE' : 'SIMULATED EXAMPLE'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Daily GloFAS model estimate (~5 km grid cell); not a local river-gauge reading'
                    : 'দৈনিক গ্লোফাস মডেল অনুমান (প্রায় ৫ কিমি গ্রিড); স্থানীয় নদীর গেজ রিডিং নয়'}
                </p>
              </div>
            </div>

            {/* Station selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setSelectedRiverStation('sylhet')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRiverStation === 'sylhet'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sylhet (Surma)
              </button>
              <button
                onClick={() => setSelectedRiverStation('sunamganj')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRiverStation === 'sunamganj'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sunamganj (Haor)
              </button>
            </div>
          </div>

          {/* Active Station Key Discharge Metrics */}
          {(() => {
            const activeRegion = riverData.regions[selectedRiverStation];
            const hasDischarge = activeRegion.dataAvailable;
            const isSurging = hasDischarge && activeRegion.dischargeRatio >= 1.4;
            const isElevated = hasDischarge && activeRegion.dischargeRatio >= 1.15;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Current River Flow</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-black font-mono text-cyan-400">
                        {hasDischarge ? activeRegion.currentDischargeM3s : '—'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">m³/s</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate">{activeRegion.riverName}</span>
                    <span className="text-[10px] text-slate-500 block">{hasDischarge ? `Latest model day: ${activeRegion.dataDate}` : 'No valid daily discharge value returned'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Seasonal Mean</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-black font-mono text-amber-400">
                        {hasDischarge && activeRegion.meanDischargeM3s > 0 ? activeRegion.meanDischargeM3s : '—'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">m³/s</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Climatological Normal</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Discharge Ratio</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={`text-xl font-black font-mono ${
                          isSurging ? 'text-rose-400' : isElevated ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {hasDischarge && activeRegion.dischargeRatio > 0 ? `${activeRegion.dischargeRatio}x` : '—'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">vs Normal</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        isSurging ? 'text-rose-400' : isElevated ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {hasDischarge ? activeRegion.surgeStatus : 'NO DATA'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Algorithm Impact</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-bold font-mono text-sky-300">
                        {isSurging ? '+10 pts surge' : isElevated ? '+4 pts surge' : 'Baseline flow'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Feeds floodAlgorithm.ts</span>
                  </div>
                </div>

                {/* Recharts Line Chart */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
                        <span className="text-cyan-300 font-medium">Actual / Forecast Discharge</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-0.5 bg-amber-400 inline-block border-b border-dashed border-amber-400" />
                        <span className="text-amber-300 font-medium">Seasonal Mean</span>
                      </span>
                      <span className="flex items-center gap-1.5 hidden md:flex">
                        <span className="w-2.5 h-0.5 bg-rose-400 inline-block" />
                        <span className="text-rose-300 font-medium">Peak Surge Capacity</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Unit: m³/s (Cubic Meters per Sec)</span>
                  </div>

                  <div className="h-48 w-full">
                    {activeRegion.timeline.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">No valid GloFAS daily values are available for this location yet.</div>
                    ) : <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeRegion.timeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v: string) => v.slice(5)}
                        />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#020617',
                            borderColor: '#334155',
                            borderRadius: '0.75rem',
                            fontSize: '11px',
                            color: '#f8fafc',
                          }}
                          formatter={(val: any, name: any) => [`${val} m³/s`, name]}
                          labelFormatter={(label: any) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="dischargeM3s"
                          name="Discharge Flow"
                          stroke="#06b6d4"
                          strokeWidth={2.5}
                          dot={{ r: 2, fill: '#06b6d4' }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="meanDischargeM3s"
                          name="Seasonal Mean"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="maxDischargeM3s"
                          name="Peak Max Flow"
                          stroke="#f43f5e"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Health Impact Summary Card (Flood-health preparedness) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900/90 border border-emerald-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400">
                Health Impact & Waterborne Disease Watch
              </span>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                FLOOD HEALTH PREPAREDNESS
              </span>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/30">
                DERIVED RISK INDEX
              </span>
            </div>
            <p className="text-sm font-black text-white">
              {language === 'en'
                ? 'Floods become health crises. We estimate health risks to support earlier preparation.'
                : 'প্লাবন রূপ নেয় স্বাস্থ্য সংকটে। পানি আসার আগেই আমরা স্বাস্থ্যঝুঁকির পূর্বাভাস দিই।'}
            </p>
            <p className="text-xs text-slate-300">
              {language === 'en'
                ? 'Cholera, typhoid & dermatitis risk indices elevated in low-lying haor upazilas with submerged tube wells.'
                : 'নলকূপ তলিয়ে যাওয়ায় নিচু হাওর এলাকায় ডায়রিয়া, টাইফয়েড ও চর্মরোগের ঝুঁকি আশঙ্কাজনকভাবে বেড়েছে।'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('healthWatch')}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40 cursor-pointer shrink-0 active:scale-95"
        >
          <span>{language === 'en' ? 'Launch Health Watch' : 'স্বাস্থ্য নজরদারি খুলুন'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: River Stage Breaches */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative group overflow-hidden">
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-950 text-slate-400 border border-slate-800">
              {isWeatherLive ? 'LIVE CALC' : 'SIMULATED'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">{tr.waterLevel}</span>
            <Waves className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {criticalLocations.length + highLocations.length}
            </span>
            <span className="text-xs font-semibold text-rose-400">Above Warning Mark</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            Surma at Chhatak & Sari at Gowainghat
          </p>
        </div>

        {/* Card 2: Peak Rainfall */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative group overflow-hidden">
          <div className="absolute top-2 right-2">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                isWeatherLive
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              {isWeatherLive ? 'LIVE: Open-Meteo' : 'SIMULATED'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">{tr.rainfall24h} (Peak)</span>
            <CloudRain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-400">
              {maxRainfallStation ? `${maxRainfallStation.rainfall24h} mm` : '0 mm'}
            </span>
            <span className="text-xs text-slate-400">
              {maxRainfallStation ? maxRainfallStation.nameEn : ''}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {language === 'en' ? 'Persistent monsoon band' : 'ভারী মৌসুমী বর্ষণ এলাকা'}
          </p>
        </div>

        {/* Card 3: Surge Velocity */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative group overflow-hidden">
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-950 text-slate-400 border border-slate-800">
              {isWeatherLive ? 'LIVE CALC' : 'SIMULATED'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Surge Velocity</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">
              +{maxWaterLevelSurge ? maxWaterLevelSurge.waterLevelChange24h.toFixed(2) : '0'} m
            </span>
            <span className="text-xs text-slate-400">/ 24 hrs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            Fastest rise at {maxWaterLevelSurge ? maxWaterLevelSurge.nameEn : ''}
          </p>
        </div>

        {/* Card 4: Active Warnings */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative group overflow-hidden">
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-950 text-slate-400 border border-slate-800">
              OFFICIAL DESK
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Active Warnings</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{alerts.length}</span>
            <span className="text-xs text-slate-400">Bulletins</span>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 mt-2 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'en' ? 'Review Alerts' : 'বিজ্ঞপ্তি দেখুন'}</span> &rarr;
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* District selector buttons */}
          <div className="inline-flex rounded-xl p-1 bg-slate-950 border border-slate-800">
            <button
              onClick={() => {
                setSelectedDistrict('ALL');
                setSelectedUpazila('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDistrict === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tr.allDistricts} ({locations.length})
            </button>
            <button
              onClick={() => {
                setSelectedDistrict('Sylhet');
                setSelectedUpazila('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDistrict === 'Sylhet'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sylhet (5)
            </button>
            <button
              onClick={() => {
                setSelectedDistrict('Sunamganj');
                setSelectedUpazila('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDistrict === 'Sunamganj'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sunamganj (4)
            </button>
          </div>

          {/* Upazila dropdown */}
          <select
            value={selectedUpazila}
            onChange={(e) => setSelectedUpazila(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">{tr.allUpazilas}</option>
            {locations
              .filter((l) => selectedDistrict === 'ALL' || l.district === selectedDistrict)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {language === 'en' ? l.nameEn : l.nameBn} ({l.district})
                </option>
              ))}
          </select>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={tr.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Main Grid: Station Cards with Stage Data Provenance Badge */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>
              {language === 'en'
                ? `Active River Telemetry Stations (${filteredLocations.length})`
                : `সক্রিয় নদী পরিমাপ স্টেশন (${filteredLocations.length}টি)`}
            </span>
          </h2>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Risk Distribution:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30">
              {criticalLocations.length} Critical
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950/80 text-orange-300 border border-orange-500/30">
              {highLocations.length} High
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
              {moderateLocations.length} Mod
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLocations.map((loc) => {
            const diff = loc.currentWaterLevel - loc.dangerLevel;
            const isBreaching = diff >= 0;
            const fillPercent = Math.min(
              100,
              Math.max(10, (loc.currentWaterLevel / (loc.dangerLevel + 1.5)) * 100)
            );

            return (
              <div
                key={loc.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Station Title & Visible Live vs Simulated Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          {language === 'en' ? loc.nameEn : loc.nameBn}
                        </h3>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {loc.district}
                        </span>

                        {/* Visible Data Source Badge */}
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            loc.isSimulated
                              ? 'bg-amber-950/90 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          STAGE: {loc.isSimulated ? 'SIMULATED' : 'REFERENCE INPUT'}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-300 font-medium">
                        {language === 'en' ? loc.riverNameEn : loc.riverNameBn}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        BWDB ID: {loc.stationName}
                      </p>
                    </div>
                    <RiskBadge level={loc.riskLevel} language={language} size="sm" />
                  </div>

                  {/* Water Level Visual Progress Meter */}
                  <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">{tr.waterLevel}:</span>
                      <span className="text-lg font-black font-mono text-white">
                        {loc.currentWaterLevel.toFixed(2)} m
                      </span>
                    </div>

                    {/* Progress bar representing danger mark */}
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          loc.riskLevel === 'CRITICAL'
                            ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                            : loc.riskLevel === 'HIGH'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : loc.riskLevel === 'MODERATE'
                            ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>

                    {/* Gauge reference markers */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Warn: {loc.warningLevel.toFixed(2)}m</span>
                      <span className={`font-bold ${isBreaching ? 'text-rose-400' : 'text-slate-300'}`}>
                        Danger: {loc.dangerLevel.toFixed(2)}m
                      </span>
                    </div>

                    {/* Delta highlight */}
                    <div className="text-[11px] font-semibold flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">Delta vs Danger:</span>
                      <span className={isBreaching ? 'text-rose-400' : 'text-emerald-400'}>
                        {isBreaching
                          ? `+${diff.toFixed(2)}m ABOVE DANGER`
                          : `${Math.abs(diff).toFixed(2)}m Below Danger`}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{tr.rainfall24h}</span>
                        <span
                          className={`text-[8px] font-mono uppercase px-1 rounded ${
                            loc.isSimulated ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {loc.isSimulated ? 'SIM' : 'REF'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-sky-300">
                        {loc.rainfall24h} mm
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">{tr.rateOfRise}</span>
                      <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
                        {loc.waterLevelChange24h > 0 ? (
                          <TrendingUp className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Minus className="w-3 h-3 text-slate-400" />
                        )}
                        <span>
                          {loc.waterLevelChange24h > 0
                            ? `+${loc.waterLevelChange24h.toFixed(2)}m`
                            : `${loc.waterLevelChange24h.toFixed(2)}m`}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectLocationForPrediction(loc)}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Predict AI</span>
                  </button>

                  <button
                    onClick={() => onNavigate('map', loc.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95 cursor-pointer"
                    title="View on Map"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Task Management Board */}
      <IncidentCommandBoard
        locations={locations}
        alerts={alerts}
        language={language}
      />

      {/* Research-Grade Data Provenance & Metric Lineage Explorer */}
      <DataProvenanceExplorer language={language} />
    </div>
  );
};
