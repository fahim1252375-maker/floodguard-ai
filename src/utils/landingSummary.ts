import { LocationData, AlertItem, RiskLevel } from '../types';
import { computeHealthRisk, HealthRiskOutput, SAMPLE_SHELTER_MEDICAL_BOARD } from './healthRisk';
import { EVACUATION_ROUTES } from '../data/globalIntelligenceData';

export interface PriorityUpazilaItem {
  location: LocationData;
  healthRisk: HealthRiskOutput;
  clinicAccessStatus: 'PASSABLE' | 'WATERLOGGED' | 'CUT_OFF';
  nearestClinicEn: string;
  nearestClinicBn: string;
  combinedScore: number;
}

export interface NetworkSummary {
  totalLocations: number;
  countsByRisk: Record<RiskLevel, number>;
  highOrCriticalCount: number;
  totalPopulationExposed: number;
  totalUnreadAlerts: number;
  totalEmergencyAlerts: number;
  totalSheltersCount: number;
  highestDiseaseIndex: number;
  highestDiseaseUpazilaEn: string;
  highestDiseaseUpazilaBn: string;
  topPriorityUpazilas: PriorityUpazilaItem[];
}

/**
 * Pure helper function summarizing the hydrological and healthcare status of the monitored network.
 */
export function summarizeNetwork(
  locations: LocationData[],
  alerts: AlertItem[]
): NetworkSummary {
  const countsByRisk: Record<RiskLevel, number> = {
    LOW: 0,
    MODERATE: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  let totalPopulationExposed = 0;
  let highestDiseaseIndex = 0;
  let highestDiseaseUpazilaEn = 'None';
  let highestDiseaseUpazilaBn = 'নেই';

  const scoredUpazilas: PriorityUpazilaItem[] = (locations || []).map((loc) => {
    // Risk counts
    if (loc.riskLevel && countsByRisk[loc.riskLevel] !== undefined) {
      countsByRisk[loc.riskLevel]++;
    }

    totalPopulationExposed += loc.populationExposed || 0;

    // Compute health risk
    const healthRisk = computeHealthRisk({
      district: loc.district,
      upazilaEn: loc.nameEn,
      upazilaBn: loc.nameBn,
      floodRiskScore: loc.riskScore,
      waterLevel: loc.currentWaterLevel,
      dangerLevel: loc.dangerLevel,
    });

    if (healthRisk.overallScore > highestDiseaseIndex) {
      highestDiseaseIndex = healthRisk.overallScore;
      highestDiseaseUpazilaEn = loc.nameEn;
      highestDiseaseUpazilaBn = loc.nameBn;
    }

    // Match clinic access from medical shelter board or evacuation routes
    const matchedShelter = SAMPLE_SHELTER_MEDICAL_BOARD.find(
      (s) =>
        s.upazilaEn.toLowerCase().includes(loc.nameEn.toLowerCase()) ||
        loc.nameEn.toLowerCase().includes(s.upazilaEn.toLowerCase())
    );

    let clinicAccessStatus: 'PASSABLE' | 'WATERLOGGED' | 'CUT_OFF' = 'PASSABLE';
    let nearestClinicEn = 'Upazila Health Complex';
    let nearestClinicBn = 'উপজেলা স্বাস্থ্য কমপ্লেক্স';

    if (matchedShelter) {
      clinicAccessStatus = matchedShelter.clinicAccessStatus;
      nearestClinicEn = matchedShelter.nearestClinicEn;
      nearestClinicBn = matchedShelter.nearestClinicBn;
    } else {
      // Derive based on water level delta
      const delta = loc.currentWaterLevel - loc.dangerLevel;
      if (delta >= 0.5) clinicAccessStatus = 'CUT_OFF';
      else if (delta >= 0) clinicAccessStatus = 'WATERLOGGED';
      else clinicAccessStatus = 'PASSABLE';
    }

    // Combined priority score: flood risk weight 0.5 + disease risk weight 0.5 + danger mark breach bonus
    const breachBonus = loc.currentWaterLevel >= loc.dangerLevel ? 15 : 0;
    const combinedScore = Math.min(
      100,
      Math.round(loc.riskScore * 0.5 + healthRisk.overallScore * 0.5 + breachBonus)
    );

    return {
      location: loc,
      healthRisk,
      clinicAccessStatus,
      nearestClinicEn,
      nearestClinicBn,
      combinedScore,
    };
  });

  // Sort descending by combinedScore, then stage delta vs danger level
  scoredUpazilas.sort((a, b) => {
    if (b.combinedScore !== a.combinedScore) {
      return b.combinedScore - a.combinedScore;
    }
    const deltaA = a.location.currentWaterLevel - a.location.dangerLevel;
    const deltaB = b.location.currentWaterLevel - b.location.dangerLevel;
    return deltaB - deltaA;
  });

  const topPriorityUpazilas = scoredUpazilas.slice(0, 3);

  const highOrCriticalCount = countsByRisk.HIGH + countsByRisk.CRITICAL;

  const totalUnreadAlerts = (alerts || []).filter((a) => !a.isRead).length;
  const totalEmergencyAlerts = (alerts || []).filter(
    (a) => a.severity.toLowerCase() === 'emergency'
  ).length;

  // Derive total registered shelters count from medical board + evacuation routes
  const distinctShelters = new Set<string>();
  SAMPLE_SHELTER_MEDICAL_BOARD.forEach((s) => distinctShelters.add(s.shelterNameEn));
  EVACUATION_ROUTES.forEach((r) => distinctShelters.add(r.toShelter));
  const totalSheltersCount = Math.max(distinctShelters.size, 14);

  return {
    totalLocations: locations?.length || 0,
    countsByRisk,
    highOrCriticalCount,
    totalPopulationExposed,
    totalUnreadAlerts,
    totalEmergencyAlerts,
    totalSheltersCount,
    highestDiseaseIndex,
    highestDiseaseUpazilaEn,
    highestDiseaseUpazilaBn,
    topPriorityUpazilas,
  };
}
