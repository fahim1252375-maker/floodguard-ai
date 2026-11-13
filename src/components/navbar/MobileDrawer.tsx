import React from 'react';
import {
  Radio,
  Sliders,
  Sparkles,
  MapPin,
  BellRing,
  BrainCircuit,
  HeartPulse,
  Languages,
  PhoneCall,
  Clock,
  History,
  Users,
  ShieldCheck,
  ShieldAlert,
  Info,
  Network,
  Layers,
  LifeBuoy,
  Check,
  Activity,
} from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/translations';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (viewId: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  unreadAlertCount: number;
  onOpenEmergencyModal: () => void;
  bstTime: string;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  language,
  onLanguageChange,
  unreadAlertCount,
  onOpenEmergencyModal,
  bstTime,
}) => {
  if (!isOpen) return null;

  const tr = t[language];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    onClose();
  };

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

  return (
    <div
      role="dialog"
      aria-label="Mobile Navigation Menu"
      className="lg:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-xl px-4 py-4 space-y-4 max-h-[82vh] overflow-y-auto animate-in slide-in-from-top duration-200"
    >
      {/* Mobile Controls Header */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200">
            {language === 'en' ? 'Language:' : 'ভাষা:'}
          </span>
          <div className="inline-flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                language === 'en'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('bn')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition font-bengali ${
                language === 'bn'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              BN (বাংলা)
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onOpenEmergencyModal();
            onClose();
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5"
        >
          <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
          <span>1090</span>
        </button>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
            currentView === 'dashboard'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
              : 'bg-slate-900/70 border-slate-800 text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold">{tr.navDashboard}</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('healthWatch')}
          className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
            currentView === 'healthWatch'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{tr.navHealthWatch}</span>
          </div>
          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950">
            HEALTH
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('map')}
          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
            currentView === 'map'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
              : 'bg-slate-900/70 border-slate-800 text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold">{tr.navMap}</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('alerts')}
          className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
            currentView === 'alerts'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
              : 'bg-slate-900/70 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold">{tr.navAlerts}</span>
          </div>
          {unreadAlertCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
              {unreadAlertCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('prediction')}
          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
            currentView === 'prediction'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
              : 'bg-slate-900/70 border-slate-800 text-slate-200'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold">{tr.navPrediction}</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('simulator')}
          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
            currentView === 'simulator'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
              : 'bg-slate-900/70 border-slate-800 text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold">{tr.navSimulator}</span>
        </button>
      </div>

      {/* Categorized Detailed Menu */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        {secondaryNavGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition ${
                      isActive
                        ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold'
                        : 'bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}
                      />
                      <div>
                        <span className="text-xs font-medium block">{item.label}</span>
                        <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Footer Status */}
      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <Clock className="w-3 h-3" />
          {bstTime} BST
        </span>
        <span>FloodGuard AI • Flood-health preparedness</span>
      </div>
    </div>
  );
};
