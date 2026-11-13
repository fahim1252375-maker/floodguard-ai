import React, { useCallback, useEffect, useState } from 'react';
import { Lock, Phone, RefreshCw } from 'lucide-react';
import { Language, LocationData } from '../../types';
import { AdminCheckin, OutboxItem, opsApi, timeAgo } from '../../utils/opsApi';
import type { OpsLive } from '../../hooks/useOpsLive';

interface Props {
  locations: LocationData[];
  language: Language;
  live: OpsLive;
  sitrepText: string;
  notify: (msg: string, kind?: 'ok' | 'err') => void;
}

type Section = 'help' | 'outbox' | 'events' | 'archive' | 'audit';

export const ResponderDesk: React.FC<Props> = ({ locations, language, live, sitrepText, notify }) => {
  const bn = language === 'bn';
  const L = (en: string, b: string) => (bn ? b : en);
  const [pin, setPin] = useState('');
  const [authed, setAuthed] = useState(false);
  const [section, setSection] = useState<Section>('help');
  const [checkins, setCheckins] = useState<AdminCheckin[]>([]);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [webhook, setWebhook] = useState(false);
  const [archive, setArchive] = useState<{ id: number; language: string; body: string; created_at: string }[]>([]);
  const [audit, setAudit] = useState<{ id: number; actor: string; action: string; detail: string | null; created_at: string }[]>([]);
  const nameOf = (id: string) => {
    const l = locations.find((x) => x.id === id);
    return l ? (bn ? l.nameBn : l.nameEn) : id;
  };

  const load = useCallback(async () => {
    if (!authed) return;
    try {
      if (section === 'help') setCheckins((await opsApi.adminCheckins(pin)).checkins);
      if (section === 'outbox') { const o = await opsApi.outbox(pin); setOutbox(o.queued); setWebhook(o.webhookConfigured); }
      if (section === 'archive') setArchive((await opsApi.sitreps(pin)).sitreps);
      if (section === 'audit') setAudit((await opsApi.audit(pin)).audit);
    } catch (e: any) {
      notify(e.message, 'err');
    }
  }, [authed, section, pin, notify]);

  useEffect(() => { load(); }, [load, live.checkins]);

  const login = async () => {
    try {
      const r = await fetch('/api/admin/verify-pin', { method: 'POST', headers: { 'x-admin-pin': pin.trim() } });
      if (!r.ok) throw new Error(L('Incorrect PIN.', 'পিন সঠিক নয়।'));
      setAuthed(true);
    } catch (e: any) {
      notify(e.message || L('Could not verify PIN.', 'পিন যাচাই করা যায়নি।'), 'err');
    }
  };

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    try { await fn(); notify(okMsg); await load(); } catch (e: any) { notify(e.message, 'err'); }
  };

  const card = 'rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5';
  const btn = 'px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-200 hover:border-cyan-500/60';

  if (!authed) {
    return (
      <div className={`${card} max-w-md`}>
        <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-400" />{L('Responder Desk', 'রেসপন্ডার ডেস্ক')}</h2>
        <p className="text-xs text-slate-400 mb-3">{L('For Upazila disaster management staff. Enter the Admin PIN shown in the server console.', 'উপজেলা দুর্যোগ ব্যবস্থাপনা কর্মীদের জন্য। সার্ভার কনসোলে দেখানো অ্যাডমিন পিন দিন।')}</p>
        <div className="flex gap-2">
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} aria-label="PIN"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500" />
          <button onClick={login} className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-bold">{L('Unlock', 'আনলক')}</button>
        </div>
      </div>
    );
  }

  const sections: [Section, string, string][] = [
    ['help', 'Help requests', 'সাহায্যের অনুরোধ'], ['outbox', 'SMS outbox', 'এসএমএস আউটবক্স'],
    ['events', 'Alert events', 'সতর্কতা ইভেন্ট'], ['archive', 'SitRep archive', 'প্রতিবেদন আর্কাইভ'], ['audit', 'Audit log', 'অডিট লগ'],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {sections.map(([id, en, b]) => (
          <button key={id} onClick={() => setSection(id)} aria-pressed={section === id}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${section === id ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 text-slate-300 border-slate-700'}`}>
            {bn ? b : en}
          </button>
        ))}
        <button onClick={load} className={`${btn} flex items-center gap-1`}><RefreshCw className="w-3 h-3" />{L('Refresh', 'রিফ্রেশ')}</button>
        <button onClick={() => act(() => opsApi.runCycle(pin), L('Monitoring cycle run.', 'মনিটরিং চক্র চালানো হয়েছে।'))} className={btn}>{L('Run cycle now', 'এখনই চক্র চালান')}</button>
      </div>

      {section === 'help' && (
        <div className={card}>
          <h2 className="text-sm font-bold text-white mb-3">{L('Check-ins (last 48h), help requests first', 'চেক-ইন (গত ৪৮ ঘণ্টা), সাহায্যের অনুরোধ আগে')}</h2>
          {checkins.length === 0 && <p className="text-sm text-slate-400">{L('Nothing yet.', 'এখনও কিছু নেই।')}</p>}
          <ul className="space-y-2 max-h-[28rem] overflow-y-auto">
            {checkins.map((c) => (
              <li key={c.id} className={`rounded-xl border px-3 py-2 text-xs ${c.resolved_at ? 'opacity-50 border-slate-800' : c.status === 'need_help' ? 'border-rose-500/40 bg-rose-500/10' : 'border-slate-700 bg-slate-950/50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-100 font-semibold">{nameOf(c.location_id)} · {c.status.replace('_', ' ')} · {c.people} {L('people', 'জন')}</span>
                  <span className="text-slate-400">{timeAgo(c.created_at, bn)}</span>
                </div>
                {c.note && <p className="text-slate-300 mt-1">{c.note}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {c.contact && <a href={`tel:${c.contact}`} className={`${btn} flex items-center gap-1`}><Phone className="w-3 h-3" />{c.contact}</a>}
                  {!c.resolved_at && <button className={btn} onClick={() => act(() => opsApi.resolveCheckin(pin, c.id), L('Resolved.', 'সমাধান হয়েছে।'))}>{L('Mark resolved', 'সমাধান হয়েছে')}</button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {section === 'outbox' && (
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">{L('Queued SMS alerts', 'সারিবদ্ধ এসএমএস সতর্কতা')} ({outbox.length})</h2>
            {webhook && <button className={btn} onClick={() => act(() => opsApi.flushOutbox(pin), L('Sent to webhook.', 'ওয়েবহুকে পাঠানো হয়েছে।'))}>{L('Send via webhook', 'ওয়েবহুকে পাঠান')}</button>}
          </div>
          <p className="text-[11px] text-slate-500 mb-3">{webhook ? L('A webhook is configured; queued messages are posted there automatically.', 'ওয়েবহুক কনফিগার করা আছে; সারিবদ্ধ বার্তা স্বয়ংক্রিয়ভাবে সেখানে যায়।') : L('No SMS gateway is configured (NOTIFY_WEBHOOK_URL). Send these manually, then mark them sent.', 'কোনো এসএমএস গেটওয়ে কনফিগার করা নেই (NOTIFY_WEBHOOK_URL)। এগুলো হাতে পাঠিয়ে "পাঠানো হয়েছে" চিহ্নিত করুন।')}</p>
          {outbox.length === 0 && <p className="text-sm text-slate-400">{L('Outbox is empty.', 'আউটবক্স খালি।')}</p>}
          <ul className="space-y-2 max-h-[26rem] overflow-y-auto">
            {outbox.map((o) => (
              <li key={o.id} className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs">
                <div className="text-slate-300">{o.contact} · {nameOf(o.location_id)}</div>
                <p className="text-slate-200 my-1">{o.body}</p>
                <button className={btn} onClick={() => act(() => opsApi.markSent(pin, o.id), L('Marked sent.', 'পাঠানো হয়েছে চিহ্নিত।'))}>{L('Mark sent', 'পাঠানো হয়েছে')}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {section === 'events' && (
        <div className={card}>
          <h2 className="text-sm font-bold text-white mb-3">{L('Alert events', 'সতর্কতা ইভেন্ট')}</h2>
          <ul className="space-y-2 max-h-[28rem] overflow-y-auto">
            {live.events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs">
                <span className="text-slate-200"><b className="uppercase mr-1">{e.severity}</b>{bn ? e.message_bn : e.message_en}</span>
                {e.acknowledged_at ? <span className="text-emerald-400">{L('ack', 'স্বীকৃত')}</span>
                  : <button className={btn} onClick={() => act(() => opsApi.ackEvent(pin, e.id), L('Acknowledged.', 'স্বীকৃত।')).then(live.refresh)}>{L('Acknowledge', 'স্বীকার')}</button>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {section === 'archive' && (
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">{L('Situation report archive', 'পরিস্থিতি প্রতিবেদন আর্কাইভ')}</h2>
            <button className={btn} onClick={() => act(() => opsApi.saveSitrep(pin, sitrepText, language), L('Current SitRep archived.', 'বর্তমান প্রতিবেদন আর্কাইভ হয়েছে।'))}>{L('Archive current SitRep', 'বর্তমান প্রতিবেদন আর্কাইভ করুন')}</button>
          </div>
          {archive.length === 0 && <p className="text-sm text-slate-400">{L('No archived reports.', 'কোনো আর্কাইভ নেই।')}</p>}
          <ul className="space-y-2 max-h-[26rem] overflow-y-auto">
            {archive.map((s) => (
              <li key={s.id}><details className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs">
                <summary className="cursor-pointer text-slate-200">#{s.id} · {s.language.toUpperCase()} · {timeAgo(s.created_at, bn)}</summary>
                <pre className="whitespace-pre-wrap text-[11px] text-slate-300 mt-2">{s.body}</pre>
              </details></li>
            ))}
          </ul>
        </div>
      )}

      {section === 'audit' && (
        <div className={card}>
          <h2 className="text-sm font-bold text-white mb-3">{L('Audit log', 'অডিট লগ')}</h2>
          <ul className="space-y-1 text-xs text-slate-300 max-h-[28rem] overflow-y-auto font-mono">
            {audit.map((a) => <li key={a.id}>{a.created_at.slice(0, 19).replace('T', ' ')} · {a.action}{a.detail ? ` · ${a.detail}` : ''}</li>)}
            {audit.length === 0 && <li className="text-slate-500">{L('No actions recorded.', 'কোনো কাজ রেকর্ড হয়নি।')}</li>}
          </ul>
        </div>
      )}
    </div>
  );
};
