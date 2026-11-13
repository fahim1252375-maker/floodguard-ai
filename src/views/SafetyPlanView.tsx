import React, { useMemo, useState, useEffect } from 'react';
import { ShieldCheck, Phone, Share2, Printer, RotateCcw, MapPin, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Language, LocationData, RiskLevel } from '../types';
import { safeGetItem, safeSetItem } from '../utils/storage';

interface Props {
  locations: LocationData[];
  language: Language;
  myUpazilaId: string | null;
  onNavigate: (view: string, targetId?: string) => void;
}

type Need = 'elderly' | 'infant' | 'pregnant' | 'disability' | 'medication' | 'pets';
interface Contact { name: string; phone: string }
interface Plan {
  areaId: string | null;
  needs: Need[];
  checked: string[];
  meetingPoint: string;
  contacts: Contact[];
}

const KEY = 'floodguard_safety_plan_v1';
const EMPTY: Plan = { areaId: null, needs: [], checked: [], meetingPoint: '', contacts: [{ name: '', phone: '' }] };

interface Item { id: string; en: string; bn: string; need?: Need }

const BASE_BAG: Item[] = [
  { id: 'water', en: 'Drinking water (3 L per person/day) & water-purification tablets', bn: 'পানীয় জল (জনপ্রতি দিনে ৩ লিটার) ও পানি বিশুদ্ধকরণ ট্যাবলেট' },
  { id: 'food', en: 'Dry food: chira, muri, biscuits, dates (3 days)', bn: 'শুকনো খাবার: চিড়া, মুড়ি, বিস্কুট, খেজুর (৩ দিনের)' },
  { id: 'ors', en: 'ORS sachets & basic first-aid kit', bn: 'খাবার স্যালাইন ও প্রাথমিক চিকিৎসার বাক্স' },
  { id: 'docs', en: 'NID/birth certificates & land papers in a waterproof bag', bn: 'এনআইডি/জন্মনিবন্ধন ও জমির কাগজ ওয়াটারপ্রুফ ব্যাগে' },
  { id: 'phone', en: 'Charged phone, power bank, torch & spare batteries', bn: 'চার্জ দেওয়া ফোন, পাওয়ার ব্যাংক, টর্চ ও ব্যাটারি' },
  { id: 'cash', en: 'Some cash in small notes', bn: 'অল্প খুচরা নগদ টাকা' },
  { id: 'clothes', en: 'Spare clothes, blanket & plastic sheet', bn: 'বাড়তি কাপড়, কম্বল ও পলিথিন শিট' },
  { id: 'whistle', en: 'Whistle & a rope for rescue signalling', bn: 'বাঁশি ও দড়ি (উদ্ধারের সংকেতের জন্য)' },
];

const NEED_ITEMS: Record<Need, Item[]> = {
  elderly: [{ id: 'eld-med', en: 'Elderly: glasses, walking stick, daily medicines', bn: 'বয়স্ক: চশমা, লাঠি, নিয়মিত ওষুধ', need: 'elderly' }],
  infant: [
    { id: 'inf-food', en: 'Infant: formula/clean water, diapers, baby clothes', bn: 'শিশু: ফর্মুলা/বিশুদ্ধ পানি, ন্যাপি, জামা', need: 'infant' },
  ],
  pregnant: [{ id: 'preg', en: 'Pregnancy: health card, hospital contact, iron/folic tablets', bn: 'গর্ভবতী: স্বাস্থ্যকার্ড, হাসপাতালের নম্বর, আয়রন/ফলিক ট্যাবলেট', need: 'pregnant' }],
  disability: [{ id: 'dis', en: 'Mobility/assistive devices and a helper assigned', bn: 'সহায়ক উপকরণ ও সাহায্যকারী ঠিক করা', need: 'disability' }],
  medication: [{ id: 'meds', en: 'Chronic-condition medicines (7 days) in a sealed bag', bn: 'দীর্ঘমেয়াদি রোগের ওষুধ (৭ দিনের) সিল করা ব্যাগে', need: 'medication' }],
  pets: [{ id: 'pets', en: 'Livestock/pets: feed, rope, and a raised shelter spot', bn: 'গবাদিপশু/পোষা প্রাণী: খাবার, দড়ি ও উঁচু আশ্রয়', need: 'pets' }],
};

const NEED_LABEL: Record<Need, { en: string; bn: string }> = {
  elderly: { en: 'Elderly member', bn: 'বয়স্ক সদস্য' },
  infant: { en: 'Infant / child', bn: 'শিশু' },
  pregnant: { en: 'Pregnant woman', bn: 'গর্ভবতী নারী' },
  disability: { en: 'Person with disability', bn: 'প্রতিবন্ধী সদস্য' },
  medication: { en: 'Regular medication', bn: 'নিয়মিত ওষুধ' },
  pets: { en: 'Livestock / pets', bn: 'গবাদিপশু / পোষা প্রাণী' },
};

const ACTIONS: Record<RiskLevel, { en: string[]; bn: string[]; tone: string; labelEn: string; labelBn: string }> = {
  LOW: {
    tone: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200', labelEn: 'Low risk', labelBn: 'কম ঝুঁকি',
    en: ['Prepare your go-bag now while it is calm.', 'Save emergency numbers and agree on a meeting point.', 'Check FloodGuard once a day during monsoon.'],
    bn: ['এখনই শান্ত অবস্থায় জরুরি ব্যাগ গুছিয়ে রাখুন।', 'জরুরি নম্বর সংরক্ষণ করুন ও মিলনস্থল ঠিক করুন।', 'বর্ষায় দিনে একবার ফ্লাডগার্ড দেখুন।'],
  },
  MODERATE: {
    tone: 'border-amber-500/40 bg-amber-950/30 text-amber-200', labelEn: 'Moderate risk', labelBn: 'মাঝারি ঝুঁকি',
    en: ['Finish packing the go-bag today.', 'Move documents, medicines and phones to a high shelf.', 'Check water levels every few hours and follow local announcements.'],
    bn: ['আজই জরুরি ব্যাগ প্রস্তুত করুন।', 'কাগজপত্র, ওষুধ ও ফোন উঁচু তাকে রাখুন।', 'কয়েক ঘণ্টা পরপর পানির স্তর দেখুন ও স্থানীয় ঘোষণা শুনুন।'],
  },
  HIGH: {
    tone: 'border-orange-500/50 bg-orange-950/30 text-orange-200', labelEn: 'High risk', labelBn: 'উচ্চ ঝুঁকি',
    en: ['Be ready to leave at short notice; confirm your shelter route.', 'Move livestock and valuables to higher ground.', 'Switch off main electricity if water enters the house.', 'Call 1090 for official flood information.'],
    bn: ['যেকোনো সময় বের হওয়ার জন্য প্রস্তুত থাকুন; আশ্রয়কেন্দ্রের পথ নিশ্চিত করুন।', 'গবাদিপশু ও দামি জিনিস উঁচু জায়গায় নিন।', 'ঘরে পানি ঢুকলে মেইন বিদ্যুৎ বন্ধ করুন।', 'সরকারি তথ্যের জন্য ১০৯০ নম্বরে কল করুন।'],
  },
  CRITICAL: {
    tone: 'border-rose-500/60 bg-rose-950/40 text-rose-200', labelEn: 'Critical risk', labelBn: 'অতি-ঝুঁকিপূর্ণ',
    en: ['Evacuate to the nearest shelter now if authorities advise it.', 'Take the go-bag, children, elderly and medicines first.', 'Never walk or drive through moving flood water.', 'In danger call 999.'],
    bn: ['কর্তৃপক্ষ নির্দেশ দিলে এখনই নিকটতম আশ্রয়কেন্দ্রে যান।', 'ব্যাগ, শিশু, বয়স্ক ও ওষুধ আগে নিন।', 'স্রোতের পানিতে হেঁটে বা গাড়ি নিয়ে যাবেন না।', 'বিপদে ৯৯৯ নম্বরে কল করুন।'],
  },
};

export const SafetyPlanView: React.FC<Props> = ({ locations, language, myUpazilaId, onNavigate }) => {
  const bn = language === 'bn';
  const [plan, setPlan] = useState<Plan>(() => {
    const saved = safeGetItem<Plan>(KEY, EMPTY);
    return { ...EMPTY, ...saved, areaId: saved.areaId ?? myUpazilaId };
  });
  const [notice, setNotice] = useState('');

  useEffect(() => { safeSetItem(KEY, plan); }, [plan]);

  const area = useMemo(() => locations.find((l) => l.id === plan.areaId) ?? null, [locations, plan.areaId]);
  const risk: RiskLevel = area?.riskLevel ?? 'LOW';
  const guide = ACTIONS[risk];

  const items = useMemo(
    () => [...BASE_BAG, ...plan.needs.flatMap((n) => NEED_ITEMS[n])],
    [plan.needs]
  );
  const done = items.filter((i) => plan.checked.includes(i.id)).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const update = (patch: Partial<Plan>) => setPlan((p) => ({ ...p, ...patch }));
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const setContact = (i: number, patch: Partial<Contact>) =>
    update({ contacts: plan.contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });

  const planText = () => {
    const lines = [
      `FloodGuard AI — ${bn ? 'পারিবারিক সুরক্ষা পরিকল্পনা' : 'Family Safety Plan'}`,
      area ? `${bn ? 'এলাকা' : 'Area'}: ${bn ? area.nameBn : area.nameEn}` : '',
      `${bn ? 'মিলনস্থল' : 'Meeting point'}: ${plan.meetingPoint || '-'}`,
      `${bn ? 'যোগাযোগ' : 'Contacts'}:`,
      ...plan.contacts.filter((c) => c.name || c.phone).map((c) => `  - ${c.name} ${c.phone}`),
      `${bn ? 'ব্যাগ' : 'Go-bag'} (${done}/${items.length}):`,
      ...items.map((i) => `  [${plan.checked.includes(i.id) ? 'x' : ' '}] ${bn ? i.bn : i.en}`),
      `${bn ? 'জরুরি' : 'Emergency'}: 999 | 1090 | 109`,
    ];
    return lines.filter(Boolean).join('\n');
  };

  const share = async () => {
    const text = planText();
    try {
      if (navigator.share) await navigator.share({ title: 'FloodGuard Safety Plan', text });
      else { await navigator.clipboard.writeText(text); setNotice(bn ? 'পরিকল্পনা কপি হয়েছে।' : 'Plan copied to clipboard.'); }
    } catch {
      setNotice(bn ? 'শেয়ার করা যায়নি।' : 'Could not share.');
    }
    window.setTimeout(() => setNotice(''), 3000);
  };

  const reset = () => { if (window.confirm(bn ? 'সব তথ্য মুছে ফেলবেন?' : 'Clear your whole plan?')) setPlan({ ...EMPTY, areaId: myUpazilaId }); };

  const card = 'rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5';

  return (
    <div className="space-y-5 pb-10 print:text-black">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            {bn ? 'পারিবারিক সুরক্ষা পরিকল্পনা' : 'Family Safety Plan'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            {bn
              ? '৩টি ধাপে নিজের পরিবারের জন্য বন্যা-প্রস্তুতি সাজান। তথ্য শুধু আপনার ফোন/ব্রাউজারে সংরক্ষিত থাকে।'
              : 'Build your household flood plan in 3 steps. Everything stays in this browser only.'}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={share} className="px-3 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-bold flex items-center gap-1.5"><Share2 className="w-4 h-4" />{bn ? 'শেয়ার' : 'Share'}</button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm flex items-center gap-1.5"><Printer className="w-4 h-4" />{bn ? 'প্রিন্ট' : 'Print'}</button>
          <button onClick={reset} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm flex items-center gap-1.5" aria-label={bn ? 'রিসেট' : 'Reset'}><RotateCcw className="w-4 h-4" /></button>
        </div>
      </header>

      <div role="status" aria-live="polite" className="text-xs text-cyan-300 min-h-4">{notice}</div>

      {/* Step 1 */}
      <section className={card} aria-labelledby="sp-step1">
        <h2 id="sp-step1" className="font-bold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-400" />{bn ? 'ধাপ ১: আপনার এলাকা' : 'Step 1: Your area'}</h2>
        <select
          value={plan.areaId ?? ''}
          onChange={(e) => update({ areaId: e.target.value || null })}
          className="mt-3 w-full sm:w-80 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
          aria-label={bn ? 'এলাকা বেছে নিন' : 'Choose your area'}
        >
          <option value="">{bn ? '— এলাকা বেছে নিন —' : '— Select area —'}</option>
          {locations.map((l) => (<option key={l.id} value={l.id}>{bn ? l.nameBn : l.nameEn}</option>))}
        </select>
        <div className={`mt-4 rounded-xl border p-4 ${guide.tone}`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            {area ? `${bn ? area.nameBn : area.nameEn}: ` : ''}{bn ? guide.labelBn : guide.labelEn}
            {area?.isSimulated && <span className="text-[10px] font-mono opacity-70 ml-1">{bn ? '(সিমুলেটেড স্টেশন ডেটা)' : '(simulated station data)'}</span>}
          </div>
          <ul className="mt-2 text-sm space-y-1 list-disc pl-5">
            {(bn ? guide.bn : guide.en).map((a) => (<li key={a}>{a}</li>))}
          </ul>
          {area && (
            <button onClick={() => onNavigate('prediction', area.id)} className="mt-3 text-xs underline print:hidden">
              {bn ? 'বিস্তারিত পূর্বাভাস দেখুন' : 'See detailed forecast'}
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {bn ? 'এটি পরামর্শমূলক; সরকারি (FFWC/DDM) নির্দেশ সর্বদা অগ্রাধিকার পাবে।' : 'Advisory only — official FFWC/DDM instructions always take priority.'}
        </p>
      </section>

      {/* Step 2 */}
      <section className={card} aria-labelledby="sp-step2">
        <h2 id="sp-step2" className="font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" />{bn ? 'ধাপ ২: পরিবারের বিশেষ প্রয়োজন' : 'Step 2: Household needs'}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(NEED_LABEL) as Need[]).map((n) => {
            const on = plan.needs.includes(n);
            return (
              <button key={n} aria-pressed={on} onClick={() => update({ needs: toggle(plan.needs, n) as Need[] })}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${on ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                {bn ? NEED_LABEL[n].bn : NEED_LABEL[n].en}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-white">{bn ? 'জরুরি ব্যাগ চেকলিস্ট' : 'Go-bag checklist'}</span>
            <span className="text-cyan-300 font-mono">{done}/{items.length} · {pct}%</span>
          </div>
          <div className="h-2 mt-2 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <ul className="mt-3 space-y-1.5">
            {items.map((i) => {
              const on = plan.checked.includes(i.id);
              return (
                <li key={i.id}>
                  <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer min-h-11">
                    <input type="checkbox" checked={on} onChange={() => update({ checked: toggle(plan.checked, i.id) })} className="mt-1 w-5 h-5 accent-cyan-500" />
                    <span className={`text-sm ${on ? 'line-through text-slate-500' : 'text-slate-200'}`}>{bn ? i.bn : i.en}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {pct === 100 && (
            <p className="mt-2 text-sm text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{bn ? 'অভিনন্দন! আপনার ব্যাগ প্রস্তুত।' : 'Great — your go-bag is ready.'}</p>
          )}
        </div>
      </section>

      {/* Step 3 */}
      <section className={card} aria-labelledby="sp-step3">
        <h2 id="sp-step3" className="font-bold text-white flex items-center gap-2"><Phone className="w-4 h-4 text-cyan-400" />{bn ? 'ধাপ ৩: যোগাযোগ ও মিলনস্থল' : 'Step 3: Contacts & meeting point'}</h2>
        <label className="block mt-3 text-sm text-slate-300">
          {bn ? 'পরিবারের মিলনস্থল (বিচ্ছিন্ন হলে)' : 'Family meeting point (if separated)'}
          <input value={plan.meetingPoint} maxLength={120} onChange={(e) => update({ meetingPoint: e.target.value })}
            placeholder={bn ? 'যেমন: ইউনিয়ন পরিষদ আশ্রয়কেন্দ্র' : 'e.g. Union Parishad shelter'}
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
        </label>
        <div className="mt-3 space-y-2">
          {plan.contacts.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input value={c.name} maxLength={40} onChange={(e) => setContact(i, { name: e.target.value })} placeholder={bn ? 'নাম' : 'Name'} aria-label={bn ? 'নাম' : 'Name'} className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              <input value={c.phone} maxLength={20} inputMode="tel" onChange={(e) => setContact(i, { phone: e.target.value.replace(/[^\d+\- ]/g, '') })} placeholder={bn ? 'ফোন' : 'Phone'} aria-label={bn ? 'ফোন' : 'Phone'} className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              {c.phone && <a href={`tel:${c.phone}`} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm print:hidden" aria-label={bn ? 'কল করুন' : 'Call'}><Phone className="w-4 h-4" /></a>}
            </div>
          ))}
          {plan.contacts.length < 5 && (
            <button onClick={() => update({ contacts: [...plan.contacts, { name: '', phone: '' }] })} className="text-xs text-cyan-300 underline print:hidden">
              + {bn ? 'আরেকজন যোগ করুন' : 'Add another contact'}
            </button>
          )}
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-2">
          {[['999', bn ? 'জাতীয় জরুরি সেবা' : 'National emergency'], ['1090', bn ? 'বন্যা সতর্কবার্তা' : 'Flood warning IVR'], ['109', bn ? 'নারী ও শিশু হেল্পলাইন' : 'Women & child helpline']].map(([n, label]) => (
            <a key={n} href={`tel:${n}`} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-center hover:border-cyan-500 transition">
              <div className="text-xl font-black text-white">{n}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
