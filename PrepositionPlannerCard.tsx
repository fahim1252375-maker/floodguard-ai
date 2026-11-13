import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Droplets,
  ShieldAlert,
  Info,
  Truck,
  Printer,
} from 'lucide-react';
import { LocationData, Language } from '../types';
import {
  calculatePrepositionPlan,
  PrepositionAssumptions,
  DEFAULT_PREPOSITION_ASSUMPTIONS,
  PrepositionPlanItem,
} from '../utils/prepositionPlanner';
import { SAMPLE_SHELTER_MEDICAL_BOARD } from '../utils/healthRisk';

interface PrepositionPlannerCardProps {
  locations: LocationData[];
  language: Language;
  selectedUpazilaId?: string;
}

export const PrepositionPlannerCard: React.FC<PrepositionPlannerCardProps> = ({
  locations,
  language,
  selectedUpazilaId,
}) => {
  const isBn = language === 'bn';

  const [assumptions, setAssumptions] = useState<PrepositionAssumptions>(
    DEFAULT_PREPOSITION_ASSUMPTIONS
  );
  const [showConfig, setShowConfig] = useState(false);
  const [filterUpazila, setFilterUpazila] = useState<string>(selectedUpazilaId || 'all');

  const plan = calculatePrepositionPlan(locations, SAMPLE_SHELTER_MEDICAL_BOARD, assumptions);

  const displayedItems =
    filterUpazila === 'all'
      ? plan
      : plan.filter(
          (p) =>
            p.upazilaEn.toLowerCase() === filterUpazila.toLowerCase() ||
            locations.find((l) => l.id === filterUpazila)?.nameEn.toLowerCase() ===
              p.upazilaEn.toLowerCase()
        );

  const totalDisplaced = plan.reduce((sum, item) => sum + item.displacedPopulationEstimate, 0);
  const totalOrsNeed = plan.reduce((sum, item) => sum + item.projectedOrsDailyNeed, 0);
  const totalOrsShortfall = plan.reduce((sum, item) => sum + item.orsShortfall, 0);
  const totalStock = plan.reduce((sum, item) => sum + item.simulatedOrsStock, 0);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isBn ? 'প্রিপজিশন প্ল্যানার: চিকিৎসা ও খাবার স্যালাইন বরাদ্দ' : 'Preposition Planner: Medical Stock Logistics'}
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
              DERIVED
            </span>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 border border-purple-500/30 px-1.5 py-0.5 rounded">
              SIMULATED STOCK
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isBn
              ? 'স্থানচ্যুত জনসংখ্যা ও ডায়রিয়া প্রাদুর্ভাব অনুমানের ভিত্তিতে জরুরি ত্রাণ ও স্যালাইন বরাদ্দ নির্ধারণ।'
              : 'Actionable ORS and emergency supply allocation based on projected displaced population and disease pressure.'}
          </p>
        </div>

        {/* Controls: Assumption Slider Toggle & Print Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              showConfig
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isBn ? 'অনুমান পরিবর্তন' : 'Assumptions'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            title="Print one-page situation brief"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{isBn ? 'প্রিন্ট রিপোর্ট' : 'Print Brief'}</span>
          </button>
        </div>
      </div>

      {/* Configurable Assumptions Drawer (Phase 7.1 & 8) */}
      {showConfig && (
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>{isBn ? 'লজিস্টিক মডেলের অনুমান (ASSUMPTION)' : 'Configurable Model Assumptions'}</span>
            </span>
            <button
              type="button"
              onClick={() => setAssumptions(DEFAULT_PREPOSITION_ASSUMPTIONS)}
              className="text-[10px] text-slate-400 hover:text-cyan-300 underline"
            >
              {isBn ? 'ডিফল্ট মান' : 'Reset to Defaults'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>{isBn ? 'দৈনিক স্যালাইন (প্রতি ব্যক্তি):' : 'ORS Sachets / Person / Day:'}</span>
                <span className="font-mono font-bold text-cyan-300">{assumptions.orsPerPersonDay}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={assumptions.orsPerPersonDay}
                onChange={(e) =>
                  setAssumptions({ ...assumptions, orsPerPersonDay: Number(e.target.value) })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Adjustable planning assumption</span>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>{isBn ? 'পানি বিশুদ্ধকরণ ট্যাবলেট / ব্যক্তি:' : 'Purification Tablets / Person / Day:'}</span>
                <span className="font-mono font-bold text-cyan-300">{assumptions.tabletsPerPersonDay}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={assumptions.tabletsPerPersonDay}
                onChange={(e) =>
                  setAssumptions({ ...assumptions, tabletsPerPersonDay: Number(e.target.value) })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Adjustable planning assumption</span>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>{isBn ? 'বিশুদ্ধ পানি (লিটার / ব্যক্তি):' : 'Clean Water Litres / Person / Day:'}</span>
                <span className="font-mono font-bold text-cyan-300">{assumptions.cleanWaterLitresPerDay}L</span>
              </div>
              <input
                type="range"
                min="2"
                max="7"
                step="0.5"
                value={assumptions.cleanWaterLitresPerDay}
                onChange={(e) =>
                  setAssumptions({
                    ...assumptions,
                    cleanWaterLitresPerDay: Number(e.target.value),
                  })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Adjustable planning assumption (verify with local WASH guidance)</span>
            </div>
          </div>
        </div>
      )}

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
            {isBn ? 'স্থানচ্যুত জনসংখ্যা (DERIVED)' : 'Displaced Population'}
          </span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {totalDisplaced.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">Across 9 Upazilas</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold block">
            {isBn ? 'দৈনিক স্যালাইন চাহিদা (DERIVED)' : 'Daily ORS Need'}
          </span>
          <span className="text-xl font-bold font-mono text-cyan-300 mt-1 block">
            {totalOrsNeed.toLocaleString()}
          </span>
          <span className="text-[10px] text-cyan-500/70 block">@ {assumptions.orsPerPersonDay} sachets/person</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold block">
            {isBn ? 'বর্তমান মজুদ (SIMULATED)' : 'Available Stock'}
          </span>
          <span className="text-xl font-bold font-mono text-purple-300 mt-1 block">
            {totalStock.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">Sample shelter logs</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-rose-400 font-semibold block">
            {isBn ? 'মোট ঘাটতি (SHORTFALL)' : 'Net ORS Shortfall'}
          </span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
            {totalOrsShortfall.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-500/70 block">
            {totalOrsShortfall > 0 ? (isBn ? 'তাৎক্ষণিক ট্রান্সফার প্রয়োজন' : 'Immediate transfer needed') : 'Sufficient stock'}
          </span>
        </div>
      </div>

      {/* Upazila Need Ranking Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            {isBn ? 'উপজেলা অনুযায়ী অগ্রাধিকার ও স্টক ট্রান্সফার সুপারিশ' : 'Upazila Need Ranking & Transfer Recommendations'}
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            {displayedItems.length} {isBn ? 'উপজেলা' : 'Upazilas'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-mono uppercase">
                <th className="py-2.5 px-3">Upazila</th>
                <th className="py-2.5 px-3">Risk Tier</th>
                <th className="py-2.5 px-3 text-right">Displaced Est.</th>
                <th className="py-2.5 px-3 text-right">Daily ORS Need</th>
                <th className="py-2.5 px-3 text-right">Stock</th>
                <th className="py-2.5 px-3 text-right">Shortfall</th>
                <th className="py-2.5 px-3">Urgency</th>
                <th className="py-2.5 px-3">Transfer Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {displayedItems.map((item) => (
                <tr key={item.upazilaEn} className="hover:bg-slate-900/50 transition">
                  <td className="py-2.5 px-3 text-white font-sans font-bold">
                    {isBn ? item.upazilaBn : item.upazilaEn}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        item.floodRiskScore >= 78
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : item.floodRiskScore >= 58
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {item.floodRiskScore >= 78 ? 'CRITICAL' : item.floodRiskScore >= 58 ? 'HIGH' : 'MODERATE'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {item.displacedPopulationEstimate.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">
                    {item.projectedOrsDailyNeed.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-purple-300">
                    {item.simulatedOrsStock.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {item.orsShortfall > 0 ? (
                      <span className="text-rose-400 font-bold">
                        -{item.orsShortfall.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>OK</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        item.urgencyLevel === 'CRITICAL'
                          ? 'bg-rose-500 text-slate-950 font-black'
                          : item.urgencyLevel === 'HIGH'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.urgencyLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[11px]">
                    {item.orsShortfall > 0 && item.nearestSurplusShelterEn ? (
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <Truck className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>
                          Transfer {item.suggestedTransferQuantity} from{' '}
                          <span className="font-semibold text-white">
                            {isBn ? item.nearestSurplusShelterBn : item.nearestSurplusShelterEn}
                          </span>{' '}
                          (~{item.distanceKm} km)
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Local stock sufficient</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
