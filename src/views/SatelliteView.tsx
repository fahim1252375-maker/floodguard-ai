import React from 'react';
import {
  Satellite,
  Radar,
  CloudSun,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';
import { SATELLITE_OBSERVATIONS } from '../data/globalIntelligenceData';

interface SatelliteViewProps {
  language: Language;
}

export const SatelliteView: React.FC<SatelliteViewProps> = ({ language }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5" />
                {language === 'en' ? 'Satellite Workflow Demonstration' : 'স্যাটেলাইট ওয়ার্কফ্লো ডেমো'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                Example missions · no live feed
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'en' ? 'Satellite Analysis Workflow' : 'স্যাটেলাইট বিশ্লেষণ ওয়ার্কফ্লো'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              {language === 'en'
                ? 'This page demonstrates how satellite-derived flood information could be presented. SAR is generally less affected by cloud cover than optical imagery, but actual mapping requires an acquired image, a validated processing workflow and field/context checks.'
                : 'এই পৃষ্ঠায় স্যাটেলাইট-ভিত্তিক বন্যা তথ্য কীভাবে দেখানো যেতে পারে তা ডেমো হিসেবে দেখানো হয়েছে। এসএআর সাধারণত অপটিক্যাল ছবির তুলনায় মেঘে কম বাধাগ্রস্ত হয়; বাস্তব ম্যাপিংয়ের জন্য প্রকৃত ছবি, যাচাইকৃত প্রসেসিং ও মাঠপর্যায়ের তথ্য প্রয়োজন।'}
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-right self-start md:self-auto">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {language === 'en' ? 'Data connection' : 'ডেটা সংযোগ'}
            </span>
            <span className="text-xl font-bold font-mono text-amber-300">
              {language === 'en' ? 'Not connected' : 'সংযুক্ত নয়'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-xs leading-relaxed text-amber-100">
        {language === 'en'
          ? 'SIMULATED EXAMPLE DATA — The dates, percentages, footprints and processing notes below are illustrative placeholders. This release does not download, process or verify live Sentinel-1, Sentinel-2 or NASA GPM imagery. Do not use these sample values for evacuation or operational decisions.'
          : 'সিমুলেটেড উদাহরণ ডেটা — নিচের তারিখ, শতাংশ, এলাকা ও প্রসেসিং নোট কেবল ডেমোর জন্য। এই সংস্করণে Sentinel-1, Sentinel-2 বা NASA GPM-এর লাইভ ছবি ডাউনলোড, প্রসেস বা যাচাই করা হয় না। সরিয়ে নেওয়া বা বাস্তব সিদ্ধান্তে এই নমুনা মান ব্যবহার করবেন না।'}
      </div>

      {/* SAR vs Optical Comparison Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Radar className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm text-white">
              {language === 'en' ? 'Sentinel-1 C-Band SAR (Microwave Imaging)' : 'সেন্টিনেল-১ সি-ব্যান্ড এসএআর (মাইক্রোওয়েভ ইমেজিং)'}
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'en'
              ? 'SAR uses microwave backscatter and is generally less affected by cloud cover than optical imagery. Water mapping still depends on acquisition geometry, surface conditions and validated processing.'
              : 'এসএআর মাইক্রোওয়েভ ব্যাকস্ক্যাটার ব্যবহার করে এবং সাধারণত অপটিক্যাল ছবির তুলনায় মেঘে কম বাধাগ্রস্ত হয়। পানির ম্যাপিংয়ের নির্ভুলতা ছবি তোলার কোণ, পৃষ্ঠের অবস্থা ও যাচাইকৃত প্রসেসিংয়ের ওপর নির্ভর করে।'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <CloudSun className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              {language === 'en' ? 'Optical Multispectral (Cloud-Occluded)' : 'অপটিক্যাল মাল্টিস্পেকট্রাল (মেঘে বাধাগ্রস্ত)'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {language === 'en'
              ? 'Optical imagery (for example Sentinel-2 and Landsat) can be obscured by monsoon cloud cover. Cloud masking and a clear acquisition window are important when interpreting a scene.'
              : 'অপটিক্যাল ছবি (যেমন Sentinel-2 ও Landsat) বর্ষার মেঘে আড়াল হতে পারে। ছবি বিশ্লেষণের সময় ক্লাউড মাস্ক ও ছবির সময় বিবেচনা করা জরুরি।'}
          </p>
        </div>
      </div>

      {/* Satellite Missions Cards */}
      <div className="space-y-4">
        {SATELLITE_OBSERVATIONS.map((sat) => (
          <div
            key={sat.id}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 hover:border-purple-500/40 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Satellite className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{sat.satelliteName}</h3>
                  <span className="text-xs text-slate-400 font-mono">{sat.sensorType}</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {sat.processingStatus === 'SIMULATED' ? (language === 'en' ? 'SIMULATED DEMO' : 'সিমুলেটেড ডেমো') : sat.processingStatus}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{sat.notes}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">{language === 'en' ? 'Example Timestamp' : 'নমুনা সময়'}</span>
                <span className="font-mono font-bold text-slate-200">
                  {new Date(sat.acquisitionDate).toUTCString().slice(0, 22)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">{language === 'en' ? 'Nominal Resolution' : 'নমুনা রেজল্যুশন'}</span>
                <span className="font-mono font-bold text-cyan-400">
                  {sat.groundResolutionM >= 1000
                    ? `${sat.groundResolutionM / 1000} km`
                    : `${sat.groundResolutionM} m`}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">{language === 'en' ? 'Example Cloud Cover' : 'নমুনা মেঘের পরিমাণ'}</span>
                <span
                  className={`font-mono font-bold ${
                    sat.cloudCoverPercent === 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {sat.cloudCoverPercent}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">{language === 'en' ? 'Illustrative Demo Index' : 'উদাহরণ ডেমো সূচক'}</span>
                <span className="font-mono font-bold text-purple-300">
                  +{sat.surfaceWaterExpansionPercent}%
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
              <span className="text-slate-400">{language === 'en' ? 'Example method label:' : 'উদাহরণ পদ্ধতি:'}</span>
              <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {sat.algorithmVersion}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
