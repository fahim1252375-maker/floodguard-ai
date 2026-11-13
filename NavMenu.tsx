import React from 'react';
import {
  Radio,
  Sliders,
  Sparkles,
  MapPin,
  BellRing,
  BrainCircuit,
  HeartPulse,
  History,
  Users,
  ShieldCheck,
  ShieldAlert,
  Info,
  ChevronDown,
  Network,
  Layers,
  LifeBuoy,
  Check,
  Activity,
} from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/translations';

interface NavMenuProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  language: Language;
  unreadAlertCount: number;
  isMoreDropdownOpen: boolean;
  onToggleMoreDropdown: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const NavMenu: React.FC<NavMenuProps> = ({
  currentView,
  onNavigate,
  language,
  unreadAlertCount,
  isMoreDropdownOpen,
  onToggleMoreDropdown,
  dropdownRef,
}) => {
  const tr = t[language];

  // Primary navigation items (Health Watch prominent for AI x Healthcare)
  const primaryNavItems = [
    {
      id: 'dashboard',
      label: tr.navDashboard,
      icon: Radio,
      badge: null,
    },
    {
      id: 'healthWatch',
      label: tr.navHealthWatch,
      icon: HeartPulse,
      badge: 'HEALTH',
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-500/40',
      highlight: true,
    },
    {
      id: 'map',
      label: tr.navMap,
      icon: MapPin,
      badge: null,
    },
    {
      id: 'alerts',
      label: tr.navAlerts,
      icon: BellRing,
      badge: unreadAlertCount > 0 ? unreadAlertCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'prediction',
      label: tr.navPrediction,
      icon: BrainCircuit,
      badge: 'AI',
      badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-500/40',
    },
    {
      id: 'simulator',
      label: tr.navSimulator,
      icon: Sliders,
      badge: null,
    },
    {
      id: 'assistant',
      label: tr.navAssistant,
      icon: Sparkles,
      badge: null,
    },
  ];

  // Secondary views inside "More Tools"
  const secondaryNavGroups = [
    {
      title: language === 'en' ? 'Hydrology & Analysis' : 'হাইড্রোলজি ও বিশ্লেষণ',
      items: [
        {
          id: 'basinTwin',
          label: tr.navBasinTwin,
          desc: language === 'en' ? 'Catchment lag & river graph' : 'চেরাপুঞ্জি উজান প্রবাহ গ্রাফ',
          icon: Network,
        },
        {
          id: 'historical',
          label: tr.navHistorical,
          desc: language === 'en' ? 'Hydrograph & June 2022 backtest' : 'ঐতিহাসিক উপাত্ত ও ব্যাকটেস্ট',
          icon: History,
        },
        {
          id: 'evidenceFusion',
          label: tr.navEvidenceFusion,
          desc: language === 'en' ? 'Sensor conflict detection' : 'মাল্টি-সেন্সর উপাত্ত যাচাই',
          icon: Layers,
        },
      ],
    },
    {
      title: language === 'en' ? 'Community Resilience' : 'কমিউনিটি ও আশ্রয়',
      items: [
        {
          id: 'community',
          label: tr.navCommunity,
          desc: language === 'en' ? 'Crowdsourced field reports' : 'মাঠ পর্যায়ের প্লাবন রিপোর্ট',
          icon: Users,
        },
        {
          id: 'routeSafe',
          label: tr.navRouteSafe,
          desc: language === 'en' ? 'Safe shelter routing & clinics' : 'নিরাপদ আশ্রয়কেন্দ্র ও হাসপাতাল রুট',
          icon: LifeBuoy,
        },
        {
          id: 'resiliencePlanner',
          label: tr.navResiliencePlanner,
          desc: language === 'en' ? 'Family medical & flood readiness' : 'পারিবারিক চিকিৎসা ও দুর্যোগ প্রস্তুতি',
          icon: ShieldCheck,
        },
        {
          id: 'opsCenter',
          label: tr.navOpsCenter,
          desc: language === 'en' ? 'Ensemble forecast, shelters, alert rules, SitRep' : 'এনসেম্বল পূর্বাভাস, আশ্রয়কেন্দ্র, সতর্কতা নিয়ম, প্রতিবেদন',
          icon: Activity,
        },
      ],
    },
    {
      title: language === 'en' ? 'Governance & Info' : 'প্রশাসন ও তথ্য',
      items: [
        {
          id: 'admin',
          label: tr.navAdmin,
          desc: language === 'en' ? 'PIN-protected emergency ops' : 'পিন সুরক্ষিত কন্ট্রোল প্যানেল',
          icon: ShieldAlert,
        },
        {
          id: 'about',
          label: tr.navAbout,
          desc: language === 'en' ? 'Project overview & methodology' : 'প্রকল্পের পরিচিতি ও পদ্ধতি',
          icon: Info,
        },
      ],
    },
  ];

  const isCurrentViewInSecondary = secondaryNavGroups.some((group) =>
    group.items.some((item) => item.id === currentView)
  );

  return (
    <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
      {primaryNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        const isHighlight = item.highlight;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`px-2.5 py-1.5 xl:px-3 xl:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all select-none cursor-pointer ${
              isActive
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/50'
                : isHighlight
                ? 'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/40 border border-emerald-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${
                isActive
                  ? 'text-cyan-400'
                  : isHighlight
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            />
            <span>{item.label}</span>

            {item.badge !== null && (
              <span
                className={`ml-1 px-1.5 py-0.2 text-[9px] font-black rounded-full uppercase tracking-wider ${
                  item.badgeColor || 'bg-slate-800 text-slate-300'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* "More Tools" Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={onToggleMoreDropdown}
          aria-expanded={isMoreDropdownOpen}
          aria-haspopup="menu"
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all select-none cursor-pointer ${
            isCurrentViewInSecondary || isMoreDropdownOpen
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/35'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>{language === 'bn' ? 'আরও' : 'More'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isMoreDropdownOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'
            }`}
          />
        </button>

        {isMoreDropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl p-3 space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {secondaryNavGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        role="menuitem"
                        type="button"
                        onClick={() => onNavigate(item.id)}
                        className={`w-full px-2.5 py-2 rounded-xl text-left flex items-start gap-2.5 transition select-none cursor-pointer ${
                          isActive
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'hover:bg-slate-900/80 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            isActive
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-200">
                              {item.label}
                            </span>
                            {isActive && <Check className="w-3 h-3 text-cyan-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
