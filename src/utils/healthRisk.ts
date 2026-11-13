/**
 * Health Risk & Waterborne Disease Assessment Utility
 * Computes location-specific disease vulnerability during monsoonal flood events.
 * Connects hydrological flood severity to community healthcare crises.
 */

export type HealthRiskTier = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export type DiseaseType =
  | 'diarrhoea_cholera'
  | 'typhoid'
  | 'skin_infection'
  | 'snakebite';

export interface DiseaseAssessment {
  id: DiseaseType;
  nameEn: string;
  nameBn: string;
  score: number; // 0 to 100
  tier: HealthRiskTier;
  transmissionMechanismEn: string;
  transmissionMechanismBn: string;
  preventiveAdviceEn: string;
  preventiveAdviceBn: string;
}

export interface HealthRiskInput {
  district: string;
  upazilaEn: string;
  upazilaBn: string;
  floodRiskScore: number; // 0 to 100
  waterLevel: number; // in meters MSL
  dangerLevel: number; // in meters MSL
  standingWaterDays?: number; // Days flooded
  displacedPopulation?: number; // Estimated persons displaced
  shelterCrowdingRatio?: number; // 0.0 to 1.5+ (1.0 = at capacity)
}

export interface HealthRiskOutput {
  upazilaEn: string;
  upazilaBn: string;
  district: string;
  overallScore: number; // 0 to 100
  overallTier: HealthRiskTier;
  standingWaterDays: number;
  displacedPopulationEstimate: number;
  shelterCrowdingRatio: number;
  diseaseBreakdown: DiseaseAssessment[];
  diseases?: {
    cholera: { score: number; tier: HealthRiskTier };
    typhoid: { score: number; tier: HealthRiskTier };
    skin: { score: number; tier: HealthRiskTier };
    snakebite: { score: number; tier: HealthRiskTier };
  };
  topFactorsEn: string[];
  topFactorsBn: string[];
  recommendedActionsEn: string[];
  recommendedActionsBn: string[];
}

export interface ShelterMedicalItem {
  id: string;
  shelterNameEn: string;
  shelterNameBn: string;
  upazilaEn: string;
  capacity: number;
  currentOccupancy: number;
  orsSachets: number;
  orsTarget: number;
  cleanWaterLitres: number;
  waterTargetLitres: number;
  firstAidKits: number;
  firstAidTarget: number;
  antivenomAvailable: boolean;
  nearestClinicEn: string;
  nearestClinicBn: string;
  clinicDistanceKm: number;
  clinicAccessStatus: 'PASSABLE' | 'WATERLOGGED' | 'CUT_OFF';
  shortageFlag: boolean;
  shortageReasonsEn: string[];
  shortageReasonsBn: string[];
}

/**
 * Derives days of standing water if not explicitly supplied
 */
export function estimateStandingWaterDays(waterLevel: number, dangerLevel: number): number {
  const delta = waterLevel - dangerLevel;
  if (delta > 1.2) return 6;
  if (delta > 0.6) return 4;
  if (delta > 0) return 2;
  if (delta > -0.5) return 1;
  return 0;
}

/**
 * Derives displaced population estimate from flood risk score and location baseline
 */
export function estimateDisplacedPopulation(floodRiskScore: number): number {
  if (floodRiskScore >= 80) return Math.round(18000 + (floodRiskScore - 80) * 1200);
  if (floodRiskScore >= 60) return Math.round(7500 + (floodRiskScore - 60) * 450);
  if (floodRiskScore >= 40) return Math.round(2000 + (floodRiskScore - 40) * 200);
  return Math.round(floodRiskScore * 35);
}

/**
 * Computes Waterborne Disease Risk Index
 */
export function computeHealthRisk(input: HealthRiskInput): HealthRiskOutput {
  const standingDays =
    input.standingWaterDays != null
      ? input.standingWaterDays
      : estimateStandingWaterDays(input.waterLevel, input.dangerLevel);

  const displaced =
    input.displacedPopulation != null
      ? input.displacedPopulation
      : estimateDisplacedPopulation(input.floodRiskScore);

  const crowding =
    input.shelterCrowdingRatio != null
      ? Math.max(0, input.shelterCrowdingRatio)
      : Math.min(1.4, Number((input.floodRiskScore / 75).toFixed(2)));

  // 1. Diarrhoea & Cholera (heavily influenced by submerged tube wells & days of flood)
  // Tube wells submerge rapidly when river breaches danger level
  const choleraScore = Math.min(
    100,
    Math.round(
      input.floodRiskScore * 0.45 +
        standingDays * 5.5 +
        crowding * 25 +
        (input.waterLevel > input.dangerLevel ? 15 : 0)
    )
  );

  // 2. Typhoid Fever (fecal-oral water contamination in inundated settlements)
  const typhoidScore = Math.min(
    100,
    Math.round(
      input.floodRiskScore * 0.35 +
        standingDays * 6.0 +
        crowding * 20 +
        (displaced > 5000 ? 10 : 0)
    )
  );

  // 3. Waterlogged Dermatitis & Skin Infections (prolonged wading in stagnant water)
  const skinScore = Math.min(
    100,
    Math.round(
      standingDays * 11.0 +
        input.floodRiskScore * 0.25 +
        (input.waterLevel > input.dangerLevel ? 10 : 0)
    )
  );

  // 4. Snakebite Envenomation (Meghalaya runoff displaces cobras & kraits to high ground/roofs)
  const snakebiteScore = Math.min(
    100,
    Math.round(
      (input.waterLevel > input.dangerLevel ? 35 : 15) +
        input.floodRiskScore * 0.35 +
        (standingDays >= 2 ? 15 : 5)
    )
  );

  const overallScore = Math.min(
    100,
    Math.round(
      choleraScore * 0.35 +
        typhoidScore * 0.25 +
        skinScore * 0.2 +
        snakebiteScore * 0.2
    )
  );

  const overallTier: HealthRiskTier =
    overallScore >= 75
      ? 'SEVERE'
      : overallScore >= 55
      ? 'HIGH'
      : overallScore >= 35
      ? 'MODERATE'
      : 'LOW';

  const getTier = (s: number): HealthRiskTier =>
    s >= 75 ? 'SEVERE' : s >= 55 ? 'HIGH' : s >= 35 ? 'MODERATE' : 'LOW';

  const diseaseBreakdown: DiseaseAssessment[] = [
    {
      id: 'diarrhoea_cholera',
      nameEn: 'Acute Diarrhoea & Cholera',
      nameBn: 'ডায়রিয়া ও কলেরা',
      score: choleraScore,
      tier: getTier(choleraScore),
      transmissionMechanismEn: 'Submerged shallow tube wells and fecal contamination in stagnant backwater sinks.',
      transmissionMechanismBn: 'তলিয়ে যাওয়া অগভীর নলকূপ ও জমে থাকা দূষিত পানির কারণে সংক্রমণ।',
      preventiveAdviceEn: 'Boil drinking water, or use water purification tablets exactly as the product label says. Drink ORS immediately upon loose motion.',
      preventiveAdviceBn: 'পানীয় জল ফুটিয়ে পান করুন বা পানি বিশুদ্ধকরণ ট্যাবলেট প্যাকেটের নির্দেশনা অনুযায়ী ব্যবহার করুন। পাতলা পায়খানা শুরু হলে তৎক্ষণাৎ খাবার স্যালাইন গ্রহণ করুন।',
    },
    {
      id: 'typhoid',
      nameEn: 'Enteric Typhoid Fever',
      nameBn: 'টাইফয়েড জ্বর',
      score: typhoidScore,
      tier: getTier(typhoidScore),
      transmissionMechanismEn: 'Salmonella enterica spread through flooded food stores and unwashed utensils.',
      transmissionMechanismBn: 'বন্যা কবলিত খাদ্য ও দূষিত পাত্রের মাধ্যমে সালমোনেলা জীবাণু বিস্তার।',
      preventiveAdviceEn: 'Consume only hot freshly cooked food; wash food utensils with boiled or treated water.',
      preventiveAdviceBn: 'শুধুমাত্র গরম ও সদ্য রান্না করা খাবার খান; পরিষ্কার ফুটানো পানি দিয়ে বাসনপত্র ধুয়ে নিন।',
    },
    {
      id: 'skin_infection',
      nameEn: 'Waterlogged Dermatitis & Fungal Infections',
      nameBn: 'চর্মরোগ ও ছত্রাক সংক্রমণ',
      score: skinScore,
      tier: getTier(skinScore),
      transmissionMechanismEn: 'Prolonged epidermal immersion in sewage-laden stagnant floodwaters causing maceration.',
      transmissionMechanismBn: 'দীর্ঘসময় পচা ও দূষিত পানিতে পা বা শরীর ভিজে থাকার ফলে ত্বকের সংক্রমণ।',
      preventiveAdviceEn: 'Keep limbs dry after wading; apply antiseptic powder or clean petroleum jelly to vulnerable skin folds.',
      preventiveAdviceBn: 'পানি থেকে উঠেই পরিষ্কার পানি দিয়ে ধুয়ে শুকনো করুন; চর্মরোগ নিরোধক মলম বা পাউডার ব্যবহার করুন।',
    },
    {
      id: 'snakebite',
      nameEn: 'Snakebite Envenomation',
      nameBn: 'সাপের কামড়',
      score: snakebiteScore,
      tier: getTier(snakebiteScore),
      transmissionMechanismEn: 'Displaced venomous snakes (common krait, monocled cobra) migrating to high homesteads and boats.',
      transmissionMechanismBn: 'পাহাড়ি ঢলে বাসস্থান হারানো বিষধর সাপ (কালাচ ও গোখরা) শুকনো ভিটায় আশ্রয় নেয়।',
      preventiveAdviceEn: 'Carry torches at night; inspect sleeping mats and stacked firewood; never attempt tourniquets or cuts if bitten—rush to Upazila clinic for anti-venom.',
      preventiveAdviceBn: 'রাতে চলাচলে টর্চ ব্যবহার করুন; বিছানা ও জ্বালানি কাঠ পরীক্ষা করুন। কামড়ালে বাঁধন বা কাটবেন না—সরাসরি উপজেলা স্বাস্থ্য কমপ্লেক্সে নিয়ে যান।',
    },
  ];

  // Derive top 3 plain language contributing factors
  const factorsEn: string[] = [];
  const factorsBn: string[] = [];

  if (input.waterLevel > input.dangerLevel) {
    factorsEn.push(`River stage is ${(input.waterLevel - input.dangerLevel).toFixed(2)}m above the official Danger Level, inundating local tube wells.`);
    factorsBn.push(`নদীর পানি বিপদসীমার ${(input.waterLevel - input.dangerLevel).toFixed(2)} মিটার ওপর দিয়ে প্রবাহিত হওয়ায় নলকূপ তলিয়ে গেছে।`);
  } else if (input.waterLevel > input.dangerLevel - 0.5) {
    factorsEn.push('River stage approaching danger mark with rapid seepage into low-lying settlements.');
    factorsBn.push('নদীর পানি বিপদসীমার কাছাকাছি পৌঁছানোয় নিচু এলাকায় পানি প্রবেশ করছে।');
  } else {
    factorsEn.push('River stage currently contained within embankments with minimal bank overflow.');
    factorsBn.push('নদীর পানি বর্তমানে বাঁধের ভেতরে রয়েছে এবং উপচে পড়ার ঝুঁকি কম।');
  }

  if (standingDays >= 3) {
    factorsEn.push(`${standingDays} days of standing floodwaters accumulating organic sewage and bacterial pathogens.`);
    factorsBn.push(`${standingDays} দিন ধরে জমে থাকা পানিতে জীবাণু ও দূষণের মাত্রা মারাত্মকভাবে বৃদ্ধি পেয়েছে।`);
  } else {
    factorsEn.push('Active inflow of fresh mountain runoff carrying debris and silt across village paths.');
    factorsBn.push('পাহাড়ি ঢলের তীব্র স্রোতে পলি ও ময়লা ছড়িয়ে পড়ছে।');
  }

  if (crowding >= 1.0) {
    factorsEn.push(`Emergency shelters operating over capacity (${Math.round(crowding * 100)}% density), elevating respiratory and enteric cross-transmission.`);
    factorsBn.push(`আশ্রয়কেন্দ্রে ধারণক্ষমতার অতিরিক্ত ভিড় (${Math.round(crowding * 100)}%), যা পানিবাহিত রোগ দ্রুত ছড়াতে পারে।`);
  } else if (displaced > 5000) {
    factorsEn.push(`Over ${displaced.toLocaleString()} displaced persons living in temporary dry perches with limited sanitation.`);
    factorsBn.push(`${displaced.toLocaleString()}-এর বেশি মানুষ অস্থায়ী শুকনো স্থানে অস্বাস্থ্যকর পরিবেশে অবস্থান করছেন।`);
  } else {
    factorsEn.push('Localized displacement of families toward union embankment corridors.');
    factorsBn.push('বাঁধ সংলগ্ন এলাকায় পরিবারগুলোর সাময়িক স্থানান্তর।');
  }

  // Recommended mitigation actions
  const recommendedActionsEn = [
    'Pre-position 5,000 ORS sachets and water purification chlorine tablets at designated union shelters.',
    'Stock polyvalent antivenom vials at the nearest Upazila Health Complex.',
    'Dispatch mobile medical teams with waterborne disease antibiotics and antiseptic dressing kits.',
  ];

  const recommendedActionsBn = [
    'ইউনিয়ন আশ্রয়কেন্দ্রে জরুরি ভিত্তিতে খাবার স্যালাইন ও পানি বিশুদ্ধকরণ ট্যাবলেট মজুত করুন।',
    'নিকটস্থ উপজেলা স্বাস্থ্য কমপ্লেক্সে অ্যান্টিভেনম ভায়াল প্রস্তুত রাখুন।',
    'মাঠ পর্যায়ে ভ্রাম্যমাণ মেডিকেল টিম এবং প্রাথমিক চিকিৎসার সামগ্রী প্রেরণ করুন।',
  ];

  return {
    upazilaEn: input.upazilaEn,
    upazilaBn: input.upazilaBn,
    district: input.district,
    overallScore,
    overallTier,
    standingWaterDays: standingDays,
    displacedPopulationEstimate: displaced,
    shelterCrowdingRatio: crowding,
    diseaseBreakdown,
    diseases: {
      cholera: { score: choleraScore, tier: getTier(choleraScore) },
      typhoid: { score: typhoidScore, tier: getTier(typhoidScore) },
      skin: { score: skinScore, tier: getTier(skinScore) },
      snakebite: { score: snakebiteScore, tier: getTier(snakebiteScore) },
    },
    topFactorsEn: factorsEn.slice(0, 3),
    topFactorsBn: factorsBn.slice(0, 3),
    recommendedActionsEn,
    recommendedActionsBn,
  };
}

export interface HealthRiskProjectionPoint {
  hourOffset: number;
  hourLabel: string;
  projectedWaterLevel: number;
  projectedFloodRisk: number;
  overallHealthScore: number;
  overallTier: HealthRiskTier;
  choleraScore: number;
  typhoidScore: number;
  skinScore: number;
  snakebiteScore: number;
}

export interface HealthRiskProjectionResult {
  timeline: HealthRiskProjectionPoint[];
  peakHourOffset: number;
  peakHourLabel: string;
  peakScore: number;
  peakTier: HealthRiskTier;
  peakSummaryEn: string;
  peakSummaryBn: string;
}

/**
 * Computes 48-hour forward projection of waterborne disease vulnerability.
 * Derives risk trajectory across +0h, +12h, +24h, +36h, +48h.
 */
export function computeHealthRiskProjection(
  location: {
    district: string;
    nameEn: string;
    nameBn: string;
    currentWaterLevel: number;
    dangerLevel: number;
    warningLevel?: number;
    riskScore: number;
    rateOfRise24h?: number;
  },
  customHourlyStages?: { hour: number; projectedLevel: number }[]
): HealthRiskProjectionResult {
  const hours = [0, 12, 24, 36, 48];
  // If 24h change is not recorded, assume 0 m/day (steady stage) rather than assuming rise
  const ratePerDay = location.rateOfRise24h ?? 0;
  const wl = location.warningLevel ?? (location.dangerLevel - 0.5);

  const baseStandingDays = estimateStandingWaterDays(
    location.currentWaterLevel,
    location.dangerLevel
  );

  const timeline: HealthRiskProjectionPoint[] = hours.map((hour) => {
    let projectedLevel: number;

    const matchedCustom = customHourlyStages?.find((c) => c.hour === hour);
    if (matchedCustom) {
      projectedLevel = matchedCustom.projectedLevel;
    } else {
      projectedLevel = Number(
        (location.currentWaterLevel + (hour / 24) * ratePerDay).toFixed(2)
      );
    }

    // Adjust flood risk based on projected water level relative to danger mark
    const deltaDL = projectedLevel - location.dangerLevel;
    const deltaWL = projectedLevel - wl;

    let projectedRisk = location.riskScore;
    if (deltaDL >= 0.5) projectedRisk = Math.max(projectedRisk, 88 + Math.round(deltaDL * 10));
    else if (deltaDL >= 0) projectedRisk = Math.max(projectedRisk, 75 + Math.round(deltaDL * 20));
    else if (deltaWL >= 0) projectedRisk = Math.max(projectedRisk, 50 + Math.round(deltaWL * 35));
    else projectedRisk = Math.max(15, projectedRisk + Math.round((hour / 24) * (ratePerDay > 0 ? 5 : -5)));

    projectedRisk = Math.min(100, Math.max(0, projectedRisk));

    // Standing water accumulates over time if water is near or above danger level
    const additionalDays = projectedLevel >= wl ? Math.floor(hour / 24) : 0;
    const standingDays = Math.min(10, baseStandingDays + additionalDays);

    const assessment = computeHealthRisk({
      district: location.district,
      upazilaEn: location.nameEn,
      upazilaBn: location.nameBn,
      floodRiskScore: projectedRisk,
      waterLevel: projectedLevel,
      dangerLevel: location.dangerLevel,
      standingWaterDays: standingDays,
    });

    const cholera = assessment.diseaseBreakdown.find((d) => d.id === 'diarrhoea_cholera')?.score ?? 0;
    const typhoid = assessment.diseaseBreakdown.find((d) => d.id === 'typhoid')?.score ?? 0;
    const skin = assessment.diseaseBreakdown.find((d) => d.id === 'skin_infection')?.score ?? 0;
    const snake = assessment.diseaseBreakdown.find((d) => d.id === 'snakebite')?.score ?? 0;

    return {
      hourOffset: hour,
      hourLabel: `+${hour}h`,
      projectedWaterLevel: projectedLevel,
      projectedFloodRisk: projectedRisk,
      overallHealthScore: assessment.overallScore,
      overallTier: assessment.overallTier,
      choleraScore: cholera,
      typhoidScore: typhoid,
      skinScore: skin,
      snakebiteScore: snake,
    };
  });

  let peakPoint = timeline[0];
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].overallHealthScore > peakPoint.overallHealthScore) {
      peakPoint = timeline[i];
    }
  }

  const peakScore = peakPoint.overallHealthScore;
  const peakHourOffset = peakPoint.hourOffset;
  const peakTier = peakPoint.overallTier;
  const peakHourLabel = `+${peakHourOffset}h`;

  let tierNameBn = 'নিম্ন';
  if (peakTier === 'SEVERE') tierNameBn = 'মারাত্মক';
  else if (peakTier === 'HIGH') tierNameBn = 'উচ্চ';
  else if (peakTier === 'MODERATE') tierNameBn = 'মাঝারি';

  const peakSummaryEn =
    peakHourOffset === 0
      ? `Waterborne disease risk is currently at its crest (${peakTier}, ${peakScore}/100); urgent sanitation intervention active.`
      : `Diarrhoeal & waterborne risk is expected to reach ${peakTier} (${peakScore}/100) around ${peakHourLabel}.`;

  const peakSummaryBn =
    peakHourOffset === 0
      ? `পানিবাহিত স্বাস্থ্যঝুঁকি বর্তমানে সর্বোচ্চ চূড়ায় রয়েছে (${tierNameBn}, ${peakScore}/১০০); জরুরি স্যানিটেশন পদক্ষেপ আবশ্যক।`
      : `ডায়রিয়া ও পানিবাহিত স্বাস্থ্যঝুঁকি ${peakHourLabel} সময়ের মধ্যে ${tierNameBn} (${peakScore}/১০০) পর্যায়ে পৌঁছানোর আশঙ্কা রয়েছে।`;

  return {
    timeline,
    peakHourOffset,
    peakHourLabel,
    peakScore,
    peakTier,
    peakSummaryEn,
    peakSummaryBn,
  };
}

/**
 * Sample shelter medical inventory with access status
 * Labeled clearly as SIMULATED SAMPLE DATA
 */
export const SAMPLE_SHELTER_MEDICAL_BOARD: ShelterMedicalItem[] = [
  {
    id: 'sh-med-01',
    shelterNameEn: 'Gowainghat Govt. High School Shelter',
    shelterNameBn: 'গোয়াইনঘাট সরকারি উচ্চ বিদ্যালয় আশ্রয়কেন্দ্র',
    upazilaEn: 'Gowainghat',
    capacity: 650,
    currentOccupancy: 720,
    orsSachets: 420,
    orsTarget: 1200,
    cleanWaterLitres: 1600,
    waterTargetLitres: 3500,
    firstAidKits: 4,
    firstAidTarget: 10,
    antivenomAvailable: false,
    nearestClinicEn: 'Gowainghat Upazila Health Complex',
    nearestClinicBn: 'গোয়াইনঘাট উপজেলা স্বাস্থ্য কমপ্লেক্স',
    clinicDistanceKm: 2.1,
    clinicAccessStatus: 'WATERLOGGED',
    shortageFlag: true,
    shortageReasonsEn: ['Low ORS supply (35% of target)', 'Clean drinking water shortage (45% of need)'],
    shortageReasonsBn: ['খাবার স্যালাইনের তীব্র সংকট (প্রয়োজনের ৩৫%)', 'বিশুদ্ধ খাবার পানির ঘাটতি'],
  },
  {
    id: 'sh-med-02',
    shelterNameEn: 'Kanaighat Model Primary School',
    shelterNameBn: 'কানাইঘাট মডেল প্রাথমিক বিদ্যালয়',
    upazilaEn: 'Kanaighat',
    capacity: 450,
    currentOccupancy: 380,
    orsSachets: 980,
    orsTarget: 900,
    cleanWaterLitres: 4200,
    waterTargetLitres: 2500,
    firstAidKits: 12,
    firstAidTarget: 8,
    antivenomAvailable: true,
    nearestClinicEn: 'Kanaighat Upazila Health Complex',
    nearestClinicBn: 'কানাইঘাট উপজেলা স্বাস্থ্য কমপ্লেক্স',
    clinicDistanceKm: 1.4,
    clinicAccessStatus: 'PASSABLE',
    shortageFlag: false,
    shortageReasonsEn: [],
    shortageReasonsBn: [],
  },
  {
    id: 'sh-med-03',
    shelterNameEn: 'Tahirpur Hazi Joynal Abedin College',
    shelterNameBn: 'তাহিরপুর হাজী জয়নাল আবেদিন কলেজ',
    upazilaEn: 'Tahirpur',
    capacity: 800,
    currentOccupancy: 860,
    orsSachets: 310,
    orsTarget: 1500,
    cleanWaterLitres: 1200,
    waterTargetLitres: 4000,
    firstAidKits: 3,
    firstAidTarget: 12,
    antivenomAvailable: false,
    nearestClinicEn: 'Tahirpur Upazila Health Complex',
    nearestClinicBn: 'তাহিরপুর উপজেলা স্বাস্থ্য কমপ্লেক্স',
    clinicDistanceKm: 4.8,
    clinicAccessStatus: 'CUT_OFF',
    shortageFlag: true,
    shortageReasonsEn: ['Road to clinic completely submerged / cut-off', 'Critically low drinking water'],
    shortageReasonsBn: ['ক্লিনিকে যাওয়ার সড়ক সম্পূর্ণ নিমজ্জিত', 'পানীয় জলের তীব্র সংকট'],
  },
  {
    id: 'sh-med-04',
    shelterNameEn: 'Sunamganj Jubillee Govt. High School',
    shelterNameBn: 'সুনামগঞ্জ জুবিলী সরকারি উচ্চ বিদ্যালয়',
    upazilaEn: 'Sunamganj Sadar',
    capacity: 1200,
    currentOccupancy: 950,
    orsSachets: 2400,
    orsTarget: 2000,
    cleanWaterLitres: 8500,
    waterTargetLitres: 6000,
    firstAidKits: 22,
    firstAidTarget: 15,
    antivenomAvailable: true,
    nearestClinicEn: 'Sunamganj 250-Bed District Sadar Hospital',
    nearestClinicBn: 'সুনামগঞ্জ ২৫০ শয্যা জেলা সদর হাসপাতাল',
    clinicDistanceKm: 1.2,
    clinicAccessStatus: 'PASSABLE',
    shortageFlag: false,
    shortageReasonsEn: [],
    shortageReasonsBn: [],
  },
  {
    id: 'sh-med-05',
    shelterNameEn: 'Chhatak Multi-purpose Cyclone Shelter',
    shelterNameBn: 'ছাতক বহুমুখী আশ্রয়কেন্দ্র',
    upazilaEn: 'Chhatak',
    capacity: 550,
    currentOccupancy: 610,
    orsSachets: 490,
    orsTarget: 1100,
    cleanWaterLitres: 2100,
    waterTargetLitres: 3200,
    firstAidKits: 5,
    firstAidTarget: 8,
    antivenomAvailable: false,
    nearestClinicEn: 'Chhatak Upazila Health Complex',
    nearestClinicBn: 'ছাতক উপজেলা স্বাস্থ্য কমপ্লেক্স',
    clinicDistanceKm: 3.5,
    clinicAccessStatus: 'WATERLOGGED',
    shortageFlag: true,
    shortageReasonsEn: ['No on-site antivenom; ambulance route waterlogged'],
    shortageReasonsBn: ['অ্যান্টিভেনম নেই; অ্যাম্বুলেন্স পথ জলাবদ্ধ'],
  },
];
