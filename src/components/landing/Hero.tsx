import React from 'react';
import { ArrowRight, Compass, HeartPulse, Activity, MapPin, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Language, LocationData } from '../../types';
import { t } from '../../utils/translations';
import { HealthRadar } from './HealthRadar';
import { TopographicBackground } from './TopographicBackground';
import { useDataHealth } from '../../hooks/useDataHealth';

interface HeroProps {
  language: Language;
  onNavigate: (view: string, targetId?: string) => void;
  onStartDemo: () => void;
  locations: LocationData[];
  selectedUpazilaId: string;
  onSelectUpazila: (id: string) => void;
  highestDiseaseScore?: number;
  onOpenDataHealth?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  language,
  onNavigate,
  onStartDemo,
  locations,
  selectedUpazilaId,
  onSelectUpazila,
  highestDiseaseScore,
  onOpenDataHealth,
}) => {
  const tr = t[language];
  const { overall, cherrapunjiRainfall24h, sources } = useDataHealth();
  const weatherStatus = sources.find((s) => s.id === 'weather')?.status || 'live';

  const getChipStatusDisplay = () => {
    switch (overall) {
      case 'all_live':
        return {
          label: tr.allSourcesLive,
          color: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'partial':
        return {
          label: tr.partialData,
          color: 'text-amber-400 bg-amber-950/70 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      default:
        return {
          label: tr.offlineMode,
          color: 'text-rose-400 bg-rose-950/70 border-rose-500/30',
          dot: 'bg-rose-400',
        };
    }
  };

  const chip = getChipStatusDisplay();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Subtle Topographic Background */}
      <TopographicBackground />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        {/* Left Column: Editorial & Intentional Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Eyebrow: Calm, solid, zero-pill */}
            <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider uppercase text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>{tr.heroEyebrow}</span>
            </div>

            {/* Solid Color Headline without decorative gradients */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15] text-balance">
              {tr.heroTitle}
            </h1>

            {/* Supporting Sentence */}
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl text-balance">
              {tr.heroSubtitle}
            </p>
          </div>

          {/* Action Row & Personalization */}
          <div className="space-y-5 pt-2">
            {/* CTAs: 1 Primary + 1 Secondary + 1 quiet text link */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onStartDemo}
                className="px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center gap-2 shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-300 active:scale-95 min-h-[44px]"
              >
                <Compass className="w-4 h-4" />
                <span>{tr.startGuidedDemo}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 text-slate-200 border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-slate-400 min-h-[44px]"
              >
                <span>{tr.openLiveDashboard}</span>
              </button>

              <button
                onClick={() => onNavigate('healthWatch')}
                className="text-xs sm:text-sm font-medium text-rose-300 hover:text-rose-200 underline underline-offset-4 px-2 py-2 flex items-center gap-1 transition-colors min-h-[44px]"
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                <span>{tr.exploreHealthWatch}</span>
              </button>
            </div>

            {/* Under-CTA Meta Row: Compact Data Health Chip + My Upazila Selector */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs border-t border-slate-900">
              {/* Clickable Data Health chip */}
              <button
                onClick={onOpenDataHealth}
                className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 ${chip.color}`}
                title="Click to view data health popover"
              >
                <span className={`h-2 w-2 rounded-full ${chip.dot}`} />
                <span className="font-semibold">{chip.label}</span>
              </button>

              {/* Set My Upazila Selector */}
              <div className="inline-flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <label htmlFor="hero-my-upazila" className="text-slate-400 text-xs">
                  {tr.myUpazila}:
                </label>
                <select
                  id="hero-my-upazila"
                  value={selectedUpazilaId}
                  onChange={(e) => onSelectUpazila(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-medium focus:border-cyan-500 focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {language === 'en' ? loc.nameEn : loc.nameBn} ({loc.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Health Radar Interactive Schematic */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <HealthRadar
            locations={locations}
            language={language}
            onNavigate={onNavigate}
            cherrapunjiRainfall24h={cherrapunjiRainfall24h}
            weatherStatus={weatherStatus}
            highestDiseaseScore={highestDiseaseScore}
            selectedUpazilaId={selectedUpazilaId}
            onSelectUpazila={onSelectUpazila}
          />
        </div>
      </div>
    </section>
  );
};
