import React from 'react';
import { Compass, ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';
import { Language } from '../types';

export interface DemoStep {
  view: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  tagEn: string;
  tagBn: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    view: 'dashboard',
    titleEn: '1. Live Situation Dashboard',
    titleBn: '১. রিয়েল-টাইম পরিস্থিতি ড্যাশবোর্ড',
    descEn: 'Monitors real-time transboundary rainfall from Cherrapunji, BWDB river stages, and instant health-impact indicators.',
    descBn: 'চেরাপুঞ্জির বৃষ্টিপাত, নদী বিপদসীমা ও জরুরি স্বাস্থ্যঝুঁকি সূচক একনজরে পর্যবেক্ষণ করুন।',
    tagEn: 'Telemetry & Weather',
    tagBn: 'টেলিমেট্রি ও আবহাওয়া',
  },
  {
    view: 'alerts',
    titleEn: '2. Early Warning Center',
    titleBn: '২. আগাম সতর্কতা কেন্দ্র',
    descEn: 'Multi-severity hydrological bulletins (Emergency, Warning, Watch) mapped directly to vulnerable upazilas.',
    descBn: 'বিপদাপন্ন উপজেলার জন্য সরকারি মানদণ্ডে যাচাইকৃত সুনির্দিষ্ট জরুরি সতর্কবার্তা।',
    tagEn: 'Official Bulletins',
    tagBn: 'জরুরি নোটিশ',
  },
  {
    view: 'prediction',
    titleEn: '3. 48-Hour AI Hydrological Forecast',
    titleBn: '৩. ৪৮ ঘণ্টার এআই নদী পূর্বাভাস',
    descEn: 'Combines linear regression velocity trends with Gemini Flash structured diagnostics to project water levels.',
    descBn: 'রিগ্রেশন পরিসংখ্যান ও জেমিনাই এআই মডেলের সমন্বয়ে আগামী ৪৮ ঘণ্টার পানি বৃদ্ধির পূর্বাভাস।',
    tagEn: 'Predictive Engine',
    tagBn: 'পূর্বাভাস ইঞ্জিন',
  },
  {
    view: 'healthWatch',
    titleEn: '4. Flood Health Watch (AI x Healthcare)',
    titleBn: '৪. ফ্লাড হেলথ ওয়াচ (এআই ও স্বাস্থ্যসুরক্ষা)',
    descEn: 'Shows hand-weighted preparedness indicators for waterborne disease and snakebite, illustrative shelter stock gaps, and fixed safety guidance. These are not clinical predictions.',
    descBn: 'পানিবাহিত রোগ (কলেরা, টাইফয়েড, চর্মরোগ, সাপের কামড়) ঝুঁকি নিরূপণ ও আশ্রয়কেন্দ্রের মেডিকেল প্রস্তুতি পর্যবেক্ষণ।',
    tagEn: 'Core Feature',
    tagBn: 'স্বাস্থ্য সুরক্ষা',
  },
  {
    view: 'routeSafe',
    titleEn: '5. RouteSafe Evacuation & Clinic Access',
    titleBn: '৫. রুটসেফ নিরাপদ স্থানান্তর ও ক্লিনিক রুট',
    descEn: 'Identifies flooded road choke-points, calculates safe dry corridors to registered shelters, and verifies clinic passability.',
    descBn: 'প্লাবিত সড়ক চিহ্নিত করে নিরাপদ আশ্রয়কেন্দ্র ও স্বাস্থ্যকেন্দ্রে যাওয়ার শুষ্ক রুট নির্ধারণ করে।',
    tagEn: 'Safe Corridors',
    tagBn: 'নিরাপদ রুট',
  },
];

interface GuidedDemoOverlayProps {
  currentStepIndex: number;
  language: Language;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
}

export const GuidedDemoOverlay: React.FC<GuidedDemoOverlayProps> = ({
  currentStepIndex,
  language,
  onNext,
  onPrev,
  onExit,
}) => {
  const step = DEMO_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === DEMO_STEPS.length - 1;

  if (!step) return null;

  return (
    <div
      role="region"
      aria-label="Guided Demo Tour"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 no-print animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-cyan-950/60 ring-1 ring-cyan-500/20 text-slate-100">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              {language === 'en' ? 'Guided Judge Tour' : 'গাইডেড ডেমো ট্যুর'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {currentStepIndex + 1} / {DEMO_STEPS.length}
            </span>
          </div>

          <button
            onClick={onExit}
            aria-label="Exit Guided Tour"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white">
              {language === 'en' ? step.titleEn : step.titleBn}
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
              {language === 'en' ? step.tagEn : step.tagBn}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'en' ? step.descEn : step.descBn}
          </p>
        </div>

        {/* Progress Dots & Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {DEMO_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'w-6 bg-cyan-400'
                    : idx < currentStepIndex
                    ? 'w-2 bg-cyan-700'
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              {language === 'en' ? 'Skip' : 'বাদ দিন'}
            </button>

            <button
              onClick={onPrev}
              disabled={isFirst}
              aria-label="Previous Demo Step"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                isFirst
                  ? 'text-slate-600 bg-slate-800/40 cursor-not-allowed'
                  : 'text-slate-200 bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <ArrowLeft className="w-3 h-3" />
              <span>{language === 'en' ? 'Back' : 'পেছনে'}</span>
            </button>

            <button
              onClick={onNext}
              aria-label="Next Demo Step"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition flex items-center gap-1 shadow-sm shadow-cyan-500/20"
            >
              <span>
                {isLast
                  ? language === 'en'
                    ? 'Finish Tour'
                    : 'সম্পন্ন'
                  : language === 'en'
                  ? 'Next'
                  : 'পরবর্তী'}
              </span>
              {!isLast && <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
