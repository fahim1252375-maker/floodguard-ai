/**
 * Situation Report (SitRep) generator.
 * Produces a plain-text/Markdown briefing a duty officer can paste into email or WhatsApp.
 * Reporter names and contact details are deliberately never included.
 */
import { AlertItem, CommunityReport, LocationData } from '../types';
import { RuleHit } from './alertRules';
import { AllocationResult } from './shelterAllocator';

export interface SitrepInput {
  locations: LocationData[];
  alerts: AlertItem[];
  reports: CommunityReport[];
  ruleHits: RuleHit[];
  allocation: AllocationResult | null;
  generatedAt: Date;
  language: 'en' | 'bn';
}

const RISK_ORDER = { CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1 } as const;

export function generateSitrep(input: SitrepInput): string {
  const { locations, alerts, reports, ruleHits, allocation, generatedAt, language } = input;
  const bn = language === 'bn';
  const L = (en: string, b: string) => (bn ? b : en);

  const stamp = generatedAt.toLocaleString(bn ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const ranked = [...locations].sort(
    (a, b) => RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel] || b.riskScore - a.riskScore
  );
  const aboveDanger = locations.filter((l) => l.currentWaterLevel >= l.dangerLevel);
  const exposed = locations
    .filter((l) => l.riskLevel === 'CRITICAL' || l.riskLevel === 'HIGH')
    .reduce((s, l) => s + l.populationExposed, 0);
  const activeAlerts = alerts.filter((a) => a.severity === 'warning' || a.severity === 'emergency');
  const verified = reports.filter((r) => r.status === 'verified');
  const pending = reports.filter((r) => r.status === 'pending').length;
  const simulatedCount = locations.filter((l) => l.isSimulated).length;

  const out: string[] = [];
  out.push(`# ${L('FloodGuard AI Situation Report', 'ফ্লাডগার্ড এআই পরিস্থিতি প্রতিবেদন')}`);
  out.push(`${L('Generated', 'প্রস্তুতের সময়')}: ${stamp} (BST)`);
  out.push('');
  out.push(`## 1. ${L('Headline', 'সারসংক্ষেপ')}`);
  out.push(
    L(
      `- ${aboveDanger.length} of ${locations.length} monitored stations are at or above danger level.`,
      `- ${locations.length}টি পর্যবেক্ষণ কেন্দ্রের মধ্যে ${aboveDanger.length}টি বিপৎসীমা বা তার উপরে।`
    )
  );
  out.push(
    L(
      `- Population in CRITICAL/HIGH-risk areas (modelled exposure): ${exposed.toLocaleString('en-US')}.`,
      `- অতি উচ্চ/উচ্চ ঝুঁকির এলাকায় ঝুঁকিপূর্ণ জনসংখ্যা (আনুমানিক): ${exposed.toLocaleString('en-US')}।`
    )
  );
  out.push(
    L(
      `- ${activeAlerts.length} warning/emergency bulletins active; ${ruleHits.length} custom alert rules firing.`,
      `- ${activeAlerts.length}টি সতর্কতা/জরুরি বিজ্ঞপ্তি সক্রিয়; ${ruleHits.length}টি কাস্টম নিয়ম সক্রিয়।`
    )
  );
  out.push('');

  out.push(`## 2. ${L('Stations by risk', 'ঝুঁকি অনুযায়ী কেন্দ্র')}`);
  out.push(
    L(
      '| Station | River | Level (m) | Danger (m) | 24h change (m) | Risk |',
      '| কেন্দ্র | নদী | স্তর (মি) | বিপৎসীমা (মি) | ২৪ঘ পরিবর্তন (মি) | ঝুঁকি |'
    )
  );
  out.push('|---|---|---|---|---|---|');
  for (const l of ranked) {
    const sign = l.waterLevelChange24h > 0 ? '+' : '';
    out.push(
      `| ${bn ? l.nameBn : l.nameEn} | ${bn ? l.riverNameBn : l.riverNameEn} | ${l.currentWaterLevel.toFixed(2)} | ${l.dangerLevel.toFixed(2)} | ${sign}${l.waterLevelChange24h.toFixed(2)} | ${l.riskLevel} (${l.riskScore}) |`
    );
  }
  out.push('');

  out.push(`## 3. ${L('Custom alert rules firing', 'সক্রিয় কাস্টম নিয়ম')}`);
  if (ruleHits.length === 0) out.push(L('- None.', '- কোনোটি নয়।'));
  for (const h of ruleHits.slice(0, 12)) {
    out.push(`- [${h.severity.toUpperCase()}] ${bn ? h.messageBn : h.messageEn}`);
  }
  out.push('');

  out.push(`## 4. ${L('Shelter allocation (planning model)', 'আশ্রয়কেন্দ্র বণ্টন (পরিকল্পনা মডেল)')}`);
  if (!allocation) {
    out.push(L('- Not computed.', '- হিসাব করা হয়নি।'));
  } else {
    const t = allocation.totals;
    out.push(
      L(
        `- Planned evacuees: ${t.demand.toLocaleString('en-US')}; placed: ${t.placed.toLocaleString('en-US')} (${t.coveragePercent}% coverage); unmet: ${t.unmet.toLocaleString('en-US')}.`,
        `- পরিকল্পিত সরানোর সংখ্যা: ${t.demand.toLocaleString('en-US')}; স্থান হয়েছে: ${t.placed.toLocaleString('en-US')} (${t.coveragePercent}%); অপূর্ণ: ${t.unmet.toLocaleString('en-US')}।`
      )
    );
  }
  out.push('');

  out.push(`## 5. ${L('Field reports', 'মাঠ পর্যায়ের রিপোর্ট')}`);
  out.push(
    L(
      `- ${verified.length} verified, ${pending} pending moderation.`,
      `- ${verified.length}টি যাচাইকৃত, ${pending}টি যাচাইয়ের অপেক্ষায়।`
    )
  );
  for (const r of verified.slice(0, 8)) {
    out.push(
      `- ${r.villageOrArea}, ${bn ? r.upazilaBn : r.upazilaEn}: ${r.waterDepthValue} ${r.waterDepthUnit}, ${r.waterTrend.replace(/_/g, ' ')}, road ${r.roadCondition.replace(/_/g, ' ')}`
    );
  }
  out.push('');

  out.push(`## ${L('Data caveats', 'তথ্যের সীমাবদ্ধতা')}`);
  out.push(
    L(
      `- ${simulatedCount} of ${locations.length} station readings are simulated/calibrated, not live gauge feeds. Verify with BWDB/FFWC before acting.`,
      `- ${locations.length}টির মধ্যে ${simulatedCount}টি কেন্দ্রের উপাত্ত সিমুলেটেড/ক্যালিব্রেটেড, সরাসরি গেজ নয়। ব্যবস্থা নেওয়ার আগে বাপাউবো/এফএফডব্লিউসি-র সাথে যাচাই করুন।`
    )
  );
  out.push(
    L(
      '- Forecasts are statistical extrapolations and shelter figures use adjustable planning assumptions.',
      '- পূর্বাভাস পরিসংখ্যানগত এক্সট্রাপোলেশন এবং আশ্রয়কেন্দ্রের সংখ্যা পরিবর্তনযোগ্য পরিকল্পনা অনুমানভিত্তিক।'
    )
  );
  out.push(L('- Emergency contacts: 999 / 16263.', '- জরুরি যোগাযোগ: ৯৯৯ / ১৬২৬৩।'));
  return out.join('\n');
}

export function downloadTextFile(content: string, fileName: string, mime = 'text/markdown'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
