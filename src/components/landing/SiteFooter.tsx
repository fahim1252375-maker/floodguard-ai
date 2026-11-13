import React from 'react';
import { PhoneCall, HeartPulse, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/translations';

interface SiteFooterProps {
  language: Language;
  onNavigate: (view: string) => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ language, onNavigate }) => {
  const tr = t[language];

  return (
    <footer className="rounded-2xl bg-slate-950 border border-slate-800 p-6 sm:p-8 space-y-6 text-xs text-slate-400">
      {/* Top Row: Helplines & Theme Attribution */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start border-b border-slate-900 pb-6">
        {/* Brand & Theme */}
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-white tracking-wide">
              {tr.appName}
            </span>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 border border-rose-500/30 px-2 py-0.5 rounded font-semibold">
              AI x Healthcare
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            {tr.tagline}
          </p>
          <div className="text-[11px] text-slate-500 font-mono">
            {tr.hackathonNotice}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-0.5">
              HEALTH HELPLINE
            </span>
            <a
              href="tel:16263"
              className="text-base font-black font-mono text-white hover:text-rose-300 transition block"
            >
              16263
            </a>
            <span className="text-[10px] text-slate-400">DGHS Shastho Batayan</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-0.5">
              POLICE / RESCUE
            </span>
            <a
              href="tel:999"
              className="text-base font-black font-mono text-white hover:text-amber-300 transition block"
            >
              999
            </a>
            <span className="text-[10px] text-slate-400">National Emergency</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block mb-0.5">
              FLOOD IVR HOTLINE
            </span>
            <a
              href="tel:1090"
              className="text-base font-black font-mono text-white hover:text-cyan-300 transition block"
            >
              1090
            </a>
            <span className="text-[10px] text-slate-400">BWDB / FFWC Toll-Free</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Medical Disclaimer & AI Disclosure Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-2 text-amber-300/90 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{tr.healthDisclaimer}</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <button
            onClick={() => onNavigate('about')}
            className="hover:text-cyan-300 transition underline underline-offset-2 flex items-center gap-1"
          >
            <span>{language === 'en' ? 'AI-Use & Methodology Disclosure' : 'এআই ব্যবহার ও পদ্ধতি প্রকাশনা'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};
