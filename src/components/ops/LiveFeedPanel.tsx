import React, { useState } from 'react';
import { Database, Radio } from 'lucide-react';
import { Language, LocationData } from '../../types';
import { timeAgo } from '../../utils/opsApi';
import type { OpsLive } from '../../hooks/useOpsLive';

interface Props {
  locations: LocationData[];
  language: Language;
  areaId: string;
  live: OpsLive;
}

const SEV: Record<string, string> = {
  watch: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  warning: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  emergency: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
};

export const LiveFeedPanel: React.FC<Props> = ({ locations, language, areaId, live }) => {
  const bn = language === 'bn';
  const L = (en: string, b: string) => (bn ? b : en);
  const [mineOnly, setMineOnly] = useState(false);
  const shown = live.events.filter((e) => !mineOnly || e.station_id === areaId);
  const nameOf = (id: string) => {
    const l = locations.find((x) => x.id === id);
    return l ? (bn ? l.nameBn : l.nameEn) : id;
  };

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold ${live.streaming ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' : live.online ? 'border-amber-500/40 text-amber-300 bg-amber-500/10' : 'border-slate-600 text-slate-400'}`}>
            <Radio className="w-3.5 h-3.5" />
            {live.streaming ? L('Live', 'লাইভ') : live.online ? L('Connected (polling)', 'সংযুক্ত (পোলিং)') : L('Offline', 'অফলাইন')}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Database className="w-3.5 h-3.5" />
            {L(`${live.readingsTotal.toLocaleString('en-US')} readings recorded`, `${live.readingsTotal.toLocaleString('en-US')}টি রিডিং রেকর্ড`)}
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} className="accent-cyan-500" />
          {L('Only my area', 'শুধু আমার এলাকা')}
        </label>
      </div>

      {!live.online && (
        <p className="text-sm text-slate-400 py-6 text-center">
          {L('The backend is not reachable, so alert history is unavailable. Start the server with npm run dev.', 'ব্যাকএন্ড পাওয়া যাচ্ছে না, তাই সতর্কতার ইতিহাস নেই। npm run dev দিয়ে সার্ভার চালু করুন।')}
        </p>
      )}
      {live.online && shown.length === 0 && (
        <p className="text-sm text-slate-400 py-6 text-center">{L('No alerts recorded yet. Alerts appear here the moment the engine detects them.', 'এখনও কোনো সতর্কতা রেকর্ড হয়নি। ইঞ্জিন শনাক্ত করামাত্র এখানে দেখা যাবে।')}</p>
      )}
      <ul className="space-y-2 max-h-[30rem] overflow-y-auto">
        {shown.map((e) => (
          <li key={e.id} className={`rounded-xl border px-3 py-2.5 text-xs ${SEV[e.severity]}`}>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="font-bold uppercase">{e.severity} · {nameOf(e.station_id)}</span>
              <span className="text-[10px] opacity-70">{timeAgo(e.created_at, bn)}</span>
            </div>
            {bn ? e.message_bn : e.message_en}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-500">
        {L('Events come from a server-side engine that records every station every 15 minutes and applies a 6-hour cooldown so you are not spammed. Station values may be simulated.', 'একটি সার্ভার-সাইড ইঞ্জিন প্রতি ১৫ মিনিটে প্রতিটি কেন্দ্র রেকর্ড করে এবং ৬ ঘণ্টার বিরতি দেয় যাতে বারবার বার্তা না আসে। কেন্দ্রের মান সিমুলেটেড হতে পারে।')}
      </p>
    </div>
  );
};
