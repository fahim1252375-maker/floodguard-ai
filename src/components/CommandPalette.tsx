import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Compass,
  HeartPulse,
  Activity,
  MapPin,
  Sparkles,
  Sliders,
  Shield,
  Layers,
  Map,
  MessageSquare,
  Navigation,
  Satellite,
  Globe,
  History,
  FileText,
  Languages,
  X,
  Radio,
} from 'lucide-react';
import { Language, LocationData } from '../types';
import { t } from '../utils/translations';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onNavigate: (view: string, targetId?: string) => void;
  onLanguageChange: (lang: Language) => void;
  onStartDemo?: () => void;
  onOpenDataHealth?: () => void;
  locations?: LocationData[];
}

interface CommandItem {
  id: string;
  category: 'views' | 'upazilas' | 'actions';
  titleEn: string;
  titleBn: string;
  subtitleEn?: string;
  subtitleBn?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  language,
  onNavigate,
  onLanguageChange,
  onStartDemo,
  onOpenDataHealth,
  locations = [],
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isBn = language === 'bn';

  // Base navigation views
  const viewCommands: CommandItem[] = useMemo(
    () => [
      {
        id: 'view-healthWatch',
        category: 'views',
        titleEn: 'Flood Health Watch',
        titleBn: 'বন্যা স্বাস্থ্য পর্যবেক্ষণ',
        subtitleEn: 'Disease projection & health facility isolation matrix',
        subtitleBn: 'রোগ বিস্তার পূর্বাভাস ও স্বাস্থ্যসেবা বিচ্ছিন্নতা ম্যাট্রিক্স',
        icon: HeartPulse,
        onSelect: () => onNavigate('healthWatch'),
      },
      {
        id: 'view-dashboard',
        category: 'views',
        titleEn: 'Telemetry Operations Room',
        titleBn: 'টেলিমেট্রি অপারেশনস রুম',
        subtitleEn: 'Live rainfall, modelled GloFAS estimates and simulated stage inputs',
        subtitleBn: 'লাইভ বৃষ্টিপাত, মডেলভিত্তিক গ্লোফাস অনুমান ও সিমুলেটেড নদীর স্তর',
        icon: Activity,
        onSelect: () => onNavigate('dashboard'),
      },
      {
        id: 'view-earlyWarning',
        category: 'views',
        titleEn: 'Early Warning Broadcasts',
        titleBn: 'জরুরি আগাম সতর্কবার্তা',
        subtitleEn: 'Actionable emergency bulletins & advisories',
        subtitleBn: 'কার্যকর জরুরি সতর্কবার্তা এবং পরামর্শ',
        icon: Shield,
        onSelect: () => onNavigate('alerts'),
      },
      {
        id: 'view-map',
        category: 'views',
        titleEn: 'Catchment GIS Map',
        titleBn: 'ক্যাচমেন্ট জিআইএস মানচিত্র',
        subtitleEn: 'Interactive upstream watershed and monitoring stations',
        subtitleBn: 'ইন্টারেক্টিভ উজানের জলাধার ও পর্যবেক্ষণ স্টেশন',
        icon: Map,
        onSelect: () => onNavigate('map'),
      },
      {
        id: 'view-basinTwin',
        category: 'views',
        titleEn: 'Basin Digital Twin',
        titleBn: 'বেসিন ডিজিটাল টুইন',
        subtitleEn: 'Transboundary Surma-Kushiyara hydraulic simulation',
        subtitleBn: 'আন্তঃসীমান্ত সুরমা-কুশিয়ারা হাইড্রোলিক মডেল',
        icon: Layers,
        onSelect: () => onNavigate('basinTwin'),
      },
      {
        id: 'view-routeSafe',
        category: 'views',
        titleEn: 'RouteSafe Evacuation Logistics',
        titleBn: 'রুট-সেফ নিরাপদ আশ্রয় সংযোগ',
        subtitleEn: 'Submerged road bypass and dry-path routing',
        subtitleBn: 'প্লাবিত সড়ক এড়িয়ে নিরাপদ উচুঁ আশ্রয়পথ',
        icon: Navigation,
        onSelect: () => onNavigate('routeSafe'),
      },
      {
        id: 'view-opsCenter',
        category: 'views',
        titleEn: 'Operations Center',
        titleBn: 'অপারেশন সেন্টার',
        subtitleEn: 'Ensemble forecast, shelter allocation, alert rules and SitRep',
        subtitleBn: 'এনসেম্বল পূর্বাভাস, আশ্রয়কেন্দ্র বণ্টন, সতর্কতা নিয়ম ও প্রতিবেদন',
        icon: Activity,
        onSelect: () => onNavigate('opsCenter'),
      },
      {
        id: 'view-safetyPlan',
        category: 'views',
        titleEn: 'Family Safety Plan',
        titleBn: 'পারিবারিক সুরক্ষা পরিকল্পনা',
        subtitleEn: 'Risk-aware actions, personalised go-bag, contacts and meeting point',
        subtitleBn: 'ঝুঁকিভিত্তিক করণীয়, ব্যক্তিগত জরুরি ব্যাগ, যোগাযোগ ও মিলনস্থল',
        icon: Compass,
        onSelect: () => onNavigate('safetyPlan'),
      },
      {
        id: 'view-resiliencePlanner',
        category: 'views',
        titleEn: 'Household Resilience & Health Kit',
        titleBn: 'পারিবারিক দুর্যোগ প্রস্তুতি ও স্বাস্থ্য কিট',
        subtitleEn: 'Checklist and waterborne disease mitigation guide',
        subtitleBn: 'জরুরি চেকলিস্ট ও পানিবাহিত রোগ প্রতিরোধ গাইড',
        icon: Compass,
        onSelect: () => onNavigate('resiliencePlanner'),
      },
      {
        id: 'view-evidenceFusion',
        category: 'views',
        titleEn: 'Evidence Fusion Matrix',
        titleBn: 'মাল্টি-সোর্স এভিডেন্স ফিউশন',
        subtitleEn: 'GloFAS, radar, rain gauges and community telemetry',
        subtitleBn: 'গ্লোফাস, রাডার, গেজ ও মাঠপর্যায়ের উপাত্ত সমন্বয়',
        icon: Sparkles,
        onSelect: () => onNavigate('evidenceFusion'),
      },
      {
        id: 'view-simulator',
        category: 'views',
        titleEn: 'Hydrological Surge Simulator',
        titleBn: 'হাইড্রোলজিক্যাল সিমুলেটর',
        subtitleEn: 'Scenario stress testing for upstream rainfall spikes',
        subtitleBn: 'উজানের চরম বৃষ্টিপাতের প্রভাব পরীক্ষা',
        icon: Sliders,
        onSelect: () => onNavigate('simulator'),
      },
      {
        id: 'view-community',
        category: 'views',
        titleEn: 'Community Field Telemetry',
        titleBn: 'মাঠপর্যায়ের নাগরিক রিপোর্ট',
        subtitleEn: 'Ground truth verifications & local flood depth',
        subtitleBn: 'মাঠের তথ্য যাচাই ও স্থানীয় প্লাবন মাত্রা',
        icon: MessageSquare,
        onSelect: () => onNavigate('community'),
      },
      {
        id: 'view-satellite',
        category: 'views',
        titleEn: 'Satellite Inundation Extent',
        titleBn: 'স্যাটেলাইট প্লাবন বিশ্লেষণ',
        subtitleEn: 'Synthetic Aperture Radar water extent analysis',
        subtitleBn: 'সিন্থেটিক অ্যাপারচার রাডার প্লাবন স্তর',
        icon: Satellite,
        onSelect: () => onNavigate('satellite'),
      },
      {
        id: 'view-globalCoverage',
        category: 'views',
        titleEn: 'Global Cross-Basin Telemetry',
        titleBn: 'আন্তর্জাতিক অববাহিকা বিস্তার',
        subtitleEn: 'Portability to Brahmaputra, Mekong, and Rhine',
        subtitleBn: 'ব্রহ্মপুত্র, মেকং ও রাইন অববাহিকায় ব্যবহারযোগ্যতা',
        icon: Globe,
        onSelect: () => onNavigate('globalCoverage'),
      },
      {
        id: 'view-historical',
        category: 'views',
        titleEn: 'June 2022 Mega-Flood Backtest',
        titleBn: 'জুন ২০২২ বন্যা ব্যাকটেস্ট',
        subtitleEn: 'Empirical model validation against historic inundation',
        subtitleBn: 'ঐতিহাসিক বন্যার বিপরীতে অ্যালগরিদম যাচাই',
        icon: History,
        onSelect: () => onNavigate('historical'),
      },
      {
        id: 'view-about',
        category: 'views',
        titleEn: 'Operational Methodology & Project Overview',
        titleBn: 'পদ্ধতি ও ডিএসএইচ হ্যাকস ভি২ তথ্য',
        subtitleEn: 'Clinical validation, provenance badges and architecture',
        subtitleBn: 'ক্লিনিক্যাল যাচাই, উপাত্তের উৎস ও স্থাপত্য',
        icon: FileText,
        onSelect: () => onNavigate('about'),
      },
    ],
    [onNavigate]
  );

  // Upazila search commands
  const upazilaCommands: CommandItem[] = useMemo(() => {
    return locations.map((loc) => ({
      id: `upazila-${loc.id}`,
      category: 'upazilas',
      titleEn: `${loc.nameEn} Upazila (${loc.district})`,
      titleBn: `${loc.nameBn} উপজেলা (${loc.district})`,
      subtitleEn: `Water Level: ${loc.currentWaterLevel.toFixed(2)}m (DL: ${loc.dangerLevel.toFixed(2)}m) · Risk: ${loc.riskLevel}`,
      subtitleBn: `পানির স্তর: ${loc.currentWaterLevel.toFixed(2)} মি. (বিপদসীমা: ${loc.dangerLevel.toFixed(2)} মি.) · ঝুঁকি: ${loc.riskLevel}`,
      icon: MapPin,
      onSelect: () => {
        onNavigate('healthWatch', loc.id);
      },
    }));
  }, [locations, onNavigate]);

  // Operational action commands
  const actionCommands: CommandItem[] = useMemo(
    () => [
      {
        id: 'action-lang-bn',
        category: 'actions',
        titleEn: 'Switch language to Bangla (বাংলা)',
        titleBn: 'ভাষা পরিবর্তন: বাংলা',
        subtitleEn: 'Render entire platform in native Bangla',
        subtitleBn: 'সম্পূর্ণ প্ল্যাটফর্ম বাংলায় দেখুন',
        icon: Languages,
        onSelect: () => onLanguageChange('bn'),
      },
      {
        id: 'action-lang-en',
        category: 'actions',
        titleEn: 'Switch language to English',
        titleBn: 'ভাষা পরিবর্তন: ইংরেজি (English)',
        subtitleEn: 'Render entire platform in English',
        subtitleBn: 'সম্পূর্ণ প্ল্যাটফর্ম ইংরেজিতে দেখুন',
        icon: Languages,
        onSelect: () => onLanguageChange('en'),
      },
      ...(onStartDemo
        ? [
            {
              id: 'action-demo',
              category: 'actions' as const,
              titleEn: 'Start 60-Second Guided Tour',
              titleBn: '৬০ সেকেন্ডের গাইডেড ডেমো চালু করুন',
              subtitleEn: 'Step through key healthcare and flood prediction workflows',
              subtitleBn: 'স্বাস্থ্যসেবা ও বন্যা পূর্বাভাস এর মূল ধাপগুলো দেখুন',
              icon: Sparkles,
              onSelect: onStartDemo,
            },
          ]
        : []),
      ...(onOpenDataHealth
        ? [
            {
              id: 'action-data-health',
              category: 'actions' as const,
              titleEn: 'Check Telemetry Sync & Data Health',
              titleBn: 'টেলিমেট্রি সংযোগ ও ডেটা স্বাস্থ্য পরীক্ষা',
              subtitleEn: 'Inspect latency and status for Open-Meteo, GloFAS and Gauges',
              subtitleBn: 'ওপেন-মেটিও, গ্লোফাস ও গেজ ডেটার লাইভ সংযোগ অবস্থা',
              icon: Radio,
              onSelect: onOpenDataHealth,
            },
          ]
        : []),
    ],
    [onLanguageChange, onStartDemo, onOpenDataHealth]
  );

  const allCommands = useMemo(
    () => [...viewCommands, ...upazilaCommands, ...actionCommands],
    [viewCommands, upazilaCommands, actionCommands]
  );

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase().trim();
    return allCommands.filter(
      (cmd) =>
        cmd.titleEn.toLowerCase().includes(q) ||
        cmd.titleBn.toLowerCase().includes(q) ||
        (cmd.subtitleEn && cmd.subtitleEn.toLowerCase().includes(q)) ||
        (cmd.subtitleBn && cmd.subtitleBn.toLowerCase().includes(q))
    );
  }, [allCommands, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation within palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].onSelect();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Ensure highlighted element is scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isBn ? 'কমান্ড প্যালেট' : 'Command Palette'}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <Search className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isBn
                ? 'ভিউ, উপজেলা বা অ্যাকশন খুঁজুন (উদাঃ স্বাস্থ্য, গোয়াইনঘাট, ভাষা)...'
                : 'Search views, upazilas, or quick actions (e.g., health, gowainghat, demo)...'
            }
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            aria-autocomplete="list"
            aria-controls="command-list"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <ul
          id="command-list"
          ref={listRef}
          role="listbox"
          className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40 text-xs sm:text-sm"
        >
          {filteredCommands.length === 0 ? (
            <li className="py-8 text-center text-slate-500 text-xs sm:text-sm">
              {isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No matching views, upazilas, or actions found'}
            </li>
          ) : (
            filteredCommands.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/10 text-cyan-200 border-l-2 border-cyan-400'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 truncate">
                      {isBn ? item.titleBn : item.titleEn}
                    </div>
                    {(item.subtitleEn || item.subtitleBn) && (
                      <div className="text-[11px] text-slate-400 truncate">
                        {isBn ? item.subtitleBn : item.subtitleEn}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                    {item.category === 'views'
                      ? isBn
                        ? 'ভিউ'
                        : 'View'
                      : item.category === 'upazilas'
                      ? isBn
                        ? 'উপজেলা'
                        : 'Upazila'
                      : isBn
                      ? 'অ্যাকশন'
                      : 'Action'}
                  </span>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ {isBn ? 'নেভিগেট' : 'Navigate'}</span>
            <span>·</span>
            <span>↵ {isBn ? 'নির্বাচন' : 'Select'}</span>
            <span>·</span>
            <span>ESC {isBn ? 'বন্ধ' : 'Dismiss'}</span>
          </div>
          <span className="hidden sm:inline">
            {isBn ? 'ডিএসএইচ হ্যাকস ভি২' : 'FloodGuard AI Operations'}
          </span>
        </div>
      </div>
    </div>
  );
};
