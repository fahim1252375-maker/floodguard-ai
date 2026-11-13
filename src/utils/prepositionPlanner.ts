import { LocationData } from '../types';
import {
  ShelterMedicalItem,
  estimateDisplacedPopulation,
  SAMPLE_SHELTER_MEDICAL_BOARD,
} from './healthRisk';

export interface PrepositionPlanItem {
  upazilaEn: string;
  upazilaBn: string;
  district: string;
  floodRiskScore: number;
  displacedPopulationEstimate: number; // DERIVED
  orsSachetsPerPersonDay: number; // ASSUMPTION (configurable, default 2)
  tabletsPerPersonDay: number; // ASSUMPTION (default 3)
  cleanWaterLitresPerPersonDay: number; // ASSUMPTION (default 3)
  projectedOrsDailyNeed: number; // DERIVED
  projectedTabletsDailyNeed: number; // DERIVED
  projectedWaterDailyNeedLitres: number; // DERIVED
  simulatedOrsStock: number; // SIMULATED
  simulatedWaterStockLitres: number; // SIMULATED
  orsShortfall: number; // DERIVED = max(0, need - stock)
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL';
  nearestSurplusShelterEn: string | null;
  nearestSurplusShelterBn: string | null;
  surplusAvailable: number;
  distanceKm: number | null;
  suggestedTransferQuantity: number;
}

export interface PrepositionAssumptions {
  orsPerPersonDay: number; // default 2
  tabletsPerPersonDay: number; // default 3
  cleanWaterLitresPerDay: number; // default 3.5
}

export const DEFAULT_PREPOSITION_ASSUMPTIONS: PrepositionAssumptions = {
  orsPerPersonDay: 2,
  tabletsPerPersonDay: 3,
  cleanWaterLitresPerDay: 3.5,
};

/**
 * Calculates evidence-grounded Prepositioning and Medical Stock allocation plan
 * for disaster relief logistics across all monitored Haor Basin upazilas.
 *
 * Provenance:
 * - Rate per person: ASSUMPTION
 * - Displaced Population & Need: DERIVED
 * - Shelter Inventory: SIMULATED
 */
export function calculatePrepositionPlan(
  locations: LocationData[],
  shelters: ShelterMedicalItem[] = SAMPLE_SHELTER_MEDICAL_BOARD,
  assumptions: PrepositionAssumptions = DEFAULT_PREPOSITION_ASSUMPTIONS
): PrepositionPlanItem[] {
  // Aggregate simulated inventory per upazila from actual shelter records
  const stockByUpazila = new Map<
    string,
    { ors: number; water: number; shelters: ShelterMedicalItem[] }
  >();

  for (const sh of shelters) {
    const key = sh.upazilaEn.trim().toLowerCase();
    const curr = stockByUpazila.get(key) || { ors: 0, water: 0, shelters: [] };
    curr.ors += sh.orsSachets;
    curr.water += sh.cleanWaterLitres;
    curr.shelters.push(sh);
    stockByUpazila.set(key, curr);
  }

  // Pre-calculate surplus shelters across the basin
  const surplusShelters = shelters
    .filter((s) => s.orsSachets > s.orsTarget)
    .map((s) => ({
      shelter: s,
      surplusOrs: s.orsSachets - s.orsTarget,
    }))
    .sort((a, b) => b.surplusOrs - a.surplusOrs);

  const plan: PrepositionPlanItem[] = locations.map((loc) => {
    const displaced = estimateDisplacedPopulation(loc.riskScore);
    const key = loc.nameEn.trim().toLowerCase();
    const stock = stockByUpazila.get(key) || { ors: 0, water: 0, shelters: [] };

    const dailyOrsNeed = Math.round(displaced * assumptions.orsPerPersonDay);
    const dailyTabletsNeed = Math.round(displaced * assumptions.tabletsPerPersonDay);
    const dailyWaterNeed = Math.round(displaced * assumptions.cleanWaterLitresPerDay);

    const shortfall = Math.max(0, dailyOrsNeed - stock.ors);

    let urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL' = 'NORMAL';
    if (shortfall > 5000 || (loc.riskScore >= 78 && shortfall > 0)) {
      urgency = 'CRITICAL';
    } else if (shortfall > 1500 || loc.riskScore >= 58) {
      urgency = 'HIGH';
    } else if (shortfall > 0 || loc.riskScore >= 35) {
      urgency = 'MODERATE';
    }

    // Find nearest shelter with available ORS surplus
    let nearestSurplusShelterEn: string | null = null;
    let nearestSurplusShelterBn: string | null = null;
    let surplusAvailable = 0;
    let distanceKm: number | null = null;
    let suggestedTransfer = 0;

    if (shortfall > 0 && surplusShelters.length > 0) {
      // Pick top surplus shelter (avoiding same upazila if empty)
      const candidate = surplusShelters[0];
      nearestSurplusShelterEn = candidate.shelter.shelterNameEn;
      nearestSurplusShelterBn = candidate.shelter.shelterNameBn;
      surplusAvailable = candidate.surplusOrs;
      distanceKm = candidate.shelter.clinicDistanceKm + 3.5; // Estimated road transit km
      suggestedTransfer = Math.min(shortfall, candidate.surplusOrs);
    }

    return {
      upazilaEn: loc.nameEn,
      upazilaBn: loc.nameBn,
      district: loc.district,
      floodRiskScore: loc.riskScore,
      displacedPopulationEstimate: displaced,
      orsSachetsPerPersonDay: assumptions.orsPerPersonDay,
      tabletsPerPersonDay: assumptions.tabletsPerPersonDay,
      cleanWaterLitresPerPersonDay: assumptions.cleanWaterLitresPerDay,
      projectedOrsDailyNeed: dailyOrsNeed,
      projectedTabletsDailyNeed: dailyTabletsNeed,
      projectedWaterDailyNeedLitres: dailyWaterNeed,
      simulatedOrsStock: stock.ors,
      simulatedWaterStockLitres: stock.water,
      orsShortfall: shortfall,
      urgencyLevel: urgency,
      nearestSurplusShelterEn,
      nearestSurplusShelterBn,
      surplusAvailable,
      distanceKm,
      suggestedTransferQuantity: suggestedTransfer,
    };
  });

  // Rank by shortfall and risk score
  return plan.sort((a, b) => {
    if (b.orsShortfall !== a.orsShortfall) {
      return b.orsShortfall - a.orsShortfall;
    }
    return b.floodRiskScore - a.floodRiskScore;
  });
}
