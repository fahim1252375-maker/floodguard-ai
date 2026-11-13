import React, { useState, useRef } from 'react';
import { Stethoscope, Home, Users, HeartHandshake, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/translations';

interface PersonaTabsProps {
  language: Language;
  onNavigate: (view: string) => void;
}

export const PersonaTabs: React.FC<PersonaTabsProps> = ({ language, onNavigate }) => {
  const tr = t[language];
  const [activeTab, setActiveTab] = useState<number>(0);
  const tabListRef = useRef<HTMLDivElement>(null);

  const personas = [
    {
      id: 'officer',
      label: tr.personaHealthOfficer,
      icon: Stethoscope,
      accent: 'text-rose-400 border-rose-500/40 bg-rose-950/20',
      bullets: tr.personaHealthOfficerBullets,
      ctaLabel: language === 'en' ? 'Open Flood Health Watch' : 'স্বাস্থ্য নজরদারি মডিউল দেখুন',
      targetView: 'healthWatch',
    },
    {
      id: 'shelter',
      label: tr.personaShelterManager,
      icon: Home,
      accent: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
      bullets: tr.personaShelterManagerBullets,
      ctaLabel: language === 'en' ? 'Open Shelter Medical Readiness' : 'আশ্রয়কেন্দ্র প্রস্তুতি বোর্ড দেখুন',
      targetView: 'routeSafe',
    },
    {
      id: 'worker',
      label: tr.personaCommunityWorker,
      icon: Users,
      accent: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
      bullets: tr.personaCommunityWorkerBullets,
      ctaLabel: language === 'en' ? 'Open Community Ground-Truth' : 'মাঠপর্যায়ের প্রতিবেদন পোর্টাল',
      targetView: 'community',
    },
    {
      id: 'family',
      label: tr.personaFamily,
      icon: HeartHandshake,
      accent: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20',
      bullets: tr.personaFamilyBullets,
      ctaLabel: language === 'en' ? 'Open Family Health-Kit Planner' : 'পারিবারিক স্বাস্থ্য-কিট প্ল্যানার',
      targetView: 'resiliencePlanner',
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % personas.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + personas.length) % personas.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = personas.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    setActiveTab(nextIndex);
    const buttons = tabListRef.current?.querySelectorAll('button');
    if (buttons && buttons[nextIndex]) {
      (buttons[nextIndex] as HTMLButtonElement).focus();
    }
  };

  const currentPersona = personas[activeTab];
  const Icon = currentPersona.icon;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
          {tr.whoItHelpsTitle}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{tr.whoItHelpsSubtitle}</p>
      </div>

      {/* Tabs Header */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Persona view tabs"
        className="flex overflow-x-auto gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 scrollbar-none"
      >
        {personas.map((persona, idx) => {
          const PIcon = persona.icon;
          const isActive = activeTab === idx;
          return (
            <button
              key={persona.id}
              role="tab"
              id={`tab-${persona.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${persona.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <PIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{persona.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div
        role="tabpanel"
        id={`panel-${currentPersona.id}`}
        aria-labelledby={`tab-${currentPersona.id}`}
        className="p-5 sm:p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${currentPersona.accent}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">{currentPersona.label}</h3>
            <span className="text-xs text-slate-400">{tr.whoItHelpsSubtitle}</span>
          </div>
        </div>

        {/* 3 Bullets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {currentPersona.bullets.map((bullet, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{bullet}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => onNavigate(currentPersona.targetView)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-950 text-cyan-300 border border-cyan-500/40 hover:bg-slate-800 transition flex items-center gap-2 min-h-[44px]"
          >
            <span>{currentPersona.ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
