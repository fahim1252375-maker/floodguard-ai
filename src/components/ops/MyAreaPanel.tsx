import React, { useState } from 'react';
import { BellRing, HeartHandshake, Phone, ShieldCheck, Siren } from 'lucide-react';
import { Language, LocationData } from '../../types';
import { computeAreaStatus, AreaLevel } from '../../utils/areaStatus';
import { opsApi, Severity } from '../../utils/opsApi';
import { safeSetItem, STORAGE_KEYS } from '../../utils/storage';
import type { OpsLive } from '../../hooks/useOpsLive';

export interface Subscription {
  token: string;
  locationId: string;
  channel: string;
  minSeverity: Severity;
}

interface Props {
  locations: LocationData[];
  language: Language;
  areaId: string;
  onAreaChange: (id: string) => void;
  live: OpsLive;
  subscription: Subscription | null;
  onSubscriptionChange: (s: Subscription | null) => void;
  onCheckin: (status: 'safe' | 'need_help') => void;
  notify: (msg: string, kind?: 'ok' | 'err') => void;
}

const LEVEL_STYLE: Record<AreaLevel, { ring: string; chip: string; dot: string; en: string; bn: string }> = {
  green: { ring: 'border-emerald-500/40 bg-emerald-500/10', chip: 'bg-emerald-500 text-slate-950', dot: 'bg-emerald-400', en: 'STAY ALERT', bn: 'সতর্ক থাকুন' },
  amber: { ring: 'border-amber-500/50 bg-amber-500/10', chip: 'bg-amber-400 text-slate-950', dot: 'bg-amber-400', en: 'GET READY', bn: 'প্রস্তুত হোন' },
  red: { ring: 'border-rose-500/60 bg-rose-500/10', chip: 'bg-rose-500 text-white', dot: 'bg-rose-500', en: 'MOVE NOW', bn: 'এখনই সরুন' },
};

const HELPLINES: [string, string, string][] = [
  ['999', 'Emergency / rescue', 'জরুরি / উদ্ধার'],
  ['16263', 'Health helpline', 'স্বাস্থ্য হেল্পলাইন'],
  ['1090', 'Flood warning IVR', 'বন্যা সতর্কবার্তা'],
  ['109', 'Women & children', 'নারী ও শিশু'],
];

export const MyAreaPanel: React.FC<Props> = ({
  locations, language, areaId, onAreaChange, live, subscription, onSubscriptionChange, onCheckin, notify,
}) => {
  const bn = language === 'bn';
  const L = (en: string, b: string) => (bn ? b : en);
  const loc = locations.find((l) => l.id === areaId) ?? locations[0];
  const status = computeAreaStatus(loc);
  const style = LEVEL_STYLE[status.level];
  const help = live.checkins[loc.id]?.need_help;

  const [channel, setChannel] = useState<'web' | 'sms'>('web');
  const [contact, setContact] = useState('');
  const [minSeverity, setMinSeverity] = useState<Severity>('warning');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const subscribe = async () => {
    setBusy(true);
    try {
      if (channel === 'web' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      const r = await opsApi.subscribe({
        locationId: loc.id, channel, contact: channel === 'sms' ? contact : undefined,
        language, minSeverity, consent,
      });
      const sub = { token: r.token, locationId: loc.id, channel, minSeverity };
      safeSetItem(STORAGE_KEYS.OPS_SUB_TOKEN, sub);
      onSubscriptionChange(sub);
      notify(L('Subscribed. You will be alerted for this area.', 'সাবস্ক্রাইব হয়েছে। এই এলাকার সতর্কতা পাবেন।'));
    } catch (e: any) {
      notify(e.message || L('Could not subscribe.', 'সাবস্ক্রাইব করা যায়নি।'), 'err');
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;
    try {
      await opsApi.unsubscribe(subscription.token);
    } catch { /* already gone on the server */ }
    safeSetItem(STORAGE_KEYS.OPS_SUB_TOKEN, null);
    onSubscriptionChange(null);
    notify(L('Unsubscribed and your data deleted.', 'সাবস্ক্রিপশন বাতিল ও আপনার তথ্য মুছে ফেলা হয়েছে।'));
  };

  const card = 'rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5';
  const input = 'bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-slate-300 font-semibold" htmlFor="my-area">{L('My area', 'আমার এলাকা')}</label>
        <select id="my-area" value={loc.id} onChange={(e) => onAreaChange(e.target.value)} className={input}>
          {locations.map((l) => <option key={l.id} value={l.id}>{bn ? l.nameBn : l.nameEn}</option>)}
        </select>
      </div>

      <div className={`rounded-2xl border-2 p-5 ${style.ring}`} role="status" aria-live="polite">
        <div className="flex items-center gap-3 mb-2">
          <span className={`w-3.5 h-3.5 rounded-full ${style.dot} animate-pulse`} />
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide ${style.chip}`}>{bn ? style.bn : style.en}</span>
          <span className="text-sm text-slate-300">{bn ? loc.nameBn : loc.nameEn}</span>
        </div>
        <p className="text-lg sm:text-xl font-bold text-white leading-snug">{bn ? status.headlineBn : status.headlineEn}</p>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          {[
            [L('Water level', 'পানির স্তর'), `${loc.currentWaterLevel.toFixed(2)} m`],
            [L('Danger level', 'বিপৎসীমা'), `${loc.dangerLevel.toFixed(2)} m`],
            [status.marginM >= 0 ? L('Below danger by', 'বিপৎসীমার নিচে') : L('ABOVE danger by', 'বিপৎসীমার উপরে'), `${Math.abs(status.marginM).toFixed(2)} m`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-950/60 border border-slate-800 py-2">
              <div className="text-base font-extrabold text-white">{v}</div>
              <div className="text-[10px] text-slate-400">{k}</div>
            </div>
          ))}
        </div>
        {loc.isSimulated && (
          <p className="text-[11px] text-slate-400 mt-3">
            {L('This reading is simulated/calibrated, not a live gauge. Confirm with BWDB/FFWC or your Upazila office.', 'এই রিডিং সিমুলেটেড/ক্যালিব্রেটেড, সরাসরি গেজ নয়। বাপাউবো/এফএফডব্লিউসি বা উপজেলা অফিসে নিশ্চিত হোন।')}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className={card}>
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-400" />{L('What to do now', 'এখন কী করবেন')}</h2>
          <ol className="space-y-2 text-sm text-slate-200 list-decimal list-inside">
            {(bn ? status.stepsBn : status.stepsEn).map((s) => <li key={s}>{s}</li>)}
          </ol>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {HELPLINES.map(([n, en, b]) => (
              <a key={n} href={`tel:${n}`} className="flex items-center gap-2 rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 hover:border-cyan-500/50">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span><b className="text-white text-sm">{n}</b><span className="block text-[10px] text-slate-400">{bn ? b : en}</span></span>
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => onCheckin('safe')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold">
              <HeartHandshake className="w-4 h-4" />{L("I'm safe", 'আমি নিরাপদ')}
            </button>
            <button onClick={() => onCheckin('need_help')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold">
              <Siren className="w-4 h-4" />{L('I need help', 'সাহায্য চাই')}
            </button>
          </div>
          {help && (
            <p className="text-[11px] text-amber-300 mt-2">
              {L(`${help.people} people in this area have asked for help in the last 24h.`, `গত ২৪ ঘণ্টায় এই এলাকায় ${help.people} জন সাহায্য চেয়েছেন।`)}
            </p>
          )}
        </div>

        <div className={card}>
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><BellRing className="w-4 h-4 text-cyan-400" />{L('Get alerts for this area', 'এই এলাকার সতর্কতা পান')}</h2>
          {subscription ? (
            <div className="text-sm text-slate-200 space-y-3">
              <p className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
                {L('Subscribed to', 'সাবস্ক্রাইব করা আছে')}: <b>{bn ? locations.find((l) => l.id === subscription.locationId)?.nameBn : locations.find((l) => l.id === subscription.locationId)?.nameEn}</b>
                {' · '}{subscription.channel === 'sms' ? 'SMS' : L('browser', 'ব্রাউজার')} · {subscription.minSeverity}
              </p>
              <button onClick={unsubscribe} className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-rose-500/60">
                {L('Unsubscribe & delete my data', 'সাবস্ক্রিপশন বাতিল ও আমার তথ্য মুছুন')}
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                {(['web', 'sms'] as const).map((c) => (
                  <button key={c} onClick={() => setChannel(c)} aria-pressed={channel === c}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${channel === c ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-950 text-slate-300 border-slate-700'}`}>
                    {c === 'web' ? L('Browser alerts', 'ব্রাউজার সতর্কতা') : 'SMS'}
                  </button>
                ))}
              </div>
              {channel === 'sms' && (
                <input className={`${input} w-full`} inputMode="tel" placeholder="+8801XXXXXXXXX" value={contact} onChange={(e) => setContact(e.target.value)} aria-label={L('Phone number', 'ফোন নম্বর')} />
              )}
              <label className="block text-xs text-slate-300">
                {L('Alert me from', 'কোন মাত্রা থেকে জানাবে')}
                <select className={`${input} w-full mt-1`} value={minSeverity} onChange={(e) => setMinSeverity(e.target.value as Severity)}>
                  <option value="watch">{L('Watch (early, more messages)', 'ওয়াচ (আগে, বেশি বার্তা)')}</option>
                  <option value="warning">{L('Warning (recommended)', 'সতর্কতা (প্রস্তাবিত)')}</option>
                  <option value="emergency">{L('Emergency only', 'শুধু জরুরি')}</option>
                </select>
              </label>
              <label className="flex items-start gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-cyan-500" />
                <span>{L('I agree to receive flood alerts. My number is used only for alerts and I can delete it any time.', 'আমি বন্যার সতর্কতা পেতে সম্মত। আমার নম্বর শুধু সতর্কতার জন্য ব্যবহৃত হবে এবং আমি যেকোনো সময় মুছতে পারব।')}</span>
              </label>
              <button disabled={!consent || busy || !live.online || (channel === 'sms' && contact.length < 6)} onClick={subscribe}
                className="w-full px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-sm font-bold disabled:opacity-40">
                {busy ? L('Saving…', 'সংরক্ষণ হচ্ছে…') : L('Subscribe', 'সাবস্ক্রাইব')}
              </button>
              {!live.online && <p className="text-[11px] text-amber-300">{L('Server not reachable. Alerts need the backend running.', 'সার্ভার পাওয়া যাচ্ছে না। সতর্কতার জন্য ব্যাকএন্ড চালু থাকা দরকার।')}</p>}
              {channel === 'sms' && <p className="text-[11px] text-slate-500">{L('SMS messages are queued for responders or an SMS gateway; delivery depends on that being configured.', 'SMS বার্তা রেসপন্ডার বা এসএমএস গেটওয়ের জন্য সারিবদ্ধ হয়; পাঠানো নির্ভর করে তা কনফিগার করা আছে কি না তার উপর।')}</p>}
            </div>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        {L('FloodGuard AI is decision support, not an official authority. Always follow instructions from local disaster management officials.', 'ফ্লাডগার্ড এআই সিদ্ধান্ত-সহায়ক টুল, সরকারি কর্তৃপক্ষ নয়। সবসময় স্থানীয় দুর্যোগ ব্যবস্থাপনা কর্মকর্তাদের নির্দেশ মানুন।')}
      </p>
    </div>
  );
};
