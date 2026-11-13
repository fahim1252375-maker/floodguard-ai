import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BellRing,
  Check,
  Copy,
  Download,
  FileText,
  HeartHandshake,
  Home,
  Lock,
  MapPin,
  Plus,
  Radio,
  Trash2,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertItem, CommunityReport, Language, LocationData } from '../types';
import { CheckinPanel } from '../components/ops/CheckinPanel';
import { LiveFeedPanel } from '../components/ops/LiveFeedPanel';
import { MyAreaPanel, Subscription } from '../components/ops/MyAreaPanel';
import { ResponderDesk } from '../components/ops/ResponderDesk';
import { useOpsLive } from '../hooks/useOpsLive';
import { CheckinStatus, opsApi, ServerForecast, SEVERITY_ORDER } from '../utils/opsApi';
import { getStationWaterLevelTrend } from '../utils/stationTrends';
import { computeEnsembleForecast } from '../utils/ensembleForecast';
import {
  allocateShelters,
  DemandGroup,
  ShelterPool,
} from '../utils/shelterAllocator';
import {
  AlertRule,
  DEFAULT_RULES,
  evaluateRules,
  hitKey,
  METRIC_META,
  RuleMetric,
  RuleSeverity,
} from '../utils/alertRules';
import { downloadTextFile, generateSitrep } from '../utils/sitrep';
import { safeGetItem, safeSetItem, STORAGE_KEYS } from '../utils/storage';

interface OpsCenterViewProps {
  locations: LocationData[];
  alerts: AlertItem[];
  reports: CommunityReport[];
  language: Language;
  myUpazilaId?: string | null;
  onSelectUpazila?: (id: string) => void;
}

type Tab = 'myArea' | 'checkin' | 'live' | 'forecast' | 'shelters' | 'rules' | 'sitrep' | 'desk';
const CITIZEN_TABS: Tab[] = ['myArea', 'checkin', 'live'];

const SEVERITY_STYLE: Record<RuleSeverity, string> = {
  watch: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  warning: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  emergency: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
};

export const OpsCenterView: React.FC<OpsCenterViewProps> = ({
  locations,
  alerts,
  reports,
  language,
  myUpazilaId,
  onSelectUpazila,
}) => {
  const bn = language === 'bn';
  const L = (en: string, b: string) => (bn ? b : en);
  const [tab, setTab] = useState<Tab>('myArea');
  const audience: 'citizen' | 'responder' = CITIZEN_TABS.includes(tab) ? 'citizen' : 'responder';
  const live = useOpsLive();

  const [areaId, setAreaId] = useState<string>(
    myUpazilaId && locations.some((l) => l.id === myUpazilaId) ? myUpazilaId : locations[0]?.id ?? ''
  );
  const changeArea = (id: string) => {
    setAreaId(id);
    onSelectUpazila?.(id);
  };
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>('safe');
  const [subscription, setSubscription] = useState<Subscription | null>(() =>
    safeGetItem<Subscription | null>(STORAGE_KEYS.OPS_SUB_TOKEN, null)
  );
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null);
  const notify = React.useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // Browser notification for a pushed event that matches this user's web subscription
  useEffect(() => {
    const ev = live.latestNew;
    if (!ev || !subscription || subscription.channel !== 'web') return;
    if (ev.station_id !== subscription.locationId) return;
    if (SEVERITY_ORDER[ev.severity] < SEVERITY_ORDER[subscription.minSeverity]) return;
    notify(bn ? ev.message_bn : ev.message_en, 'err');
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`FloodGuard · ${ev.severity.toUpperCase()}`, { body: bn ? ev.message_bn : ev.message_en });
      } catch { /* notifications may require a service worker on some browsers */ }
    }
  }, [live.latestNew]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Ensemble forecast ----------
  const [stationId, setStationId] = useState<string>(locations[0]?.id ?? '');
  const [horizon, setHorizon] = useState<number>(72);
  const station = locations.find((l) => l.id === stationId) ?? locations[0];

  const [serverFc, setServerFc] = useState<ServerForecast | null>(null);
  useEffect(() => {
    if (tab !== 'forecast' || !live.online || !station) {
      setServerFc(null);
      return;
    }
    let cancelled = false;
    opsApi
      .forecast(station.id, horizon)
      .then((r) => !cancelled && setServerFc(r))
      .catch(() => !cancelled && setServerFc(null));
    return () => {
      cancelled = true;
    };
  }, [tab, live.online, station?.id, horizon]); // eslint-disable-line react-hooks/exhaustive-deps

  const forecast = useMemo(() => {
    if (!station) return null;
    if (serverFc?.available && serverFc.result && serverFc.observed?.length) {
      const lastAt = Date.parse(serverFc.observed[serverFc.observed.length - 1].at);
      return {
        source: 'server' as const,
        demoSeed: Boolean(serverFc.includesDemoSeed),
        observed: serverFc.observed.map((o) => ({
          hour: Math.round((Date.parse(o.at) - lastAt) / 3600000),
          level: o.level,
        })),
        result: serverFc.result,
      };
    }
    const points = getStationWaterLevelTrend(station, '7d_monsoon').filter((p) => p.waterLevel !== null);
    const levels = points.map((p) => p.waterLevel as number);
    return {
      source: 'local' as const,
      demoSeed: false,
      observed: levels.map((level, i) => ({ hour: -(levels.length - 1 - i) * 24, level })),
      result: computeEnsembleForecast(levels, { stepHours: 24, horizonHours: horizon, threshold: station.dangerLevel }),
    };
  }, [station, horizon, serverFc]);

  const chartData = useMemo(() => {
    if (!forecast?.result) return [];
    const rows: Record<string, number | null>[] = forecast.observed.map((o) => ({
      hour: o.hour,
      observed: Number(o.level.toFixed(2)),
      mean: null,
      low: null,
      band: null,
    }));
    rows[rows.length - 1].mean = Number(forecast.observed[forecast.observed.length - 1].level.toFixed(2));
    for (const p of forecast.result.points) {
      rows.push({
        hour: p.hour,
        observed: null,
        mean: Number(p.mean.toFixed(2)),
        low: Number(p.low.toFixed(2)),
        band: Number((p.high - p.low).toFixed(2)),
      });
    }
    return rows;
  }, [forecast]);

  // ---------- Shelter allocation ----------
  const [evacShare, setEvacShare] = useState(10);
  const [capPerShelter, setCapPerShelter] = useState(150);
  const [derateCritical, setDerateCritical] = useState(true);
  const [useCheckins, setUseCheckins] = useState(true);

  const shelterModel = useMemo(() => {
    const groups: DemandGroup[] = locations.map((l) => ({
      id: l.id,
      name: bn ? l.nameBn : l.nameEn,
      coordinates: l.coordinates,
      people:
        Math.round(l.populationExposed * (evacShare / 100) * (l.riskScore / 100)) +
        (useCheckins
          ? (live.checkins[l.id]?.need_help?.people ?? 0) + (live.checkins[l.id]?.evacuating?.people ?? 0)
          : 0),
      priority: l.riskScore,
    }));
    const pools: ShelterPool[] = locations.map((l) => ({
      id: l.id,
      name: bn ? l.nameBn : l.nameEn,
      coordinates: l.coordinates,
      capacity: l.sheltersCount * capPerShelter,
      status: derateCritical && l.riskLevel === 'CRITICAL' ? 'AT_RISK' : 'OPERATIONAL',
    }));
    return { groups, pools, result: allocateShelters(groups, pools) };
  }, [locations, evacShare, capPerShelter, derateCritical, useCheckins, live.checkins, bn]);

  const nameOf = (id: string) => shelterModel.groups.find((g) => g.id === id)?.name ?? id;

  // ---------- Alert rules ----------
  const [rules, setRules] = useState<AlertRule[]>(() =>
    safeGetItem<AlertRule[]>(STORAGE_KEYS.ALERT_RULES, DEFAULT_RULES)
  );
  const [notifyOn, setNotifyOn] = useState<boolean>(() =>
    safeGetItem<boolean>(STORAGE_KEYS.OPS_NOTIFY, false)
  );
  const [draft, setDraft] = useState<{
    locationId: string;
    metric: RuleMetric;
    threshold: string;
    severity: RuleSeverity;
  }>({ locationId: 'ALL', metric: 'margin_to_danger', threshold: '0.5', severity: 'warning' });
  const notified = useRef<Set<string>>(new Set());

  const updateRules = (next: AlertRule[]) => {
    setRules(next);
    safeSetItem(STORAGE_KEYS.ALERT_RULES, next);
  };

  const hits = useMemo(() => evaluateRules(rules, locations), [rules, locations]);

  useEffect(() => {
    if (!notifyOn || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }
    for (const hit of hits) {
      const key = hitKey(hit);
      if (notified.current.has(key)) continue;
      notified.current.add(key);
      try {
        new Notification(`FloodGuard · ${hit.severity.toUpperCase()}`, {
          body: bn ? hit.messageBn : hit.messageEn,
        });
      } catch {
        // some browsers only allow notifications via a service worker; ignore
      }
    }
  }, [hits, notifyOn, bn]);

  const toggleNotify = async () => {
    if (notifyOn) {
      setNotifyOn(false);
      safeSetItem(STORAGE_KEYS.OPS_NOTIFY, false);
      return;
    }
    if (typeof Notification === 'undefined') return;
    const permission =
      Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    const on = permission === 'granted';
    setNotifyOn(on);
    safeSetItem(STORAGE_KEYS.OPS_NOTIFY, on);
  };

  const addRule = () => {
    const threshold = Number(draft.threshold);
    if (!Number.isFinite(threshold)) return;
    updateRules([
      ...rules,
      {
        id: `r-${Date.now()}`,
        locationId: draft.locationId,
        metric: draft.metric,
        threshold,
        severity: draft.severity,
        enabled: true,
      },
    ]);
  };

  // ---------- SitRep ----------
  const [copied, setCopied] = useState(false);
  const sitrep = useMemo(
    () =>
      generateSitrep({
        locations,
        alerts,
        reports,
        ruleHits: hits,
        allocation: shelterModel.result,
        generatedAt: new Date(),
        language,
      }),
    [locations, alerts, reports, hits, shelterModel, language]
  );

  const copySitrep = async () => {
    try {
      await navigator.clipboard.writeText(sitrep);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const tabs: { id: Tab; icon: React.ReactNode; en: string; bn: string }[] = [
    { id: 'myArea', icon: <MapPin className="w-4 h-4" />, en: 'My Area', bn: 'আমার এলাকা' },
    { id: 'checkin', icon: <HeartHandshake className="w-4 h-4" />, en: 'Safe Check-in', bn: 'নিরাপদ চেক-ইন' },
    { id: 'live', icon: <Radio className="w-4 h-4" />, en: 'Live Alerts', bn: 'লাইভ সতর্কতা' },
    { id: 'forecast', icon: <Activity className="w-4 h-4" />, en: 'Ensemble Forecast', bn: 'এনসেম্বল পূর্বাভাস' },
    { id: 'shelters', icon: <Home className="w-4 h-4" />, en: 'Shelter Allocation', bn: 'আশ্রয়কেন্দ্র বণ্টন' },
    { id: 'rules', icon: <BellRing className="w-4 h-4" />, en: 'Alert Rules', bn: 'সতর্কতা নিয়ম' },
    { id: 'sitrep', icon: <FileText className="w-4 h-4" />, en: 'SitRep', bn: 'পরিস্থিতি প্রতিবেদন' },
    { id: 'desk', icon: <Lock className="w-4 h-4" />, en: 'Responder Desk', bn: 'রেসপন্ডার ডেস্ক' },
  ];
  const visibleTabs = tabs.filter((t) => CITIZEN_TABS.includes(t.id) === (audience === 'citizen'));

  const cardCls = 'rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5';
  const inputCls =
    'bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-cyan-500/30 p-6 shadow-xl">
        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
          {L('Operations Center', 'অপারেশন সেন্টার')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
          {L('Know. Prepare. Check in. Respond.', 'জানুন। প্রস্তুত হোন। চেক-ইন করুন। সাড়া দিন।')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
          {L(
            'Citizens get a plain-language status for their area, live alerts and a safe check-in. Responders get recorded-data forecasts, shelter planning, alert rules, SitRep archive and an SMS outbox. Backed by a SQLite database and a monitoring engine. Station values may be simulated.',
            'নাগরিকরা নিজের এলাকার সহজ ভাষার অবস্থা, লাইভ সতর্কতা ও নিরাপদ চেক-ইন পান। রেসপন্ডাররা পান রেকর্ডকৃত তথ্যভিত্তিক পূর্বাভাস, আশ্রয়কেন্দ্র পরিকল্পনা, সতর্কতা নিয়ম, প্রতিবেদন আর্কাইভ ও এসএমএস আউটবক্স। SQLite ডেটাবেস ও মনিটরিং ইঞ্জিন চালিত। কেন্দ্রের মান সিমুলেটেড হতে পারে।'
          )}
        </p>
      </div>

      <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900 p-1 text-xs font-semibold" role="group" aria-label={L('Audience', 'ব্যবহারকারীর ধরন')}>
        {(['citizen', 'responder'] as const).map((a) => (
          <button
            key={a}
            aria-pressed={audience === a}
            onClick={() => setTab(a === 'citizen' ? 'myArea' : 'forecast')}
            className={`px-4 py-1.5 rounded-lg ${audience === a ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
          >
            {a === 'citizen' ? L('Citizen', 'নাগরিক') : L('Responder', 'রেসপন্ডার')}
          </button>
        ))}
      </div>

      <div role="tablist" className="flex flex-wrap gap-2">
        {visibleTabs.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              tab === tb.id
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500/50'
            }`}
          >
            {tb.icon}
            {bn ? tb.bn : tb.en}
            {tb.id === 'live' && live.events.length > 0 && (
              <span className="ml-1 px-1.5 rounded-full bg-rose-500 text-white text-[10px]">{live.events.length}</span>
            )}
            {tb.id === 'rules' && hits.length > 0 && (
              <span className="ml-1 px-1.5 rounded-full bg-rose-500 text-white text-[10px]">{hits.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ---------------- CITIZEN PANELS ---------------- */}
      {tab === 'myArea' && (
        <MyAreaPanel
          locations={locations}
          language={language}
          areaId={areaId}
          onAreaChange={changeArea}
          live={live}
          subscription={subscription}
          onSubscriptionChange={setSubscription}
          onCheckin={(st) => {
            setCheckinStatus(st);
            setTab('checkin');
          }}
          notify={notify}
        />
      )}
      {tab === 'checkin' && (
        <CheckinPanel locations={locations} language={language} areaId={areaId} initialStatus={checkinStatus} live={live} notify={notify} />
      )}
      {tab === 'live' && <LiveFeedPanel locations={locations} language={language} areaId={areaId} live={live} />}
      {tab === 'desk' && (
        <ResponderDesk locations={locations} language={language} live={live} sitrepText={sitrep} notify={notify} />
      )}

      {/* ---------------- FORECAST ---------------- */}
      {tab === 'forecast' && station && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className={`${cardCls} lg:col-span-2`}>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <select
                aria-label={L('Station', 'কেন্দ্র')}
                value={station.id}
                onChange={(e) => setStationId(e.target.value)}
                className={inputCls}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {bn ? l.nameBn : l.nameEn}
                  </option>
                ))}
              </select>
              <select
                aria-label={L('Horizon', 'সময়সীমা')}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className={inputCls}
              >
                {[24, 48, 72].map((h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>
              <span className="text-[10px] font-mono text-slate-400">
                {L('80% band · OLS + Holt + damped Holt', '৮০% ব্যান্ড · OLS + Holt + damped Holt')}
              </span>
              {forecast && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    forecast.source === 'server' ? 'border-emerald-500/40 text-emerald-300' : 'border-slate-600 text-slate-400'
                  }`}
                >
                  {forecast.source === 'server'
                    ? forecast.demoSeed
                      ? L('Server history (includes demo seed)', 'সার্ভারের ইতিহাস (ডেমো সিডসহ)')
                      : L('Recorded gauge history', 'রেকর্ডকৃত গেজ ইতিহাস')
                    : L('Simulated 7-day series', 'সিমুলেটেড ৭ দিনের সিরিজ')}
                </span>
              )}
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="hour"
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v: number) => (v === 0 ? L('now', 'এখন') : `${v > 0 ? '+' : ''}${v}h`)}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} unit="m" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                  />
                  <ReferenceLine y={station.dangerLevel} stroke="#f43f5e" strokeDasharray="5 4" label={{ value: L('Danger', 'বিপৎসীমা'), fill: '#fda4af', fontSize: 10 }} />
                  <Area dataKey="low" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} legendType="none" />
                  <Area dataKey="band" stackId="band" stroke="none" fill="#06b6d4" fillOpacity={0.18} isAnimationActive={false} name={L('80% band', '৮০% ব্যান্ড')} />
                  <Line dataKey="observed" name={L('Observed', 'পর্যবেক্ষিত')} stroke="#e2e8f0" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} isAnimationActive={false} />
                  <Line dataKey="mean" name={L('Ensemble mean', 'এনসেম্বল গড়')} stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 2 }} connectNulls isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="text-sm font-bold text-white mb-3">{L('Reading the forecast', 'পূর্বাভাস বোঝা')}</h2>
            {forecast?.result ? (
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li>
                  {L('Trend', 'প্রবণতা')}: <b className="text-white">{forecast.result.trend}</b> ({(forecast.result.slopePerHour * 24).toFixed(2)} m/day)
                </li>
                <li>
                  {L('Model agreement', 'মডেলের ঐকমত্য')}: <b className="text-white">{forecast.result.agreement}</b>
                </li>
                <li>
                  {L('Mean reaches danger level', 'গড় পূর্বাভাস বিপৎসীমা ছোঁয়ার সময়')}:{' '}
                  <b className="text-white">
                    {forecast.result.firstCrossingHour !== null ? `~${forecast.result.firstCrossingHour}h` : L('not within horizon', 'সময়সীমার মধ্যে নয়')}
                  </b>
                </li>
                <li>
                  {L('Crossing ≥20% likely by', '২০%+ সম্ভাবনা থেকে')}:{' '}
                  <b className="text-amber-300">
                    {forecast.result.watchCrossingHour !== null ? `${forecast.result.watchCrossingHour}h` : '—'}
                  </b>
                </li>
                <li>
                  {L('Crossing ≥50% likely by', '৫০%+ সম্ভাবনা থেকে')}:{' '}
                  <b className="text-rose-300">
                    {forecast.result.likelyCrossingHour !== null ? `${forecast.result.likelyCrossingHour}h` : '—'}
                  </b>
                </li>
                <li>
                  {L('Exceedance at horizon', 'শেষ সময়ে ছাড়ানোর সম্ভাবনা')}:{' '}
                  <b className="text-white">
                    {Math.round(forecast.result.points[forecast.result.points.length - 1].exceedProbability * 100)}%
                  </b>
                </li>
              </ul>
            ) : (
              <p className="text-xs text-slate-400">{L('Not enough observations.', 'পর্যাপ্ত পর্যবেক্ষণ নেই।')}</p>
            )}
            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
              {L(
                'Statistical extrapolation of recent gauge readings. It cannot anticipate new rainfall, dam releases or embankment failure. Always defer to official BWDB/FFWC bulletins.',
                'সাম্প্রতিক গেজ রিডিংয়ের পরিসংখ্যানগত এক্সট্রাপোলেশন। নতুন বৃষ্টি, বাঁধ খোলা বা বেড়িবাঁধ ভাঙন আগে থেকে বলতে পারে না। সবসময় বাপাউবো/এফএফডব্লিউসি-র বুলেটিন অনুসরণ করুন।'
              )}
            </p>
          </div>
        </div>
      )}

      {/* ---------------- SHELTERS ---------------- */}
      {tab === 'shelters' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className={cardCls}>
            <h2 className="text-sm font-bold text-white mb-3">{L('Planning assumptions', 'পরিকল্পনার অনুমান')}</h2>
            <label className="block text-xs text-slate-300 mb-3">
              {L('Share of exposed population to evacuate', 'ঝুঁকিপূর্ণ জনসংখ্যার কত অংশ সরানো হবে')}: <b className="text-white">{evacShare}%</b>
              <input type="range" min={1} max={40} value={evacShare} onChange={(e) => setEvacShare(Number(e.target.value))} className="w-full accent-cyan-500" />
            </label>
            <label className="block text-xs text-slate-300 mb-3">
              {L('Capacity per shelter (people)', 'প্রতি আশ্রয়কেন্দ্রের ধারণক্ষমতা (জন)')}: <b className="text-white">{capPerShelter}</b>
              <input type="range" min={50} max={500} step={10} value={capPerShelter} onChange={(e) => setCapPerShelter(Number(e.target.value))} className="w-full accent-cyan-500" />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={derateCritical} onChange={(e) => setDerateCritical(e.target.checked)} className="accent-cyan-500" />
              {L('Halve capacity of shelters in CRITICAL-risk areas', 'অতি ঝুঁকিপূর্ণ এলাকার আশ্রয়কেন্দ্রের ধারণক্ষমতা অর্ধেক ধরুন')}
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 mt-3">
              <input type="checkbox" checked={useCheckins} onChange={(e) => setUseCheckins(e.target.checked)} className="accent-cyan-500" />
              {L('Add live check-ins (need help + evacuating)', 'লাইভ চেক-ইন যোগ করুন (সাহায্য চায় + সরছে)')}
            </label>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              {L(
                'Evacuees = exposed population × share × (risk score / 100). Higher-risk areas are served first, filling the nearest shelters before spilling over. These are illustrative planning numbers, not surveyed capacities.',
                'সরানোর সংখ্যা = ঝুঁকিপূর্ণ জনসংখ্যা × অংশ × (ঝুঁকি স্কোর / ১০০)। বেশি ঝুঁকির এলাকা আগে সেবা পায় এবং কাছের আশ্রয়কেন্দ্র আগে ভরে। এগুলো উদাহরণমূলক পরিকল্পনা সংখ্যা, জরিপকৃত ধারণক্ষমতা নয়।'
              )}
            </p>
          </div>

          <div className={`${cardCls} lg:col-span-2`}>
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              {[
                [L('Evacuees', 'সরানোর সংখ্যা'), shelterModel.result.totals.demand, 'text-white'],
                [L('Placed', 'স্থান হয়েছে'), shelterModel.result.totals.placed, 'text-emerald-300'],
                [L('Unmet', 'অপূর্ণ'), shelterModel.result.totals.unmet, shelterModel.result.totals.unmet > 0 ? 'text-rose-300' : 'text-slate-300'],
              ].map(([label, value, cls]) => (
                <div key={label as string} className="rounded-xl bg-slate-950/60 border border-slate-800 py-2">
                  <div className={`text-lg font-extrabold ${cls}`}>{(value as number).toLocaleString('en-US')}</div>
                  <div className="text-[10px] text-slate-400">{label as string}</div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-1.5 pr-3">{L('Shelter area', 'আশ্রয়কেন্দ্র এলাকা')}</th>
                    <th className="py-1.5 pr-3">{L('Used / usable', 'ব্যবহৃত / ব্যবহারযোগ্য')}</th>
                    <th className="py-1.5 w-40">{L('Load', 'চাপ')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shelterModel.result.utilization.map((u) => (
                    <tr key={u.poolId} className="border-b border-slate-800/60">
                      <td className="py-1.5 pr-3 text-slate-200">{nameOf(u.poolId)}</td>
                      <td className="py-1.5 pr-3 text-slate-300">
                        {u.used.toLocaleString('en-US')} / {u.usable.toLocaleString('en-US')}
                      </td>
                      <td className="py-1.5">
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${u.percent >= 100 ? 'bg-rose-500' : u.percent >= 75 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                            style={{ width: `${Math.min(100, u.percent)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shelterModel.result.unmet.length > 0 && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                <b>{L('Capacity shortfall:', 'ধারণক্ষমতার ঘাটতি:')}</b>{' '}
                {shelterModel.result.unmet.map((u) => `${nameOf(u.groupId)} (${u.people.toLocaleString('en-US')})`).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- RULES ---------------- */}
      {tab === 'rules' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">{L('Your rules', 'আপনার নিয়মসমূহ')}</h2>
              <button
                onClick={toggleNotify}
                disabled={typeof Notification === 'undefined'}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                  notifyOn ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                } disabled:opacity-40`}
              >
                {notifyOn ? L('Browser alerts ON', 'ব্রাউজার সতর্কতা চালু') : L('Enable browser alerts', 'ব্রাউজার সতর্কতা চালু করুন')}
              </button>
            </div>
            <ul className="space-y-2 mb-4">
              {rules.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    aria-label={L('Enable rule', 'নিয়ম চালু')}
                    checked={r.enabled}
                    onChange={() => updateRules(rules.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)))}
                    className="accent-cyan-500"
                  />
                  <span className="flex-1 text-slate-200">
                    {bn ? METRIC_META[r.metric].labelBn : METRIC_META[r.metric].labelEn}{' '}
                    {r.metric === 'margin_to_danger' ? '≤' : '≥'} {r.threshold}
                    {METRIC_META[r.metric].unit}
                    <span className="text-slate-500">
                      {' · '}
                      {r.locationId === 'ALL' ? L('all stations', 'সব কেন্দ্র') : locations.find((l) => l.id === r.locationId)?.nameEn ?? r.locationId}
                    </span>
                  </span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${SEVERITY_STYLE[r.severity]}`}>{r.severity}</span>
                  <button aria-label={L('Delete rule', 'নিয়ম মুছুন')} onClick={() => updateRules(rules.filter((x) => x.id !== r.id))} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
              {rules.length === 0 && <li className="text-xs text-slate-500">{L('No rules yet.', 'এখনও কোনো নিয়ম নেই।')}</li>}
            </ul>

            <div className="rounded-xl border border-slate-800 p-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-300">{L('Add a rule', 'নতুন নিয়ম যোগ করুন')}</div>
              <div className="flex flex-wrap gap-2">
                <select aria-label={L('Station', 'কেন্দ্র')} className={inputCls} value={draft.locationId} onChange={(e) => setDraft({ ...draft, locationId: e.target.value })}>
                  <option value="ALL">{L('All stations', 'সব কেন্দ্র')}</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{bn ? l.nameBn : l.nameEn}</option>
                  ))}
                </select>
                <select aria-label={L('Metric', 'মাপকাঠি')} className={inputCls} value={draft.metric} onChange={(e) => setDraft({ ...draft, metric: e.target.value as RuleMetric })}>
                  {(Object.keys(METRIC_META) as RuleMetric[]).map((m) => (
                    <option key={m} value={m}>{bn ? METRIC_META[m].labelBn : METRIC_META[m].labelEn}</option>
                  ))}
                </select>
                <input aria-label={L('Threshold', 'সীমা')} className={`${inputCls} w-20`} inputMode="decimal" value={draft.threshold} onChange={(e) => setDraft({ ...draft, threshold: e.target.value })} />
                <select aria-label={L('Severity', 'তীব্রতা')} className={inputCls} value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value as RuleSeverity })}>
                  <option value="watch">watch</option>
                  <option value="warning">warning</option>
                  <option value="emergency">emergency</option>
                </select>
                <button onClick={addRule} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold">
                  <Plus className="w-3.5 h-3.5" />
                  {L('Add', 'যোগ')}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">{bn ? METRIC_META[draft.metric].hintBn : METRIC_META[draft.metric].hintEn}</p>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="text-sm font-bold text-white mb-3">
              {L('Firing now', 'এখন সক্রিয়')} ({hits.length})
            </h2>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {hits.map((h) => (
                <li key={hitKey(h)} className={`rounded-xl border px-3 py-2 text-xs ${SEVERITY_STYLE[h.severity]}`}>
                  <b className="uppercase mr-1.5">{h.severity}</b>
                  {bn ? h.messageBn : h.messageEn}
                </li>
              ))}
              {hits.length === 0 && <li className="text-xs text-slate-400">{L('All rules are quiet.', 'সব নিয়ম শান্ত আছে।')}</li>}
            </ul>
            <p className="text-[11px] text-slate-500 mt-3">
              {L('Rules are stored in this browser only and evaluate against the data shown in the app (which may be simulated).', 'নিয়মগুলো শুধু এই ব্রাউজারে সংরক্ষিত এবং অ্যাপে দেখানো উপাত্তের (যা সিমুলেটেড হতে পারে) বিপরীতে মূল্যায়িত হয়।')}
            </p>
          </div>
        </div>
      )}

      {/* ---------------- SITREP ---------------- */}
      {tab === 'sitrep' && (
        <div className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold text-white">{L('Situation report', 'পরিস্থিতি প্রতিবেদন')}</h2>
            <div className="flex gap-2">
              <button onClick={copySitrep} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:border-cyan-500/50">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? L('Copied', 'কপি হয়েছে') : L('Copy', 'কপি')}
              </button>
              <button
                onClick={() => downloadTextFile(sitrep, `floodguard-sitrep-${new Date().toISOString().slice(0, 10)}.md`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                {L('Download .md', '.md ডাউনলোড')}
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300 bg-slate-950/70 border border-slate-800 rounded-xl p-4 max-h-[28rem] overflow-auto font-mono">
            {sitrep}
          </pre>
          <p className="text-[11px] text-slate-500 mt-3">
            {L('Reporter names and contact numbers are never included.', 'প্রতিবেদনকারীর নাম ও যোগাযোগ নম্বর কখনোই অন্তর্ভুক্ত করা হয় না।')}
          </p>
        </div>
      )}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-sm px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl border ${
            toast.kind === 'ok' ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50' : 'bg-rose-950 text-rose-100 border-rose-500/50'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};
