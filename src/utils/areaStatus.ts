/**
 * Plain-language, three-colour status for a citizen's own area.
 * This is guidance derived from the displayed station data; it never replaces official instructions.
 */
import { LocationData } from '../types';

export type AreaLevel = 'green' | 'amber' | 'red';

export interface AreaStatus {
  level: AreaLevel;
  marginM: number; // metres below danger level (negative = above it)
  headlineEn: string;
  headlineBn: string;
  stepsEn: string[];
  stepsBn: string[];
}

export function computeAreaStatus(loc: LocationData): AreaStatus {
  const marginM = Number((loc.dangerLevel - loc.currentWaterLevel).toFixed(2));
  const rising = loc.waterLevelChange24h >= 0.3;

  let level: AreaLevel = 'green';
  if (loc.riskLevel === 'CRITICAL' || marginM <= 0) level = 'red';
  else if (loc.riskLevel === 'HIGH' || marginM <= 0.5 || (rising && loc.riskLevel === 'MODERATE')) level = 'amber';

  const content: Record<AreaLevel, Pick<AreaStatus, 'headlineEn' | 'headlineBn' | 'stepsEn' | 'stepsBn'>> = {
    green: {
      headlineEn: 'Stay alert. No immediate danger indicated.',
      headlineBn: 'সতর্ক থাকুন। এখনই বিপদের ইঙ্গিত নেই।',
      stepsEn: [
        'Keep your phone charged and check this page once a day.',
        'Know your nearest shelter and the safest route to it.',
        'Subscribe below so you hear about changes early.',
      ],
      stepsBn: [
        'ফোন চার্জে রাখুন এবং দিনে একবার এই পাতা দেখুন।',
        'নিকটতম আশ্রয়কেন্দ্র ও নিরাপদ পথ জেনে রাখুন।',
        'পরিবর্তনের খবর আগে পেতে নিচে সাবস্ক্রাইব করুন।',
      ],
    },
    amber: {
      headlineEn: 'Get ready. Water is near or rising toward the danger level.',
      headlineBn: 'প্রস্তুত হোন। পানি বিপৎসীমার কাছে বা বাড়ছে।',
      stepsEn: [
        'Pack a go-bag: ID copies, medicines, ORS, dry food, torch, power bank.',
        'Move valuables, livestock and documents to higher ground.',
        'Agree a meeting point with your family and tell neighbours who need help.',
        'Follow instructions from your Upazila disaster management cell.',
      ],
      stepsBn: [
        'গো-ব্যাগ গুছান: পরিচয়পত্রের কপি, ওষুধ, খাবার স্যালাইন, শুকনা খাবার, টর্চ, পাওয়ার ব্যাংক।',
        'মূল্যবান জিনিস, গবাদিপশু ও কাগজপত্র উঁচু স্থানে সরান।',
        'পরিবারের সঙ্গে জমায়েতের জায়গা ঠিক করুন এবং সাহায্য দরকার এমন প্রতিবেশীকে জানান।',
        'উপজেলা দুর্যোগ ব্যবস্থাপনা কমিটির নির্দেশ মানুন।',
      ],
    },
    red: {
      headlineEn: 'Danger. Be ready to move now and follow official evacuation instructions.',
      headlineBn: 'বিপদ। এখনই সরে যেতে প্রস্তুত থাকুন এবং সরকারি নির্দেশ মানুন।',
      stepsEn: [
        'If told to evacuate, go to the nearest shelter immediately. Do not wait.',
        'Take children, elderly and people with disabilities first.',
        'Never walk or drive through flowing water. Switch off electricity if safe.',
        'Need rescue? Call 999 now, then tell us with "I need help" below.',
      ],
      stepsBn: [
        'সরে যাওয়ার নির্দেশ এলে এখনই নিকটতম আশ্রয়কেন্দ্রে যান, দেরি করবেন না।',
        'শিশু, বয়স্ক ও প্রতিবন্ধী ব্যক্তিদের আগে নিন।',
        'প্রবহমান পানিতে হাঁটবেন বা গাড়ি চালাবেন না। নিরাপদ হলে বিদ্যুৎ বন্ধ করুন।',
        'উদ্ধার দরকার? এখনই ৯৯৯ এ কল করুন, তারপর নিচে "সাহায্য চাই" দিয়ে জানান।',
      ],
    },
  };

  return { level, marginM, ...content[level] };
}
