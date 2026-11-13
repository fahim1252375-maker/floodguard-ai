import { LocationData, PredictionInput, PredictionResult, RiskLevel, ContributingFactor } from '../types';

/**
 * Hydrological Risk Prediction Engine
 * Transparent, multi-factor baseline model based on Bangladesh Water Development Board (BWDB)
 * and Flood Forecasting and Warning Centre (FFWC) threshold guidelines.
 */
export function calculateFloodRisk(
  input: PredictionInput,
  location?: LocationData
): PredictionResult {
  const dangerLevel = location ? location.dangerLevel : 10.5;
  const warningLevel = location ? location.warningLevel : dangerLevel - 0.5;

  const currentLevel = input.waterLevelM;
  const levelDiffDanger = currentLevel - dangerLevel;
  const levelDiffWarning = currentLevel - warningLevel;

  // 1. Water Level Score (0 - 40 pts)
  let waterLevelScore = 0;
  if (currentLevel < warningLevel - 1.0) {
    waterLevelScore = Math.max(5, (currentLevel / warningLevel) * 15);
  } else if (currentLevel < warningLevel) {
    waterLevelScore = 15 + ((currentLevel - (warningLevel - 1.0)) / 1.0) * 10;
  } else if (currentLevel < dangerLevel) {
    waterLevelScore = 25 + ((currentLevel - warningLevel) / (dangerLevel - warningLevel)) * 8;
  } else {
    // Above danger level
    const excess = currentLevel - dangerLevel;
    waterLevelScore = 33 + Math.min(7, excess * 7); // Max 40
  }

  // 2. Rainfall Accumulation Score (0 - 30 pts)
  let rainfallScore = 0;
  const rf = input.rainfallMm;
  if (rf <= 20) {
    rainfallScore = (rf / 20) * 5;
  } else if (rf <= 60) {
    rainfallScore = 5 + ((rf - 20) / 40) * 10;
  } else if (rf <= 130) {
    rainfallScore = 15 + ((rf - 60) / 70) * 8;
  } else {
    rainfallScore = 23 + Math.min(7, ((rf - 130) / 120) * 7);
  }

  // 3. Water Level Rate of Change (0 - 15 pts)
  let rateScore = 0;
  const delta = input.waterLevelChangeM;
  if (delta > 0.8) {
    rateScore = 15; // Rapid surging river
  } else if (delta > 0.4) {
    rateScore = 11;
  } else if (delta > 0.1) {
    rateScore = 7;
  } else if (delta >= -0.1) {
    rateScore = 4;
  } else {
    rateScore = 1; // Receding
  }

  // 4. Upstream Catchment & Runoff (Cherrapunji / Meghalaya) (0 - 15 pts)
  const upstreamRf = input.upstreamRainfallMm ?? (rf * 1.2);
  let upstreamScore = 0;
  if (upstreamRf > 250) {
    upstreamScore = 15;
  } else if (upstreamRf > 150) {
    upstreamScore = 11;
  } else if (upstreamRf > 75) {
    upstreamScore = 6;
  } else {
    upstreamScore = 2;
  }

  // 5. GloFAS River Discharge Ratio (Optional modelled hydrological flow estimate)
  let dischargeAdjustment = 0;
  if (input.dischargeRatio !== undefined) {
    const ratio = input.dischargeRatio;
    if (ratio >= 1.8) {
      dischargeAdjustment = 10;
    } else if (ratio >= 1.4) {
      dischargeAdjustment = 7;
    } else if (ratio >= 1.2) {
      dischargeAdjustment = 4;
    } else if (ratio < 0.8) {
      dischargeAdjustment = -2;
    }
  }

  // Aggregate Raw Risk Score (0 - 100)
  const totalScore = Math.min(
    100,
    Math.max(0, Math.round(waterLevelScore + rainfallScore + rateScore + upstreamScore + dischargeAdjustment))
  );

  // Determine Risk Category
  let riskLevel: RiskLevel = 'LOW';
  if (totalScore >= 78 || levelDiffDanger >= 0.5) {
    riskLevel = 'CRITICAL';
  } else if (totalScore >= 58 || levelDiffDanger >= 0) {
    riskLevel = 'HIGH';
  } else if (totalScore >= 35 || levelDiffWarning >= 0) {
    riskLevel = 'MODERATE';
  } else {
    riskLevel = 'LOW';
  }

  // Forecasted water level in 24 hours based on inflow, discharge ratio, and rainfall
  const dischargeRiseBonus = input.dischargeRatio && input.dischargeRatio > 1.2 ? (input.dischargeRatio - 1.0) * 0.12 : 0;
  const projectedRise = (delta * 0.7) + (rf * 0.0035) + (upstreamRf * 0.002) + dischargeRiseBonus;
  const scenarioStage24hM = Number((currentLevel + Math.max(-0.2, projectedRise)).toFixed(2));

  // Estimated time to peak (hours)
  let scenarioHorizonHours = 24;
  if (riskLevel === 'CRITICAL') scenarioHorizonHours = Math.max(6, Math.round(18 - delta * 6));
  else if (riskLevel === 'HIGH') scenarioHorizonHours = 18;
  else if (riskLevel === 'MODERATE') scenarioHorizonHours = 36;
  else scenarioHorizonHours = 48;

  // Contributing Factors Breakdown
  const factors: ContributingFactor[] = [
    {
      factor: 'River Gauge vs Danger Level',
      factorBn: 'বিপদসীমার সাপেক্ষে নদীর পানির স্তর',
      weight: 40,
      impact: currentLevel >= dangerLevel ? 'critical' : currentLevel >= warningLevel ? 'high' : 'moderate',
      description: currentLevel >= dangerLevel
        ? `Water level is ${(currentLevel - dangerLevel).toFixed(2)}m ABOVE the official danger mark (${dangerLevel}m).`
        : `Water level is ${(dangerLevel - currentLevel).toFixed(2)}m below danger mark (${dangerLevel}m).`,
      descriptionBn: currentLevel >= dangerLevel
        ? `পানির স্তর বিপদসীমার (${dangerLevel} মি) চেয়ে ${(currentLevel - dangerLevel).toFixed(2)} মিটার ওপরে।`
        : `পানির স্তর বিপদসীমার (${dangerLevel} মি) চেয়ে ${(dangerLevel - currentLevel).toFixed(2)} মিটার নিচে।`,
    },
    {
      factor: '24h Precipitation Intensity',
      factorBn: '২৪ ঘণ্টার বৃষ্টিপাতের তীব্রতা',
      weight: 30,
      impact: rf > 120 ? 'critical' : rf > 60 ? 'high' : rf > 25 ? 'moderate' : 'low',
      description: `Observed/projected rainfall of ${rf} mm in the local basin area.`,
      descriptionBn: `স্থানীয় অববাহিকায় পর্যবেক্ষণকৃত/প্রাক্কলিত বৃষ্টিপাত ${rf} মিলিমিটার।`,
    },
    {
      factor: 'River Crest Velocity (24h Trend)',
      factorBn: 'নদীর পানি বৃদ্ধির হার (২৪ ঘণ্টা)',
      weight: 15,
      impact: delta >= 0.5 ? 'critical' : delta >= 0.2 ? 'high' : 'low',
      description: delta > 0 ? `River rising at +${delta.toFixed(2)}m per 24 hours.` : `River trend is receding/stable (${delta.toFixed(2)}m).`,
      descriptionBn: delta > 0 ? `নদীর পানি প্রতি ২৪ ঘণ্টায় +${delta.toFixed(2)} মিটার হারে বাড়ছে।` : `নদীর পানি হ্রাসমান বা স্থিতিশীল (${delta.toFixed(2)} মি)।`,
    },
    {
      factor: 'Upstream Transboundary Runoff',
      factorBn: 'উজান থেকে আসা পাহাড়ি ঢল',
      weight: 15,
      impact: upstreamRf > 150 ? 'critical' : upstreamRf > 75 ? 'high' : 'low',
      description: `Catchment runoff index calculated at ${upstreamRf} mm upstream equivalent.`,
      descriptionBn: `উজান মেঘালয় অববাহিকা থেকে ঢলের সমতুল্য সূচক ${upstreamRf} মিলিমিটার।`,
    },
  ];

  if (input.dischargeRatio !== undefined) {
    const ratio = input.dischargeRatio;
    factors.push({
      factor: 'GloFAS River Discharge Surge Ratio',
      factorBn: 'গ্লোফাস নদী প্রবাহ ও স্বাভাবিকের অনুপাত',
      weight: 10,
      impact: ratio >= 1.8 ? 'critical' : ratio >= 1.4 ? 'high' : ratio >= 1.15 ? 'moderate' : 'low',
      description: `GloFAS river discharge is ${ratio}x of the seasonal mean volume for this basin.`,
      descriptionBn: `গ্লোফাস নদীর পানি প্রবাহ বর্তমান ঋতুর স্বাভাবিক গড়ের চেয়ে ${ratio} গুণ বেশি।`,
    });
  }

  // Dynamic Explanations
  let explanationEn = '';
  let explanationBn = '';

  if (riskLevel === 'CRITICAL') {
    explanationEn = `CRITICAL MODEL INDICATOR: The configured river-stage input is at or above the danger mark (${dangerLevel}m), with heavy precipitation (${rf}mm) and upstream runoff assumptions. This score does not estimate arrival time or confirm local conditions; check current official FFWC/DDM warnings and local authorities.`;
    explanationBn = `গুরুতর মডেল সূচক: ব্যবহৃত নদীর পানির ইনপুট বিপদসীমা (${dangerLevel} মি) ছুঁয়েছে বা অতিক্রম করেছে; সঙ্গে বৃষ্টি (${rf} মিমি) ও উজানের ঢলের অনুমান যুক্ত হয়েছে। এই স্কোর বন্যা পৌঁছানোর সময় বলে না বা মাঠপর্যায়ের অবস্থা নিশ্চিত করে না। বর্তমান সরকারি FFWC/DDM সতর্কতা ও স্থানীয় কর্তৃপক্ষের নির্দেশনা যাচাই করুন।`;
  } else if (riskLevel === 'HIGH') {
    explanationEn = `HIGH MODEL INDICATOR: The supplied rainfall (${rf}mm) and stage-change input (+${delta}m) raise the configured risk score. Local flood extent and timing are not confirmed by this calculation; verify with official warnings and on-the-ground sources.`;
    explanationBn = `উচ্চ মডেল সূচক: দেওয়া বৃষ্টিপাত (${rf} মিমি) ও পানির স্তর পরিবর্তনের তথ্য (+${delta} মি) নির্ধারিত ঝুঁকি স্কোর বাড়িয়েছে। এই হিসাব স্থানীয় প্লাবনের বিস্তার বা সময় নিশ্চিত করে না; সরকারি সতর্কতা ও মাঠপর্যায়ের তথ্য যাচাই করুন।`;
  } else if (riskLevel === 'MODERATE') {
    explanationEn = `MODERATE ADVISORY: Water levels are elevated near warning thresholds with moderate rainfall (${rf}mm). Agricultural haor lands may experience localized pooling. Constant monitoring of upstream flash flood runoff is advised.`;
    explanationBn = `মাঝারি সতর্কতা: পানির স্তর সতর্কসীমার কাছাকাছি এবং মাঝারি বৃষ্টিপাত (${rf} মিমি) হচ্ছে। নিম্নাঞ্চলের কৃষি জমিতে পানি প্রবেশ করতে পারে। উজান থেকে ঢলের গতি নিয়মিত পর্যবেক্ষণ করা আবশ্যক।`;
  } else {
    explanationEn = `LOWER MODEL INDICATOR: The supplied inputs are below the configured warning mark (${warningLevel}m). This is not a safety guarantee; local conditions and official warnings may change.`;
    explanationBn = `তুলনামূলক কম মডেল সূচক: দেওয়া ইনপুট সতর্কসীমা (${warningLevel} মি)-এর নিচে। এটি নিরাপদ থাকার নিশ্চয়তা নয়; স্থানীয় অবস্থা ও সরকারি সতর্কতা পরিবর্তিত হতে পারে।`;
  }

  // Life Safety Actions
  const actionsEn: string[] = [];
  const actionsBn: string[] = [];

  if (riskLevel === 'CRITICAL') {
    actionsEn.push('Follow current official evacuation instructions. Help older adults, children, and people with disabilities reach the designated shelter when authorities advise evacuation.');
    actionsEn.push('Move dry rations, drinking water purification tablets, and important documents into waterproof containers.');
    actionsEn.push('Avoid wading through fast-moving haor currents; stay clear of downed electric poles and submerged transformers.');
    actionsEn.push('Keep mobile phones charged and call emergency hotline 1090 (Toll-Free Flood Alert) or 999 for rescue.');

    actionsBn.push('সরকারি কর্তৃপক্ষ সরিয়ে নেওয়ার নির্দেশ দিলে শিশু, বয়স্ক ও প্রতিবন্ধী ব্যক্তিদের নির্ধারিত আশ্রয়কেন্দ্রে যেতে সহায়তা করুন।');
    actionsBn.push('শুকনো খাবার, পানি বিশুদ্ধকরণ ট্যাবলেট ও জরুরি কাগজপত্র ওয়াটারপ্রুফ ব্যাগে নিরাপদে রাখুন।');
    actionsBn.push('তীব্র স্রোতে চলাফেরা এড়িয়ে চলুন এবং পানির নিচে থাকা বৈদ্যুতিক তার বা খুঁটি থেকে দূরে থাকুন।');
    actionsBn.push('জরুরি উদ্ধার ও সহায়তার জন্য টোল-ফ্রি বন্যা হেল্পলাইন ১০৯০ অথবা ৯৯৯-এ যোগাযোগ করুন।');
  } else if (riskLevel === 'HIGH') {
    actionsEn.push('Inspect neighborhood flood embankments and prepare sandbags around home perimeters.');
    actionsEn.push('Secure motorized country boats and tie floating platforms to sturdy structures.');
    actionsEn.push('Stock emergency provisions: oral rehydration salts (ORS), flashlights, and matchboxes.');
    actionsEn.push('Farmers should harvest mature boro paddy or secure fish pond netting against overflow.');

    actionsBn.push('এলাকার বাঁধ পর্যবেক্ষণ করুন এবং বাড়ির চারপাশে বালির বস্তা দিয়ে সুরক্ষা তৈরি করুন।');
    actionsBn.push('নৌকা প্রস্তুত রাখুন এবং জরুরি চলাচলের জন্য শক্ত স্থানে বেঁধে রাখুন।');
    actionsBn.push('খাবার স্যালাইন, টর্চলাইট, ম্যাচ ও প্রাথমিক চিকিৎসা সামগ্রী মজুত করুন।');
    actionsBn.push('পাকা ফসল দ্রুত কাটার ব্যবস্থা করুন এবং পুকুরের মাছ ভেসে যাওয়া রোধে চারপাশ জাল দিয়ে ঘিরে দিন।');
  } else if (riskLevel === 'MODERATE') {
    actionsEn.push('Stay tuned to official Bangladesh Water Development Board (BWDB) bulletins via local radio and app.');
    actionsEn.push('Identify the highest ground and primary evacuation shelter in your local union/ward.');
    actionsEn.push('Check that drainage culverts and homestead runoffs are unblocked from debris.');

    actionsBn.push('স্থানীয় রেডিও ও অ্যাপের মাধ্যমে পানি উন্নয়ন বোর্ডের নিয়মিত বুলেটিন শুনুন।');
    actionsBn.push('আপনার ইউনিয়ন বা ওয়ার্ডের সবচেয়ে উঁচু স্থান ও আশ্রয়কেন্দ্রটি চিহ্নিত করে রাখুন।');
    actionsBn.push('বাড়ির আশপাশের নালা ও কালভার্টের ময়লা পরিষ্কার করে পানি নিষ্কাশন স্বাভাবিক রাখুন।');
  } else {
    actionsEn.push('Routine preparedness: keep emergency contacts of Upazila Disaster Management Committee handy.');
    actionsEn.push('Inspect rainwater harvesting and tube-well plinth heights before monsoon peak.');

    actionsBn.push('স্বাভাবিক সতর্কতা: উপজেলা দুর্যোগ ব্যবস্থাপনা কমিটির জরুরি নম্বর সংরক্ষণ করুন।');
    actionsBn.push('বর্ষার আগে বাড়ির টিউবওয়েলের গোড়া উঁচু ও নিরাপদ আছে কিনা তা পরীক্ষা করুন।');
  }

  // Report input coverage, not statistical confidence. The rule weights are not probability-calibrated.
  const suppliedInputs = [input.rainfallMm, input.waterLevelM, input.waterLevelChangeM, input.durationHours, input.upstreamRainfallMm];
  const inputCoveragePercent = Math.round((suppliedInputs.filter((value) => typeof value === 'number' && Number.isFinite(value)).length / suppliedInputs.length) * 100);

  return {
    riskLevel,
    riskScore: totalScore,
    inputCoveragePercent,
    scenarioStage24hM,
    scenarioHorizonHours,
    factors,
    explanationEn,
    explanationBn,
    actionsEn,
    actionsBn,
    methodology: 'TRANSPARENT_HYDROLOGICAL_BASELINE',
  };
}
