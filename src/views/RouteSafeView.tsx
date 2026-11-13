import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Home,
  Compass,
  FileCheck,
  Footprints,
} from 'lucide-react';
import { Language, EvacuationRoute } from '../types';
import { EVACUATION_ROUTES } from '../data/globalIntelligenceData';

interface RouteSafeViewProps {
  language: Language;
}

export const RouteSafeView: React.FC<RouteSafeViewProps> = ({ language }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const filteredRoutes = EVACUATION_ROUTES.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    return r.accessibilityStatus === selectedFilter;
  });

  const passableCount = EVACUATION_ROUTES.filter((r) => r.accessibilityStatus === 'PASSABLE').length;
  const waterloggedCount = EVACUATION_ROUTES.filter((r) => r.accessibilityStatus === 'WATERLOGGED').length;
  const cutOffCount = EVACUATION_ROUTES.filter((r) => r.accessibilityStatus === 'CUT_OFF').length;

  const getStatusBadge = (status: EvacuationRoute['accessibilityStatus']) => {
    switch (status) {
      case 'PASSABLE':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASSABLE (SAFE)
          </span>
        );
      case 'WATERLOGGED':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            WATERLOGGED (HAZARD)
          </span>
        );
      case 'CUT_OFF':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            CUT OFF (DO NOT USE)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                {language === 'en' ? 'Evacuation Routing & Shelter Reachability' : 'নিরাপদ স্থানান্তর রুট ও আশ্রয়কেন্দ্র প্রবেশ্যতা'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                Field Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'en' ? 'RouteSafe: Emergency Passage Audit' : 'রুটসেফ: নিরাপদ স্থানান্তর প্যাসেজ অডিট'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              {language === 'en'
                ? 'Assess road connectivity and foot reachability from inundated villages to fortified flood shelters in Gowainghat, Companiganj, and Tahirpur. Updates based on field volunteer verification and water depths.'
                : 'গোয়াইনঘাট, কোম্পানিগঞ্জ ও তাহিরপুরের প্লাবিত গ্রাম থেকে আশ্রয়কেন্দ্রে যাওয়ার সড়কের বর্তমান অবস্থা ও হাঁটার দূরত্ব যাচাই করুন।'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 self-start md:self-auto">
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block">Passable</span>
              <span className="text-base font-bold font-mono text-emerald-400">{passableCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block">Waterlogged</span>
              <span className="text-base font-bold font-mono text-amber-400">{waterloggedCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block">Cut Off</span>
              <span className="text-base font-bold font-mono text-rose-400">{cutOffCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Life-Safety Warning Banner */}
      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs text-rose-200 leading-relaxed">
          <strong className="text-rose-100 font-bold block mb-1">
            {language === 'en'
              ? 'CRITICAL LIFE SAFETY DIRECTIVE: NEVER ATTEMPT DEEP WATER CROSSING'
              : 'জরুরি জীবনরক্ষা নির্দেশনা: প্রবহমান বানের পানিতে নামবেন না'}
          </strong>
          {language === 'en'
            ? 'Water as shallow as 15 cm (6 inches) with moderate current can knock an adult off their feet. 30 cm (12 inches) can carry away cars and auto-rickshaws. If a route is marked WATERLOGGED or CUT OFF, remain on elevated ground or request emergency boat rescue via 999 or 1090.'
            : 'মাত্র ১৫ সেমি (৬ ইঞ্চি) গভীরতার স্রোতের পানিতে মানুষ ভেসে যেতে পারে এবং ৩০ সেমি পানি যানবাহন ভাসিয়ে নেওয়ার ক্ষমতা রাখে। কোনো রুট জলমগ্ন বা বিচ্ছিন্ন হলে ঝুঁকি নিয়ে পার হবেন না। নৌ-উদ্ধারের জন্য ৯৯৯ বা ১০৯০ নম্বরে যোগাযোগ করুন।'}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['ALL', 'PASSABLE', 'WATERLOGGED', 'CUT_OFF'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedFilter === filter
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {filter === 'ALL'
                ? 'All Routes'
                : filter === 'PASSABLE'
                ? 'Passable'
                : filter === 'WATERLOGGED'
                ? 'Waterlogged'
                : 'Cut Off'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filteredRoutes.length} Monitored Routes
        </span>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {filteredRoutes.map((route) => (
          <div
            key={route.id}
            className={`p-5 rounded-xl border transition-all ${
              route.accessibilityStatus === 'CUT_OFF'
                ? 'bg-rose-950/20 border-rose-900/60'
                : route.accessibilityStatus === 'WATERLOGGED'
                ? 'bg-amber-950/20 border-amber-900/60'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  {route.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    From: <strong className="text-slate-300">{route.fromZone}</strong>
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3 text-cyan-400" />
                    To: <strong className="text-cyan-300">{route.toShelter}</strong>
                  </span>
                </div>
              </div>

              {getStatusBadge(route.accessibilityStatus)}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Distance</span>
                <span className="font-mono font-bold text-slate-200">{route.distanceKm} km</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Est. Foot Time</span>
                <span className="font-mono font-bold text-cyan-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {route.estTravelMins} mins
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Road Elevation</span>
                <span className="font-mono font-bold text-slate-200">{route.roadElevationM} m MSL</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Field Verification</span>
                <span
                  className={`font-mono font-bold text-[11px] flex items-center gap-1 mt-0.5 ${
                    route.verifiedByOfficer ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  <FileCheck className="w-3 h-3" />
                  {route.verifiedByOfficer ? 'Officer Verified' : 'Community Reported'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
