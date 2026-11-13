import React from 'react';
import {
  BrainCircuit,
  Sliders,
  Network,
  History,
  HeartPulse,
  BellRing,
  Navigation,
  Bot,
  Users,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/translations';

interface FeatureBentoProps {
  language: Language;
  onNavigate: (view: string) => void;
}

export const FeatureBento: React.FC<FeatureBentoProps> = ({ language, onNavigate }) => {
  const tr = t[language];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
          {tr.platformArchitecture}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {language === 'en'
            ? 'Unified tripartite framework spanning predictive hydrology, clinical defense, and local response.'
            : 'পূর্বাভাস, স্বাস্থ্যরক্ষা ও স্থানীয় ব্যবস্থাপনার সমন্বিত কাঠামো।'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Large Featured Tile: Flood Health Watch (spans 6 cols on large) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-950 border border-rose-500/40 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded border border-rose-500/30">
                CORE INNOVATION · FLOOD-HEALTH PREPAREDNESS
              </span>
              <HeartPulse className="w-5 h-5 text-rose-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {tr.navHealthWatch}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {tr.healthRiskSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-rose-300 block">4 Disease Vectors</span>
                <span className="text-[11px] text-slate-400">Cholera, Typhoid, Dermatitis, Snakebite</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-rose-300 block">Medical Readiness</span>
                <span className="text-[11px] text-slate-400">ORS, clean water, clinic passability</span>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {language === 'en' ? 'Includes 48h projection & A4 brief' : '৪৮ ঘণ্টার রোগ প্রজেকশন ও ব্রিফ'}
            </span>
            <button
              onClick={() => onNavigate('healthWatch')}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-500 text-slate-950 hover:bg-rose-400 transition flex items-center gap-1.5 min-h-[40px]"
            >
              <span>{language === 'en' ? 'Open Health Watch' : 'মডিউল চালু করুন'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 6 Columns: Predict & Protect Clusters */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Predict 1: 48h Prediction */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">{tr.predictCluster}</span>
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{tr.navPrediction}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'en'
                  ? 'OLS linear regression velocity & Gemini structured diagnostic reasoning.'
                  : 'রিগ্রেশন পরিসংখ্যান ও জেমিনাই এআই মডেলের নদী পূর্বাভাস।'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('prediction')}
              className="mt-3 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start min-h-[32px]"
            >
              <span>{language === 'en' ? 'Explore' : 'দেখুন'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Predict 2: BasinTwin */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">{tr.predictCluster}</span>
                <Network className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{tr.navBasinTwin}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'en'
                  ? 'Directed graph showing connected river pathways and illustrative basin travel-time assumptions.'
                  : 'মেঘালয় থেকে সংযুক্ত নদীপথের চিত্র ও অনুমানভিত্তিক প্রবাহ-সময়।'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('basinTwin')}
              className="mt-3 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start min-h-[32px]"
            >
              <span>{language === 'en' ? 'Explore' : 'দেখুন'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Protect 1: Early Warning */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">{tr.protectCluster}</span>
                <BellRing className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{tr.navAlerts}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'en'
                  ? 'Multi-severity hydrological bulletins with verified official source provenance.'
                  : 'যাচাইকৃত জরুরি সতর্কবার্তা ও উপজেলাভিত্তিক বুলেটিন।'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="mt-3 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start min-h-[32px]"
            >
              <span>{language === 'en' ? 'Explore' : 'দেখুন'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Protect 2: RouteSafe */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">{tr.protectCluster}</span>
                <Navigation className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{tr.navRouteSafe}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'en'
                  ? 'Safe dry corridors to registered shelters and clinic access passability status.'
                  : 'নিবন্ধিত আশ্রয়কেন্দ্রে যাওয়ার শুষ্ক রুট ও ক্লিনিক সংযোগ।'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('routeSafe')}
              className="mt-3 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start min-h-[32px]"
            >
              <span>{language === 'en' ? 'Explore' : 'দেখুন'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Cluster: Respond (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assistant */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">{tr.respondCluster}</span>
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{tr.navAssistant}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'en'
                ? 'Gemini Flash bilingual copilot for water purification, first-aid, and family safety.'
                : 'পানি বিশুদ্ধকরণ ও প্রাথমিক চিকিৎসার জন্য জেমিনাই সহকারী।'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('assistant')}
            className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start min-h-[32px]"
          >
            <span>{language === 'en' ? 'Open Assistant' : 'সহকারী চালু করুন'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Community Reports */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">{tr.respondCluster}</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{tr.navCommunity}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'en'
                ? 'Consent-based field reports with server-side moderation and privacy safeguards.'
                : 'মাঠপর্যায়ের তথ্য জমা ও প্রশাসন কর্তৃক যাচাইকরণ।'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('community')}
            className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start min-h-[32px]"
          >
            <span>{language === 'en' ? 'View Field Reports' : 'প্রতিবেদন দেখুন'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Resilience Planner */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">{tr.respondCluster}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{tr.navResiliencePlanner}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'en'
                ? 'Emergency household health-kit checklist with offline localStorage progress saving.'
                : 'অফলাইন সেভিংসহ পারিবারিক স্বাস্থ্য-কিট চেকলিস্ট।'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('resiliencePlanner')}
            className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start min-h-[32px]"
          >
            <span>{language === 'en' ? 'Open Health-Kit Planner' : 'চেকলিস্ট খুলুন'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>
  );
};
