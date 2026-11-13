export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type District = 'Sylhet' | 'Sunamganj';

export type Language = 'en' | 'bn';

export type FloodCategory =
  | 'riverine'
  | 'flash_flood'
  | 'pluvial_urban'
  | 'coastal_surge'
  | 'glof'
  | 'dam_release'
  | 'compound';

export type DataCoverageStatus =
  | 'verified_connected'
  | 'partially_connected'
  | 'historical_only'
  | 'simulated_demo'
  | 'no_connection';

export type SourceType =
  | 'DIRECT_SENSOR'
  | 'OFFICIAL_BULLETIN'
  | 'WEATHER_FORECAST'
  | 'SATELLITE_OBSERVATION'
  | 'COMMUNITY_REPORT'
  | 'MODEL_PREDICTION'
  | 'RULE_BASELINE'
  | 'SIMULATED_DEMO';

export interface LocationData {
  id: string;
  nameEn: string;
  nameBn: string;
  countryCode?: string;
  district: District;
  upazilaEn: string;
  upazilaBn: string;
  riverNameEn: string;
  riverNameBn: string;
  stationName: string;
  coordinates: [number, number]; // [lat, lng]
  currentWaterLevel: number; // meters
  dangerLevel: number; // meters
  warningLevel: number; // meters
  waterLevelChange24h: number; // meters (+ or -)
  rainfall24h: number; // mm
  rainfallTrend: 'rising' | 'steady' | 'falling';
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  soilSaturationPercent: number; // 0 - 100
  upstreamRainfallMm: number; // mm in catchment
  populationExposed: number;
  sheltersCount: number;
  historicalMaxM: number;
  lastUpdated: string;
  isSimulated: boolean;
  basinId?: string;
  travelLagHours?: number;
  displacedEstimated?: number;
}

export interface PredictionInput {
  locationId: string;
  rainfallMm: number;
  waterLevelM: number;
  waterLevelChangeM: number;
  rainfallTrend: 'rising' | 'steady' | 'falling';
  durationHours: number;
  upstreamRainfallMm?: number;
  soilSaturationPercent?: number;
  floodCategory?: FloodCategory;
  dischargeRatio?: number;
}

export interface ContributingFactor {
  factor: string;
  factorBn: string;
  weight: number; // percentage
  impact: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  descriptionBn: string;
}

export interface PredictionResult {
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  inputCoveragePercent: number; // percentage of the five optional/required input fields supplied
  scenarioStage24hM: number; // illustrative heuristic scenario output, not a validated forecast
  scenarioHorizonHours: number; // illustrative chart horizon, not peak-arrival time
  factors: ContributingFactor[];
  explanationEn: string;
  explanationBn: string;
  actionsEn: string[];
  actionsBn: string[];
  methodology: 'TRANSPARENT_HYDROLOGICAL_BASELINE' | 'AI_ASSISTED_SYNTHESIS';
}

export interface SimulationPreset {
  id: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  rainfallMm: number;
  waterLevelM: number;
  waterLevelChangeM: number;
  durationHours: number;
  upstreamRainfallMm: number;
  icon: string;
}

export interface AlertItem {
  id: string;
  severity: 'advisory' | 'watch' | 'warning' | 'emergency';
  titleEn: string;
  titleBn: string;
  locationEn: string;
  locationBn: string;
  district: District;
  messageEn: string;
  messageBn: string;
  actionEn: string;
  actionBn: string;
  timestamp: string;
  isVerified: boolean;
  isRead: boolean;
  affectedPopulation: number;
  source: string;
  originatingAgency?: string;
  hazardType?: FloodCategory;
  expiryTime?: string;
}

export interface CommunityReport {
  id: string;
  reporterName: string;
  phoneOrContact?: string;
  district: District;
  upazilaEn: string;
  upazilaBn: string;
  villageOrArea: string;
  waterDepthValue: number;
  waterDepthUnit: 'ft' | 'cm';
  waterTrend: 'rapidly_rising' | 'slowly_rising' | 'stable' | 'receding';
  roadCondition: 'passable' | 'waterlogged' | 'inundated' | 'completely_submerged';
  electricityStatus: 'normal' | 'intermittent' | 'cut_off';
  description: string;
  photoUrl?: string;
  timestamp: string;
  status: 'verified' | 'pending' | 'flagged';
  verifiedBy?: string;
  /** ISO time at which the reporter ticked the data-consent box (server-set) */
  consentedAt?: string;
  coordinates?: [number, number];
  corroborationCount?: number;
  auditTrail?: { action: string; actor: string; timestamp: string }[];
}

/** What the community report form submits (consent is mandatory and enforced server-side). */
export type ReportDraft = Omit<CommunityReport, 'id' | 'timestamp' | 'status' | 'consentedAt'> & { consent: true };

export interface ReportSubmitResult {
  ok: boolean;
  error?: string;
  /** True when the demo server was unreachable and the report only exists in this browser session. */
  localOnly?: boolean;
}

export interface HistoricalRecord {
  year: number;
  eventNameEn: string;
  eventNameBn: string;
  peakDate: string;
  affectedDistricts: string[];
  totalAffectedPeople: string;
  peakWaterLevelSurmaM: number;
  peakRainfall24hMm: number;
  descriptionEn: string;
  descriptionBn: string;
  economicLoss: string;
}

export interface DataSourceStatus {
  name: string;
  agency: string;
  type: string;
  status: 'connected' | 'simulated' | 'unavailable' | 'historical_only';
  latency: string;
  lastSync: string;
  details: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: string[];
}

// ==========================================
// GLOBAL ARCHITECTURE & NEW UNIQUE SYSTEMS
// ==========================================

export interface GlobalCountry {
  code: string;
  nameEn: string;
  nameBn: string;
  continent: string;
  coverageStatus: DataCoverageStatus;
  primaryBasinName: string;
  stationsCount: number;
  dataLatencyDesc: string;
  referenceAgencies: string[];
  activeHazardTypes: FloodCategory[];
  coordinates: [number, number];
  notes: string;
}

export interface BasinTwinLink {
  fromStationId: string;
  toStationId: string;
  riverName: string;
  distanceKm: number;
  travelLagHours: number;
  slopeGradient: string;
  upstreamContributionRatio: number; // 0 to 1.0
  verifiedConnectivity: boolean;
}

export interface BasinTwinNode {
  stationId: string;
  stationName: string;
  riverName: string;
  basinName: string;
  elevationM: number;
  currentLevelM: number;
  dangerLevelM: number;
  isBreached: boolean;
  rateOfRiseM24h: number;
  upstreamRainfallMm: number;
  downstreamExposurePop: number;
  directUpstreamIds: string[];
  directDownstreamIds: string[];
  calculatedDownstreamSurgeETA: string;
}

export interface EvidenceRecord {
  id: string;
  sourceId: string;
  sourceOrganization: string;
  sourceType: SourceType;
  stationOrArea: string;
  parameterName: string;
  observedValue: string | number;
  unit: string;
  observationTimestamp: string;
  retrievalTimestamp: string;
  qualityScore: number; // 0 to 100
  freshnessStatus: 'FRESH' | 'AGING' | 'STALE';
  isAnomaly: boolean;
  contradictsOtherSources: boolean;
  notes: string;
}

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'school' | 'shelter' | 'bridge' | 'power_substation' | 'water_facility' | 'major_road';
  coordinates: [number, number];
  district: District;
  upazilaEn: string;
  elevationM: number;
  floodToleranceM: number;
  capacity?: number;
  currentStatus: 'OPERATIONAL' | 'AT_RISK' | 'INUNDATED' | 'ACCESS_CUT';
  lastVerified: string;
}

export interface SatelliteObservation {
  id: string;
  satelliteName: 'Sentinel-1 SAR' | 'Sentinel-2 MSI' | 'NASA GPM (IMERG)' | 'Landsat-9';
  sensorType: string;
  acquisitionDate: string;
  footprintArea: string;
  surfaceWaterExpansionPercent: number;
  processingStatus: 'AVAILABLE' | 'PROCESSING' | 'COMPLETED' | 'UNAVAILABLE' | 'SIMULATED';
  cloudCoverPercent: number;
  groundResolutionM: number;
  algorithmVersion: string;
  notes: string;
}

export interface EvacuationRoute {
  id: string;
  name: string;
  fromZone: string;
  toShelter: string;
  distanceKm: number;
  estTravelMins: number;
  accessibilityStatus: 'PASSABLE' | 'WATERLOGGED' | 'CUT_OFF' | 'UNKNOWN';
  verifiedByOfficer: boolean;
  lastCheckedTime: string;
  roadElevationM: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  locationId: string;
  rainfallMm: number;
  waterLevelM: number;
  waterLevelChangeM: number;
  durationHours: number;
  upstreamRainfallMm: number;
  floodCategory: FloodCategory;
  createdAt: string;
  calculatedRiskLevel: RiskLevel;
  riskScore: number;
}

export interface ResilienceChecklistItem {
  id: string;
  category: 'water_sanitation' | 'food_ration' | 'medical_health' | 'vital_documents' | 'energy_comm' | 'shelter_plan';
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  isCritical: boolean;
  isCompleted: boolean;
}

export interface StructuredAiPrediction {
  riskLevel: RiskLevel;
  confidence: number;
  topReasons: string[];
  topReasonsBn: string[];
  recommendedActions: {
    en: string[];
    bn: string[];
  };
  outlook: {
    sixHour: string;
    twentyFourHour: string;
    sixHourBn: string;
    twentyFourHourBn: string;
  };
  smsAlertBn: string;
  aiAnalysis: string;
  aiAnalysisBn: string;
}

