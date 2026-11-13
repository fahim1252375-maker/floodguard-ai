import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Sliders,
  MapPin,
  Bot,
  BellRing,
  Users,
  History,
  ShieldCheck,
  Info,
  Home,
  ChevronRight,
  Layers,
  Network,
  Radio,
  Building2,
  Navigation,
  ClipboardCheck,
  Satellite,
  Globe,
  HeartPulse,
  Activity,
  LifeBuoy,
} from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  language: Language;
  unreadAlertCount: number;
  pendingReportsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: number | string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  language,
  unreadAlertCount,
  pendingReportsCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const tr = t[language];

  const navGroups: NavGroup[] = [
    {
      title: tr.mainNavGroup,
      items: [
        { id: 'landing', label: tr.navLanding, icon: Home },
        { id: 'dashboard', label: tr.navDashboard, icon: LayoutDashboard },
        { id: 'map', label: tr.navMap, icon: MapPin },
      ],
    },
    {
      title: tr.hydrologyNavGroup,
      items: [
        { id: 'basinTwin', label: tr.navBasinTwin, icon: Network, highlight: true },
        { id: 'evidenceFusion', label: tr.navEvidenceFusion, icon: Radio },
        { id: 'satellite', label: tr.navSatellite, icon: Satellite },
      ],
    },
    {
      title: tr.intelNavGroup,
      items: [
        {
          id: 'healthWatch',
          label: tr.navHealthWatch,
          icon: HeartPulse,
          highlight: true,
          badge: 'HEALTH',
          badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-500/40',
        },
        { id: 'prediction', label: tr.navPrediction, icon: BrainCircuit },
        { id: 'simulator', label: tr.navSimulator, icon: Sliders, highlight: true },
        { id: 'assistant', label: tr.navAssistant, icon: Bot },
        {
          id: 'opsCenter',
          label: tr.navOpsCenter,
          icon: Activity,
          highlight: true,
          badge: 'NEW',
          badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-500/40',
        },
      ],
    },
    {
      title: tr.preparednessNavGroup,
      items: [
        {
          id: 'safetyPlan',
          label: language === 'bn' ? 'পারিবারিক সুরক্ষা পরিকল্পনা' : 'Family Safety Plan',
          icon: LifeBuoy,
          highlight: true,
          badge: 'NEW',
          badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-500/40',
        },
        { id: 'impactLens', label: tr.navImpactLens, icon: Building2 },
        { id: 'routeSafe', label: tr.navRouteSafe, icon: Navigation },
        { id: 'resiliencePlanner', label: tr.navResiliencePlanner, icon: ClipboardCheck },
        {
          id: 'alerts',
          label: tr.navAlerts,
          icon: BellRing,
          badge: unreadAlertCount > 0 ? unreadAlertCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'community',
          label: tr.navCommunity,
          icon: Users,
          badge: pendingReportsCount > 0 ? pendingReportsCount : undefined,
          badgeColor: 'bg-cyan-500 text-slate-950 font-bold',
        },
      ],
    },
    {
      title: tr.govNavGroup,
      items: [
        { id: 'globalCoverage', label: tr.navGlobalCoverage, icon: Globe },
        { id: 'historical', label: tr.navHistorical, icon: History },
        { id: 'admin', label: tr.navAdmin, icon: ShieldCheck },
        { id: 'about', label: tr.navAbout, icon: Info },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-30 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header in mobile / spacer in desktop */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-black">
              FG
            </div>
            <span className="font-bold text-white text-base">FloodGuard AI</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-2 text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>

        {/* Region Focus Badge */}
        <div className="p-3.5 mx-3 my-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {language === 'en' ? 'Haor Basin Node' : 'হাওর অববাহিকা নোড'}
            </span>
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </div>
          <p className="text-xs font-semibold text-slate-200">
            {language === 'en' ? 'Sylhet & Sunamganj Focus' : 'সিলেট ও সুনামগঞ্জ ফোকাস'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Surma, Kushiyara & Jadukata Rivers
          </p>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/40'
                          : item.highlight
                          ? 'text-cyan-400 hover:bg-slate-900/80 border border-cyan-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? 'text-cyan-400'
                              : item.highlight
                              ? 'text-cyan-400'
                              : 'text-slate-400 group-hover:text-slate-300'
                          }`}
                        />
                        <span className="tracking-wide">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.highlight && !isActive && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            Pro
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive
                              ? 'text-cyan-400 translate-x-0.5'
                              : 'text-slate-400 opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info box */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Platform Data:</span>
            <span className="font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20 text-[10px]">
              Simulated Stream
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Model:</span>
            <span className="font-mono text-cyan-300 text-[10px]">Gemini Flash</span>
          </div>
        </div>
      </aside>
    </>
  );
};
