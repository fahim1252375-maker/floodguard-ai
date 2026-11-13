import React, { useState } from 'react';
import { HeartHandshake, Siren, Truck } from 'lucide-react';
import { Language, LocationData } from '../../types';
import { CheckinStatus, opsApi, timeAgo } from '../../utils/opsApi';
import { safeGetItem, safeSetItem, STORAGE_KEYS } from '../../utils/storage';
import type { OpsLive } from '../../hooks/useOpsLive';

interface Props {
  locations: LocationData[];
  language: Language;
  areaId: string;
  initialStatus: CheckinStatus;
  live: OpsLive;
  notify: (msg: string, kind?: 'ok' | 'err') => void;
}

const STATUSES: { id: CheckinStatus; icon: React.ReactNode; en: string; bn: string; cls: string }[] = [
  { id: 'safe', icon: <HeartHandshake className="w-4 h-4" />, en: "I'm safe", bn: 'আমি নিরাপদ', cls: 'bg-emerald-500 text-slate-950 border-emerald-400' },
  { id: 'evacuating', icon: <Truck className="w-4 h-4" />, en: 'Evacuating', bn: 'সরে যাচ্ছি', cls: 'bg-amber-400 text-slate-950 border-amber-300' },
  { id: 'need_help', icon: <Siren className="w-4 h-4" />, en: 'I need help', bn: 'সাহায্য চাই', cls: 'bg-rose-500 text-white border-rose-400' },
];

export const CheckinPanel: React.FC<Props> = ({ locations, language, areaId, initialStatus, live, notify }) => {
  const bn = language === 'bn';
  const L = (en: string, b: string) => (bn ? b : en);
  const [area, setArea] = useState(areaId);
  const [status, setStatus] = useState<CheckinStatus>(initialStatus);
  const [people, setPeople] = useState(1);
  const [note, setNote] = useState('');
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<{ token: string; status: CheckinStatus; at: string } | null>(() =>
    safeGetItem(STORAGE_KEYS.OPS_CHECKIN_TOKEN, null)
  );

  const submit = async () => {
    setBusy(true);
    try {
      const r = await opsApi.createCheckin({ locationId: area, status, people, note: note || undefined, contact: contact || undefined, consent });
      const saved = { token: r.token, status, at: new Date().toISOString() };
      safeSetItem(STORAGE_KEYS.OPS_CHECKIN_TOKEN, saved);
      setMine(saved);
      setNote('');
      notify(status === 'need_help'
        ? L('Help request sent. If life is in danger, call 999 now.', 'সাহায্যের অনুরোধ পাঠানো হয়েছে। জীবন বিপন্ন হলে এখনই ৯৯৯ এ কল করুন।')
        : L('Check-in recorded. Thank you.', 'চেক-ইন রেকর্ড হয়েছে। ধন্যবাদ।'));
    } catch (e: any) {
      notify(e.message || L('Could not send.', 'পাঠানো যায়নি।'), 'err');
    } finally {
      setBusy(false);
    }
  };

  const clearMine = async (mode: 'resolve' | 'delete') => {
    if (!mine) return;
    try {
      await (mode === 'resolve' ? opsApi.resolveMyCheckin(mine.token) : opsApi.deleteMyCheckin(mine.token));
    } catch { /* already resolved or removed */ }
    safeSetItem(STORAGE_KEYS.OPS_CHECKIN_TOKEN, null);
    setMine(null);
    notify(mode === 'resolve' ? L('Marked as resolved.', 'সমাধান হিসেবে চিহ্নিত।') : L('Your check-in was deleted.', 'আপনার চেক-ইন মুছে ফেলা হয়েছে।'));
  };

  const card = 'rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5';
  const input = 'bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500';
  const rows = locations
    .map((l) => ({ l, c: live.checkins[l.id] }))
    .filter((r) => r.c)
    .sort((a, b) => (b.c!.need_help?.people ?? 0) - (a.c!.need_help?.people ?? 0));

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className={card}>
        <h2 className="text-sm font-bold text-white mb-1">{L('Safe check-in', 'নিরাপদ চেক-ইন')}</h2>
        <p className="text-[11px] text-slate-400 mb-3">{L('Tell responders and neighbours how your household is doing. Takes 15 seconds.', 'আপনার পরিবারের অবস্থা রেসপন্ডার ও প্রতিবেশীদের জানান। ১৫ সেকেন্ড লাগবে।')}</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {STATUSES.map((s) => (
            <button key={s.id} aria-pressed={status === s.id} onClick={() => setStatus(s.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-bold ${status === s.id ? s.cls : 'bg-slate-950 text-slate-300 border-slate-700'}`}>
              {s.icon}{bn ? s.bn : s.en}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="text-xs text-slate-300">{L('Area', 'এলাকা')}
            <select className={`${input} w-full mt-1`} value={area} onChange={(e) => setArea(e.target.value)}>
              {locations.map((l) => <option key={l.id} value={l.id}>{bn ? l.nameBn : l.nameEn}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">{L('People in household', 'পরিবারের সদস্য')}
            <input type="number" min={1} max={50} className={`${input} w-full mt-1`} value={people} onChange={(e) => setPeople(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} />
          </label>
        </div>
        <textarea className={`${input} w-full mb-3`} rows={2} maxLength={280} placeholder={L('Optional note (e.g. elderly person, roof, boat needed)', 'ঐচ্ছিক নোট (যেমন বয়স্ক সদস্য, ছাদে আছি, নৌকা দরকার)')} value={note} onChange={(e) => setNote(e.target.value)} aria-label={L('Note', 'নোট')} />
        {status !== 'safe' && (
          <input className={`${input} w-full mb-3`} inputMode="tel" placeholder={L('Phone so responders can call you (optional)', 'রেসপন্ডার কল করতে পারে এমন ফোন নম্বর (ঐচ্ছিক)')} value={contact} onChange={(e) => setContact(e.target.value)} aria-label={L('Phone', 'ফোন')} />
        )}
        <label className="flex items-start gap-2 text-xs text-slate-300 mb-3">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-cyan-500" />
          <span>{L('I agree to share this. Only totals are public; my phone and note are visible to responders only.', 'আমি এটি জানাতে সম্মত। শুধু মোট সংখ্যা প্রকাশ্য; আমার ফোন ও নোট শুধু রেসপন্ডাররা দেখবে।')}</span>
        </label>
        <button disabled={!consent || busy || !live.online} onClick={submit} className="w-full px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-sm font-bold disabled:opacity-40">
          {busy ? L('Sending…', 'পাঠানো হচ্ছে…') : L('Send check-in', 'চেক-ইন পাঠান')}
        </button>
        {!live.online && <p className="text-[11px] text-amber-300 mt-2">{L('Server not reachable. Call 999 for emergencies.', 'সার্ভার পাওয়া যাচ্ছে না। জরুরি হলে ৯৯৯ এ কল করুন।')}</p>}
        {mine && (
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-300">
            {L('Your last check-in', 'আপনার শেষ চেক-ইন')}: <b className="text-white">{mine.status.replace('_', ' ')}</b> · {timeAgo(mine.at, bn)}
            <div className="flex gap-2 mt-2">
              <button onClick={() => clearMine('resolve')} className="px-2.5 py-1 rounded-lg border border-slate-700 hover:border-emerald-500/60">{L('Mark resolved', 'সমাধান হয়েছে')}</button>
              <button onClick={() => clearMine('delete')} className="px-2.5 py-1 rounded-lg border border-slate-700 hover:border-rose-500/60">{L('Delete it', 'মুছে ফেলুন')}</button>
            </div>
          </div>
        )}
      </div>

      <div className={card}>
        <h2 className="text-sm font-bold text-white mb-1">{L('Community pulse (last 24h)', 'কমিউনিটি চিত্র (গত ২৪ ঘণ্টা)')}</h2>
        <p className="text-[11px] text-slate-400 mb-3">{L('Self-reported and unverified. Totals only; no names or numbers are shown.', 'নিজে জানানো ও অযাচাইকৃত। শুধু মোট সংখ্যা; নাম বা নম্বর দেখানো হয় না।')}</p>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">{L('No check-ins yet. Be the first to report in.', 'এখনও কোনো চেক-ইন নেই। প্রথম জন হোন।')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr><th className="py-1.5">{L('Area', 'এলাকা')}</th><th className="text-emerald-300">{L('Safe', 'নিরাপদ')}</th><th className="text-amber-300">{L('Evacuating', 'সরছে')}</th><th className="text-rose-300">{L('Need help', 'সাহায্য চায়')}</th><th>{L('Latest', 'সর্বশেষ')}</th></tr>
              </thead>
              <tbody>
                {rows.map(({ l, c }) => (
                  <tr key={l.id} className="border-b border-slate-800/60">
                    <td className="py-1.5 text-slate-200">{bn ? l.nameBn : l.nameEn}</td>
                    <td>{c!.safe?.people ?? 0}</td><td>{c!.evacuating?.people ?? 0}</td>
                    <td className={c!.need_help ? 'font-bold text-rose-300' : ''}>{c!.need_help?.people ?? 0}</td>
                    <td className="text-slate-400">{c!.latest ? timeAgo(c!.latest, bn) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
