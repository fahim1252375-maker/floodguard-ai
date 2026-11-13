import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Users,
  Shield,
  Download,
  Printer,
  Sparkles,
  AlertCircle,
  HelpCircle,
  HeartPulse,
  Pill,
  RotateCcw,
} from 'lucide-react';
import { Language, LocationData } from '../types';
import { INITIAL_LOCATIONS } from '../data/mockData';
import { safeGetItem, safeSetItem, STORAGE_KEYS } from '../utils/storage';
import { PrepositionPlannerCard } from '../components/PrepositionPlannerCard';

export const HEALTH_KIT_ITEMS = [
  {
    id: 'ors_sachets',
    nameEn: 'Oral Rehydration Salts (ORS) Sachets (Min. 10 packets)',
    nameBn: 'খাবার স্যালাইন (ওআরএস) - ন্যূনতম ১০ প্যাকেট',
    descEn: 'Prevents dehydration during sudden acute diarrhoeal outbreaks.',
    descBn: 'ডায়রিয়া ও কলেরার প্রাথমিক চিকিৎসায় পানিশূন্যতা রোধ করে।',
    essential: true,
  },
  {
    id: 'water_tablets',
    nameEn: 'Water Purification Tablets (Halazone / Chlorine - 50 pcs)',
    nameBn: 'পানি বিশুদ্ধকরণ ট্যাবলেট (হ্যালোজেন/ক্লোরিন - ৫০টি)',
    descEn: 'Disinfects flood water when boiling gas/firewood is submerged.',
    descBn: 'চুলা প্লাবিত থাকলে প্রতি ১০ লিটারে ১টি ট্যাবলেট দিয়ে ৩০ মিনিট রাখুন।',
    essential: true,
  },
  {
    id: 'antiseptic',
    nameEn: 'Antiseptic Solution / Ointment (Povidone-Iodine / Savlon)',
    nameBn: 'অ্যান্টিসেপটিক মলম বা দ্রবণ (পোভিডন-আয়োডিন/স্যাভলন)',
    descEn: 'Treats dirty water cuts, puncture wounds and avoids cellulitis.',
    descBn: 'কাদার জীবাণু ও ধারালো আঘাত থেকে সেপটিক ইনফেকশন প্রতিরোধে।',
    essential: true,
  },
  {
    id: 'sterile_gauze',
    nameEn: 'Sterile Gauze Bandages, Cotton & Micropore Tape',
    nameBn: 'জীবাণুমুক্ত গজ ব্যান্ডেজ, তুলা ও লিউকোপ্লাস্ট',
    descEn: 'Dresses cuts sustained while wading through submerged debris.',
    descBn: 'প্লাবিত ধ্বংসাবশেষে কেটে গেলে তাৎক্ষণিক ড্রেসিং ও রক্তপাত বন্ধে।',
    essential: true,
  },
  {
    id: 'paracetamol_zinc',
    nameEn: 'Paracetamol & Zinc Dispersible Tablets',
    nameBn: 'প্যারাসিটামল ও জিংক ডিসপারসিবল ট্যাবলেট',
    descEn: 'Manages fever and reduces diarrhoea severity in children.',
    descBn: 'শিশুদের ডায়রিয়ায় জিংক এবং জ্বর ও ব্যথায় প্যারাসিটামল।',
    essential: true,
  },
  {
    id: 'snakebite_splint',
    nameEn: 'Crepe Compression Bandage & Splint for Snakebites',
    nameBn: 'সাপের কামড়ের জন্য ক্রেপ কম্প্রেশন ব্যান্ডেজ ও কাঠের স্প্লিন্ট',
    descEn: 'Immobilizes bitten limb without tight arterial tourniquet.',
    descBn: 'আক্রান্ত পা বা হাত অনড় রাখতে। কখনো রক্ত চলাচল বন্ধ করা বাঁধন দেবেন না।',
    essential: true,
  },
  {
    id: 'chronic_meds_case',
    nameEn: 'Waterproof Case with 14-Day Chronic Prescriptions',
    nameBn: 'ওয়াটারপ্রুফ ব্যাগে ১৪ দিনের দীর্ঘমেয়াদী ওষুধ ও প্রেসক্রিপশন',
    descEn: 'Insulin, blood pressure, or asthma inhalers in double-sealed bags.',
    descBn: 'ইনসুলিন, প্রেশার বা হাঁপানির ইনহেলার সিল করা প্লাস্টিক বক্সে রাখুন।',
    essential: true,
  },
  {
    id: 'soap_sanitizer',
    nameEn: 'Carbolic Soap & Alcohol-Based Hand Sanitizer',
    nameBn: 'কার্বলিক সাবান ও অ্যালকোহলযুক্ত হ্যান্ড স্যানিটাইজার',
    descEn: 'Prevents oral-fecal contamination before feeding or food prep.',
    descBn: 'খাবার তৈরি বা শিশুকে খাওয়ানোর আগে হাত জীবাণুমুক্ত করতে।',
    essential: false,
  },
  {
    id: 'torch_cells',
    nameEn: 'Waterproof LED Torchlight with Spare Dry Cells',
    nameBn: 'ওয়াটারপ্রুফ এলইডি টর্চলাইট ও অতিরিক্ত ব্যাটারি',
    descEn: 'Navigates nocturnal water surges and identifies reptiles/snakes.',
    descBn: 'রাতের আঁধারে পাহাড়ি ঢল ও বিষধর সাপ থেকে সুরক্ষায় অপরিহার্য।',
    essential: false,
  },
];

interface ResiliencePlannerViewProps {
  language: Language;
  locations?: LocationData[];
}

export const ResiliencePlannerView: React.FC<ResiliencePlannerViewProps> = ({
  language,
  locations = INITIAL_LOCATIONS,
}) => {
  const isBn = language === 'bn';

  // Household parameters
  const [familyMembers, setFamilyMembers] = useState<number>(4);
  const [hasElderlyOrInfants, setHasElderlyOrInfants] = useState<boolean>(true);
  const [hasLivestock, setHasLivestock] = useState<boolean>(false);
  const [hasChronicIllness, setHasChronicIllness] = useState<boolean>(false);

  // Health-Kit Checklist state persisted in localStorage
  const [checkedHealthKit, setCheckedHealthKit] = useState<Record<string, boolean>>(() => {
    return safeGetItem<Record<string, boolean>>(STORAGE_KEYS.HEALTH_KIT, {
      ors_sachets: true,
      water_tablets: true,
    });
  });

  const toggleHealthKitItem = (id: string) => {
    setCheckedHealthKit((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      safeSetItem(STORAGE_KEYS.HEALTH_KIT, updated);
      return updated;
    });
  };

  const handleResetHealthKit = () => {
    const initial = { ors_sachets: false, water_tablets: false };
    setCheckedHealthKit(initial);
    safeSetItem(STORAGE_KEYS.HEALTH_KIT, initial);
  };

  // Dynamic completed tasks state
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({
    'water-purify': true,
    'important-docs': true,
  });

  const toggleTask = (id: string) => {
    setCheckedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const tasks = [
    {
      id: 'water-purify',
      category: 'Water & Sanitation',
      titleEn: `Store ${familyMembers * 3 * 3}L Drinking Water & Halazone/Water Purification Tablets`,
      titleBn: `${familyMembers * 3 * 3} লিটার নিরাপদ খাবার পানি এবং পানি বিশুদ্ধকরণ ট্যাবলেট সংরক্ষণ`,
      descEn: '3 liters per person per day for at least 72 hours minimum emergency duration.',
      descBn: 'ন্যূনতম ৭২ ঘণ্টার জন্য ব্যক্তিপ্রতি দৈনিক ৩ লিটার পানি নিশ্চিত করুন।',
      priority: 'CRITICAL',
    },
    {
      id: 'dry-food',
      category: 'Food Supplies',
      titleEn: '72-Hour High-Energy Non-Perishable Rations (Chira, Gur, Biscuits)',
      titleBn: '৭২ ঘণ্টার শুকনো খাবার (চিঁড়া, গুড়, বিস্কুট, মুড়ি) এয়ারটাইট পাত্রে সংরক্ষণ',
      descEn: 'Store above predicted flood level in watertight polythene containers.',
      descBn: 'প্লাবিত হওয়ার সম্ভাব্য উচ্চতার উপরে পলিথিনে শক্তভাবে বেঁধে রাখুন।',
      priority: 'HIGH',
    },
    {
      id: 'important-docs',
      category: 'Identity & Land Records',
      titleEn: 'Waterproof National ID, Land Deeds, Educational Certificates',
      titleBn: 'জাতীয় পরিচয়পত্র, জমির দলিল ও জরুরি কাগজপত্র ওয়াটারপ্রুফ ফাইলে সংরক্ষণ',
      descEn: 'Keep inside sealed ziplock bags; save digital photo copies on offline mobile memory.',
      descBn: 'জিপলক ব্যাগে সংরক্ষণ করুন এবং মোবাইলে অফলাইন ছবি তুলে রাখুন।',
      priority: 'HIGH',
    },
    {
      id: 'power-comm',
      category: 'Power & Communications',
      titleEn: 'Fully Charge Mobile Phones, Power Banks & Keep Battery Radio',
      titleBn: 'মোবাইল ফোন ও পাওয়ার ব্যাংক পূর্ণ চার্জ রাখুন এবং ব্যাটারিচালিত রেডিও প্রস্তুত রাখুন',
      descEn: 'Grid power in Sylhet/Sunamganj is intentionally cut when water levels exceed 12m.',
      descBn: 'বিদ্যুৎ উপকেন্দ্র প্লাবিত হলে জাতীয় গ্রিড বন্ধ করা হয়। রেডিওতে নিয়মিত ১০৯০ শুনুন।',
      priority: 'CRITICAL',
    },
    ...(hasElderlyOrInfants
      ? [
          {
            id: 'infant-elderly-care',
            category: 'Special Vulnerabilities',
            titleEn: 'Emergency ORS, Baby Formula, Warm Clothing & Adult Incontinence Supplies',
            titleBn: 'শিশু ও বয়স্কদের জন্য পর্যাপ্ত ওআরএস, শিশুখাদ্য, শুকনো কাপড় ও বিশেষ ওষুধ',
            descEn: 'Locate designated ground-floor wheelchair evacuation routes to nearest multi-storey shelter.',
            descBn: 'নিকটস্থ আশ্রয়কেন্দ্রে বয়স্ক ও শিশুদের অগ্রাধিকার ভিত্তিতে নিয়ে যাওয়ার রুট নিশ্চিত করুন।',
            priority: 'CRITICAL',
          },
        ]
      : []),
    ...(hasChronicIllness
      ? [
          {
            id: 'chronic-meds',
            category: 'Medical Reserves',
            titleEn: '14-Day Supply of Insulin / Blood Pressure / Asthma Medication',
            titleBn: '১৪ দিনের ইনসুলিন, রক্তচাপ ও অ্যাজমার জরুরি ওষুধ সংরক্ষণ',
            descEn: 'Pharmacies and upazila health complexes often face severe stockouts during peak crest.',
            descBn: 'বন্যার সময় স্থানীয় ফার্মেসির সরবরাহ বন্ধ হতে পারে, তাই অগ্রিম স্টক রাখুন।',
            priority: 'HIGH',
          },
        ]
      : []),
    ...(hasLivestock
      ? [
          {
            id: 'livestock-safety',
            category: 'Livestock & Agriculture',
            titleEn: 'Move Cattle & Poultry to Killa (Elevated Flood Mounds) or Highway Embankments',
            titleBn: 'গবাদিপশু ও হাঁস-মুরগি মুজিব কিল্লা বা উঁচু বাঁধে স্থানান্তর',
            descEn: 'Do not leave cattle tied inside sheds; secure dry hay and animal vaccination records.',
            descBn: 'খামারে গবাদিপশু বেঁধে রাখবেন না; শুকনো খড় সংরক্ষণ করুন।',
            priority: 'HIGH',
          },
        ]
      : []),
  ];

  const completedCount = tasks.filter((t) => checkedTasks[t.id]).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const healthKitDoneCount = HEALTH_KIT_ITEMS.filter((item) => checkedHealthKit[item.id]).length;
  const healthKitPercent = Math.round((healthKitDoneCount / HEALTH_KIT_ITEMS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950/20 to-slate-900 border border-teal-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5" />
                {language === 'en' ? 'Community & Household Preparedness' : 'পারিবারিক ও কমিউনিটি দুর্যোগ সহনশীলতা'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                Action Matrix
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'en' ? 'Resilience Planner: Household Readiness' : 'রেজিলিয়েন্স প্ল্যানার: পারিবারিক প্রস্তুতি নির্দেশিকা'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              {language === 'en'
                ? 'Generate customized, family-specific emergency action checklists based on household size, vulnerable dependents, and local shelter accessibility. Designed for offline field printing and digital tracking.'
                : 'পরিবারের সদস্য সংখ্যা, বয়স্ক বা শিশুদের উপস্থিতি এবং স্বাস্থ্য চাহিদার ওপর ভিত্তি করে স্বয়ংক্রিয় পারিবারিক প্রস্তুতি চেকলিস্ট তৈরি করুন।'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              {language === 'en' ? 'Print Checklist' : 'প্রিন্ট করুন'}
            </button>
          </div>
        </div>
      </div>

      {/* Household Customizer Parameters */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          {language === 'en' ? 'Household Profile Customizer' : 'পরিবারের প্রোফাইল সেটিংস'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <label className="block text-slate-400 mb-1 font-semibold">
              {language === 'en' ? 'Family Members:' : 'পরিবারের সদস্য সংখ্যা:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="25"
                value={familyMembers}
                onChange={(e) => setFamilyMembers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono text-center font-bold"
              />
              <span className="text-slate-400">Persons</span>
            </div>
          </div>

          <div
            onClick={() => setHasElderlyOrInfants(!hasElderlyOrInfants)}
            className={`cursor-pointer p-3 rounded-lg border transition ${
              hasElderlyOrInfants
                ? 'bg-cyan-950/30 border-cyan-500 text-cyan-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{language === 'en' ? 'Elderly or Infants' : 'বয়স্ক বা ছোট শিশু'}</span>
              <span className={`w-3 h-3 rounded-full ${hasElderlyOrInfants ? 'bg-cyan-400' : 'bg-slate-700'}`} />
            </div>
            <span className="text-[11px] block mt-1 text-slate-400">Requires specialized formula / mobility assistance</span>
          </div>

          <div
            onClick={() => setHasChronicIllness(!hasChronicIllness)}
            className={`cursor-pointer p-3 rounded-lg border transition ${
              hasChronicIllness
                ? 'bg-cyan-950/30 border-cyan-500 text-cyan-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{language === 'en' ? 'Chronic Medical Needs' : 'দীর্ঘমেয়াদী জরুরি ওষুধ'}</span>
              <span className={`w-3 h-3 rounded-full ${hasChronicIllness ? 'bg-cyan-400' : 'bg-slate-700'}`} />
            </div>
            <span className="text-[11px] block mt-1 text-slate-400">Insulin, blood pressure, or dialysis supplies</span>
          </div>

          <div
            onClick={() => setHasLivestock(!hasLivestock)}
            className={`cursor-pointer p-3 rounded-lg border transition ${
              hasLivestock
                ? 'bg-cyan-950/30 border-cyan-500 text-cyan-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{language === 'en' ? 'Cattle & Livestock' : 'গবাদিপশু ও খামার'}</span>
              <span className={`w-3 h-3 rounded-full ${hasLivestock ? 'bg-cyan-400' : 'bg-slate-700'}`} />
            </div>
            <span className="text-[11px] block mt-1 text-slate-400">Requires flood mound (killa) evacuation plan</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-200">
            {language === 'en' ? 'Household Readiness Completion' : 'পারিবারিক প্রস্তুতি সম্পন্নতা'}
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {completedCount} of {tasks.length} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* SECTION: Household Emergency Health-Kit Checklist */}
      <div className="p-5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <span>
                  {isBn
                    ? 'পারিবারিক জরুরি স্বাস্থ্য কিট চেকলিস্ট'
                    : 'Household Emergency Health-Kit Checklist'}
                </span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                HOUSEHOLD PREPAREDNESS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'প্লাবনে ডায়রিয়া, চর্মরোগ ও সাপের কামড় প্রতিরোধে প্রতিটি পরিবারে এই ৯টি জরুরি স্বাস্থ্য সামগ্রী প্রস্তুত রাখা প্রয়োজন।'
                : 'Essential 9-item family medical kit to prevent dehydration, wound cellulitis, and snakebite trauma before water cuts road access.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              {healthKitDoneCount} / {HEALTH_KIT_ITEMS.length} ({healthKitPercent}%)
            </span>
            <button
              type="button"
              onClick={handleResetHealthKit}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
              title={isBn ? 'চেকলিস্ট রিসেট করুন' : 'Reset checklist'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${healthKitPercent}%` }}
          />
        </div>

        {/* Health Kit Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {HEALTH_KIT_ITEMS.map((item) => {
            const isDone = !!checkedHealthKit[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleHealthKitItem(item.id)}
                className={`cursor-pointer p-3 rounded-xl border transition flex items-start gap-3 ${
                  isDone
                    ? 'bg-slate-950/80 border-emerald-500/40 text-slate-300'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold leading-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                      {isBn ? item.nameBn : item.nameEn}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {isBn ? item.descBn : item.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist Tasks */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isDone = !!checkedTasks[task.id];

          return (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`cursor-pointer p-4 rounded-xl border transition flex items-start gap-3 ${
                isDone
                  ? 'bg-slate-900/60 border-slate-800 opacity-80'
                  : 'bg-slate-900 border-slate-700 hover:border-cyan-500'
              }`}
            >
              <div className="mt-0.5 text-cyan-400">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {task.category}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                      task.priority === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <h3
                  className={`text-sm font-bold ${
                    isDone ? 'line-through text-slate-400' : 'text-slate-100'
                  }`}
                >
                  {language === 'en' ? task.titleEn : task.titleBn}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {language === 'en' ? task.descEn : task.descBn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preposition Planner Card (Phase 4 & 8) */}
      <PrepositionPlannerCard locations={locations} language={language} />
    </div>
  );
};
