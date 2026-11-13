import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Activity,
  Search,
  MapPin,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Waves,
  AlertTriangle,
} from 'lucide-react';
import { Language, LocationData } from '../../types';
import { t } from '../../utils/translations';
import { OverallHealth } from '../../hooks/useDataHealth';
import { computeSignal, BasinSignalResult } from '../../utils/basinPulse';
import { LiveWeatherPayload } from '../../utils/weatherTransform';

interface SignalStripProps {
  language: Language;
  bstTime: string;
  overall: OverallHealth;
  cherrapunjiRainfall24h: number | null;
  past24hTotalMm?: number | null;
  next24hTotalMm?: number | null;
  daily7Days?: number[];
  locations?: LocationData[];
  weatherPayload?: LiveWeatherPayload | null;
  onOpenDataHealth: () => void;
  onOpenCommandPalette?: () => void;
  myUpazilaName?: string | null;
  onNavigateToMyUpazila?: () => void;
  onNavigate?: (viewId: string) => void;
}

export const SignalStrip: React.FC<SignalStripProps> = ({
  language,
  bstTime,
  overall,
  cherrapunjiRainfall24h,
  past24hTotalMm,
  next24hTotalMm,
  daily7Days = [],
  locations = [],
  weatherPayload = null,
  onOpenDataHealth,
  onOpenCommandPalette,
  myUpazilaName,
  onNavigateToMyUpazila,
  onNavigate,
}) => {
  const tr = t[language];
  const isBn = language === 'bn';
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Compute dynamic real-time signal
  const signal: BasinSignalResult = computeSignal(locations, weatherPayload, null);

  const rainfallVal = past24hTotalMm ?? cherrapunjiRainfall24h;

  const getStatusColor = () => {
    if (signal.status === 'critical') return 'bg-rose-400';
    if (signal.status === 'warning') return 'bg-amber-400';
    if (overall === 'all_live') return 'bg-emerald-400';
    if (overall === 'partial') return 'bg-amber-400';
    return 'bg-rose-400';
  };

  const getProvenanceBadge = () => {
    const prov = signal.provenance;
    if (prov === 'LIVE') {
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
          LIVE
        </span>
      );
    }
    if (prov === 'DERIVED') {
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
          DERIVED
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
        SIMULATED
      </span>
    );
  };

  // Click outside to close Signal Brief
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsBriefOpen(false);
      }
    };
    if (isBriefOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBriefOpen]);

  // Keyboard accessibility: Escape closes and returns focus to trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isBriefOpen) {
        setIsBriefOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBriefOpen]);

  // Render 7-day sparkline SVG
  const renderSparkline = () => {
    const history = daily7Days.length > 0 ? daily7Days : signal.sevenDayHistory;
    if (!history || history.length === 0) return null;

    const max = Math.max(...history, 10);
    const width = 42;
    const height = 14;
    const step = width / Math.max(1, history.length - 1);

    const points = history
      .map((val, idx) => {
        const x = idx * step;
        const y = height - (val / max) * (height - 2) - 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg
        className="w-10 h-3.5 shrink-0 inline-block text-cyan-400"
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="relative w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-3 sm:px-4 py-1.5 text-[11px] flex items-center justify-between gap-3 text-slate-300">
      {/* Left: Interactive Signal Headline & Provenance */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsBriefOpen(!isBriefOpen)}
          aria-expanded={isBriefOpen}
          aria-haspopup="dialog"
          className="flex items-center gap-2 min-w-0 text-left hover:text-white transition cursor-pointer select-none group"
          title="Click to inspect live signal provenance & meteorological brief"
        >
          {/* Status Dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`}
            />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`} />
          </span>

          {/* Dynamic Headline */}
          <span className="font-semibold text-slate-200 truncate group-hover:text-cyan-200 transition">
            {isBn ? signal.headlineBn : signal.headlineEn}
          </span>
        </button>

        <span className="hidden sm:inline-block">{getProvenanceBadge()}</span>

        <span className="hidden md:inline-block text-slate-700">|</span>

        {/* Cherrapunji Rainfall Chip with 7-Day Sparkline */}
        <button
          type="button"
          onClick={() => setIsBriefOpen(true)}
          className="hidden md:inline-flex items-center gap-1.5 text-slate-400 font-mono hover:text-cyan-300 transition cursor-pointer"
          title="Click to view catchment rainfall history"
        >
          <span>{tr.cherrapunjiRain24h}</span>
          <strong className="text-cyan-300 font-bold">
            {rainfallVal !== null ? `${rainfallVal.toFixed(1)} mm` : '—'}
          </strong>

          {renderSparkline()}

          {signal.isDrySpell && (
            <span className="px-1 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 font-sans">
              {isBn ? 'শুষ্ক' : 'Dry'}
            </span>
          )}
        </button>

        {/* My Upazila Pin if set */}
        {myUpazilaName && (
          <>
            <span className="hidden lg:inline-block text-slate-700">|</span>
            <button
              type="button"
              onClick={onNavigateToMyUpazila}
              className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:text-white transition font-medium text-[10px]"
              title={isBn ? 'আপনার নির্বাচিত উপজেলা ভিউ' : 'Your selected monitored upazila'}
            >
              <MapPin className="w-2.5 h-2.5 text-cyan-400" />
              <span>
                {isBn ? 'আমার উপজেলা' : 'My Upazila'}: {myUpazilaName}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Right: Clock + Command Palette + Data Health Chip */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-mono text-[11px]">
        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/70 text-[10px] transition cursor-pointer"
            title="Search views and upazilas (Ctrl+K)"
          >
            <Search className="w-3 h-3 text-slate-400" />
            <span>{isBn ? 'অনুসন্ধান' : 'Search'}</span>
            <kbd className="px-1 py-0.2 bg-slate-900 border border-slate-700 rounded text-[9px] text-slate-400 font-sans">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Dhaka Time Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="tabular-nums">{bstTime || 'BST (UTC+6)'}</span>
        </div>

        {/* Data Health Chip */}
        <button
          onClick={onOpenDataHealth}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-slate-200 transition cursor-pointer text-[10px] font-sans"
          aria-haspopup="dialog"
          title="Click to check telemetry sync health"
        >
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="font-semibold">{tr.dataHealth}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`} />
        </button>
      </div>

      {/* Accessible Signal Brief Popover */}
      {isBriefOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={isBn ? 'সিগন্যাল বিশ্লেষণ ও উপাত্ত উৎস' : 'Signal Brief & Telemetry Provenance'}
          className="absolute left-3 sm:left-6 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-[460px] max-w-lg rounded-2xl bg-slate-950/98 border border-slate-700/80 shadow-2xl p-4 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-3"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-slate-100 text-xs">
                  {isBn ? 'অপারেশনস রুম সিগন্যাল বিশ্লেষণ' : 'Operations Room Signal Brief'}
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isBn
                  ? 'উজান বৃষ্টিপাত, অববাহিকা প্রবাহ ও পাউবো স্টেশন বিশ্লেষণ'
                  : 'Upstream rainfall, catchment propagation, and BWDB gauge telemetry'}
              </p>
            </div>
            <button
              onClick={() => {
                setIsBriefOpen(false);
                triggerRef.current?.focus();
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              aria-label="Close signal brief"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] leading-relaxed text-slate-300">
              {isBn ? signal.detailBn : signal.detailEn}
            </div>

            {/* Provenance and Sources */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block font-sans">
                  {isBn ? 'উৎস উপাত্ত' : 'Primary Source'}
                </span>
                <span className="text-cyan-300 font-bold">Open-Meteo & BWDB</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 block font-sans">
                  {isBn ? 'উপাত্ত প্রমাণক' : 'Provenance'}
                </span>
                <span className="text-emerald-300 font-bold">{signal.provenance}</span>
              </div>
            </div>

            {/* Next 24h Rainfall context */}
            {next24hTotalMm != null && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800 text-[10px]">
                <span className="text-slate-400">
                  {isBn ? 'চেরাপুঞ্জি আগামী ২৪ ঘণ্টার পূর্বাভাস:' : 'Cherrapunji Next 24h Forecast:'}
                </span>
                <span className="font-mono font-bold text-cyan-300">{next24hTotalMm.toFixed(1)} mm</span>
              </div>
            )}

            {/* Limitations Notice */}
            <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/20 text-[10px] text-amber-300/90 leading-tight">
              {isBn
                ? 'সতর্কবার্তা: এটি একটি গবেষণা প্রোটোটাইপ। সরকারি সতর্কবার্তা পেতে ১০৯০ নম্বরে যোগাযোগ করুন।'
                : 'Disclaimer: Academic decision-support prototype. Refer to official FFWC/BWDB bulletins for statutory warnings.'}
            </div>
          </div>

          {/* Quick links to BasinTwin & Early Warning */}
          {onNavigate && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onNavigate('basinTwin');
                  setIsBriefOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <span>{tr.navBasinTwin}</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('alerts');
                  setIsBriefOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <span>{tr.navAlerts}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
