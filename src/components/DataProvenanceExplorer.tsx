import React from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';
import { Language } from '../types';

interface ProvenanceRecord {
  id: string;
  metricEn: string;
  metricBn: string;
  provenance: 'LIVE' | 'DERIVED' | 'SIMULATED' | 'ASSUMPTION' | 'HISTORICAL';
  sourceName: string;
  refreshCycle: string;
  formulaOrMethodEn: string;
  formulaOrMethodBn: string;
  limitationsEn: string;
  limitationsBn: string;
}

export const DATA_PROVENANCE_REGISTRY: ProvenanceRecord[] = [
  {
    id: 'prov-meteo-rainfall',
    metricEn: 'Cherrapunji & Catchment Precipitation',
    metricBn: 'চেরাপুঞ্জি ও অববাহিকা বৃষ্টিপাত',
    provenance: 'LIVE',
    sourceName: 'Open-Meteo Weather API (ECMWF & GFS blend)',
    refreshCycle: 'Hourly / 10-minute cache',
    formulaOrMethodEn: 'Hourly precipitation accumulation in millimeters across Cherrapunji, Sylhet, and Sunamganj bounding coordinates.',
    formulaOrMethodBn: 'চেরাপুঞ্জি ও সুরমা অববাহিকার স্থানাঙ্কে ঘণ্টার ভিত্তিতে বৃষ্টিপাত পরিমাপ।',
    limitationsEn: 'Satellite-derived precipitation grids may underestimate extreme localized orographic downpours on steep Khasi ridges.',
    limitationsBn: 'উপগ্রহভিত্তিক উপাত্তে মেঘালয়ের খাড়া পাহাড়ে অতিভারী বৃষ্টিপাতের কিছু তারতম্য হতে পারে।',
  },
  {
    id: 'prov-river-stage',
    metricEn: 'River Stage & Delta vs Danger Mark',
    metricBn: 'নদীর পানির উচ্চতা ও বিপদসীমার সাথে তুলনা',
    provenance: 'DERIVED',
    sourceName: 'BWDB Hydrological Yearbooks (2022/2024 Calibrated Marks)',
    refreshCycle: 'Telemetry step simulation with live rainfall forcing',
    formulaOrMethodEn: 'Stage = Current level relative to official FFWC Danger Level (meters MSL). Rate = 24-hour differential change.',
    formulaOrMethodBn: 'পাউবো গেজের সরকারি বিপদসীমার সাথে তুলনা এবং বিগত ২৪ ঘণ্টার পানি বৃদ্ধির হার।',
    limitationsEn: 'Station elevations reflect surveyed bench marks; local siltation and riverbed scour can cause minor deviations.',
    limitationsBn: 'নদী ভরাট বা তলদেশ ক্ষয়ের কারণে বাস্তব পানি প্রবাহে কিছুটা পার্থক্য দেখা দিতে পারে।',
  },
  {
    id: 'prov-disease-risk',
    metricEn: 'Waterborne Disease Risk Index (Cholera/Typhoid)',
    metricBn: 'পানিবাহিত রোগ ঝুঁকি সূচক (কলেরা ও টাইফয়েড)',
    provenance: 'DERIVED',
    sourceName: 'Heuristic index (hand-set weights; not clinically validated)',
    refreshCycle: 'Calculated dynamically per location update',
    formulaOrMethodEn: 'Diarrhoea/Cholera Score = (Flood Risk * 0.45) + (Standing Water Days * 5.5) + (Shelter Crowding * 25) + Breached Danger Bonus (15).',
    formulaOrMethodBn: 'প্লাবন তীব্রতা, আবদ্ধ পানির দিন এবং আশ্রয়কেন্দ্রের ভিড়ের ওপর ভিত্তি করে রোগ ঝুঁকি নির্ণয়।',
    limitationsEn: 'Heuristic risk indicator only; does not replace laboratory stool culture or clinical surveillance.',
    limitationsBn: 'এটি একটি সম্ভাব্য ঝুঁকি সূচক, কোনো আনুষ্ঠানিক ক্লিনিক্যাল বা প্যাথলজিক্যাল রিপোর্ট নয়।',
  },
  {
    id: 'prov-ors-logistics',
    metricEn: 'Prepositioning ORS & Logistics Shortfall',
    metricBn: 'স্যালাইন বরাদ্দ ও লজিস্টিক ঘাটতি নিরূপণ',
    provenance: 'ASSUMPTION',
    sourceName: 'Sphere Humanitarian Minimum Standards & Disaster Models',
    refreshCycle: 'Configurable user assumption slider',
    formulaOrMethodEn: 'Need = Displaced Population * Configurable sachets/person/day (Default 2). Shortfall = Max(0, Need - Shelter Stock).',
    formulaOrMethodBn: 'স্থানচ্যুত জনসংখ্যা × মাথাপিছু দৈনিক স্যালাইনের সংখ্যা (ডিফল্ট ২টি)। ঘাটতি = প্রয়োজন - বর্তমান স্টক।',
    limitationsEn: 'Household access to clean water bottles affects real field saline consumption.',
    limitationsBn: 'পরিবারে বিশুদ্ধ পানির বোতলের প্রাপ্যতার ওপর প্রকৃত স্যালাইন ব্যবহার নির্ভর করে।',
  },
  {
    id: 'prov-shelter-stock',
    metricEn: 'Shelter Medical Inventory Board',
    metricBn: 'আশ্রয়কেন্দ্রের চিকিৎসা সামগ্রী মজুদ তালিকা',
    provenance: 'SIMULATED',
    sourceName: 'Calibrated Prototype Shelter Records (Sample Haor Facilities)',
    refreshCycle: 'Static sample scenario data',
    formulaOrMethodEn: 'Pre-seeded realistic inventories for 12 primary flood shelters across Sylhet and Sunamganj.',
    formulaOrMethodBn: 'সিলেট ও সুনামগঞ্জের ১২টি আশ্রয়কেন্দ্রের বাস্তবসম্মত নমুনা ডেটাসেট।',
    limitationsEn: 'Simulated baseline for hackathon demonstration. Real emergency stocks require official DGHS physical audits.',
    limitationsBn: 'ডিএসএইচ হ্যাকস প্রদর্শনী ডেটা। সরকারি ত্রাণ বণ্টনের জন্য স্বাস্থ্য অধিদপ্তরের নিরীক্ষা প্রয়োজন।',
  },
];

interface DataProvenanceExplorerProps {
  language: Language;
}

export const DataProvenanceExplorer: React.FC<DataProvenanceExplorerProps> = ({ language }) => {
  const isBn = language === 'bn';

  const getBadgeStyle = (prov: string) => {
    switch (prov) {
      case 'LIVE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
      case 'DERIVED':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/40';
      case 'SIMULATED':
        return 'bg-purple-950 text-purple-300 border-purple-500/40';
      case 'ASSUMPTION':
        return 'bg-amber-950 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isBn ? 'উপাত্ত প্রমাণক ও সত্যতা অন্বেষণকারী' : 'Data Lineage & Provenance Explorer'}
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
              HONEST ARCHITECTURE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isBn
              ? 'প্ল্যাটফর্মের প্রতিটি মেট্রিকের মূল উৎস, গাণিতিক মডেল, আপডেট চক্র ও সীমাবদ্ধতার পূর্ণাঙ্গ স্বচ্ছতা।'
              : 'Complete transparent lineage for every metric: original source, calculation method, and scientific limitations.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            LIVE
          </span>
          <span className="px-2 py-0.5 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            DERIVED
          </span>
          <span className="px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
            ASSUMPTION
          </span>
          <span className="px-2 py-0.5 rounded font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
            SIMULATED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {DATA_PROVENANCE_REGISTRY.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold text-slate-100 text-xs">
                {isBn ? rec.metricBn : rec.metricEn}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getBadgeStyle(rec.provenance)}`}>
                {rec.provenance}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-baseline gap-1.5 text-slate-300">
                <span className="text-slate-400 shrink-0">{isBn ? 'উৎস:' : 'Source:'}</span>
                <span className="font-medium text-cyan-300 truncate">{rec.sourceName}</span>
              </div>
              <div className="flex items-baseline gap-1.5 text-slate-400">
                <span className="shrink-0">{isBn ? 'আপডেট:' : 'Cycle:'}</span>
                <span className="font-mono text-slate-300">{rec.refreshCycle}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-[10px] text-slate-300 space-y-1 font-mono">
              <span className="text-slate-400 block font-sans font-semibold">
                {isBn ? 'গাণিতিক পদ্ধতি / মেথডলজি:' : 'Calculation Method:'}
              </span>
              <p className="leading-relaxed">{isBn ? rec.formulaOrMethodBn : rec.formulaOrMethodEn}</p>
            </div>

            <div className="text-[10px] text-amber-300/80 leading-snug flex items-start gap-1.5 pt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
              <span>{isBn ? rec.limitationsBn : rec.limitationsEn}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
