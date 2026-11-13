import React, { useState, useRef, useEffect } from 'react';
import { LocationData, Language } from '../../types';
import {
  computeHealthRisk,
  computeHealthRiskProjection,
  HealthRiskOutput,
  HealthRiskProjectionPoint,
  SAMPLE_SHELTER_MEDICAL_BOARD,
} from '../../utils/healthRisk';
import {
  Droplets,
  Activity,
  Stethoscope,
  ChevronRight,
  Waves,
  ShieldAlert,
  Clock,
  Layers,
  X,
  ExternalLink,
  Table,
} from 'lucide-react';
import { t } from '../../utils/translations';

interface HealthRadarProps {
  locations: LocationData[];
  language: Language;
  onNavigate: (view: string, targetId?: string) => void;
  cherrapunjiRainfall24h?: number | null;
  weatherStatus?: 'loading' | 'live' | 'stale' | 'offline' | 'simulated';
  highestDiseaseScore?: number | null;
  selectedUpazilaId?: string;
  onSelectUpazila?: (id: string) => void;
}

export type RadarLayer = 'flood' | 'disease' | 'clinic' | 'shelter';
export type ForecastHour = 0 | 12 | 24 | 36 | 48;

// Coordinate table keyed strictly by Location ID (Phase 3.6)
export const SCHEMATIC_COORDINATES: Record<
  string,
  { x: number; y: number; riverEn: string; riverBn: string; corridor: 'surma' | 'kushiyara' | 'haor' }
> = {
  'loc-1': { x: 180, y: 110, riverEn: 'Sari-Gowain', riverBn: 'সারি-গোয়াইন', corridor: 'surma' }, // Gowainghat
  'loc-2': { x: 270, y: 125, riverEn: 'Dhalai', riverBn: 'ধলাই', corridor: 'surma' }, // Companiganj
  'loc-3': { x: 80, y: 195, riverEn: 'Jadukata', riverBn: 'যাদুকাটা', corridor: 'surma' }, // Tahirpur
  'loc-4': { x: 195, y: 190, riverEn: 'Surma', riverBn: 'সুরমা', corridor: 'surma' }, // Chhatak
  'loc-5': { x: 125, y: 260, riverEn: 'Surma', riverBn: 'সুরমা', corridor: 'surma' }, // Sunamganj Sadar
  'loc-7': { x: 490, y: 120, riverEn: 'Kushiyara', riverBn: 'কুশিয়ারা', corridor: 'kushiyara' }, // Zakiganj
  'loc-6': { x: 380, y: 195, riverEn: 'Surma', riverBn: 'সুরমা', corridor: 'kushiyara' }, // Sylhet Sadar
  'loc-8': { x: 450, y: 260, riverEn: 'Kushiyara', riverBn: 'কুশিয়ারা', corridor: 'kushiyara' }, // Fenchuganj
  'loc-9': { x: 260, y: 320, riverEn: 'Kalni', riverBn: 'কালনী', corridor: 'haor' }, // Derai
};

export const HealthRadar: React.FC<HealthRadarProps> = ({
  locations,
  language,
  onNavigate,
  cherrapunjiRainfall24h = null,
  weatherStatus = 'live',
  highestDiseaseScore = null,
  selectedUpazilaId,
  onSelectUpazila,
}) => {
  const tr = t[language];
  const isBn = language === 'bn';

  // State for Time Scrubber (Phase 3.1)
  const [selectedHour, setSelectedHour] = useState<ForecastHour>(0);

  // State for Layer Switch (Phase 3.2)
  const [activeLayer, setActiveLayer] = useState<RadarLayer>('flood');

  // Selected / Hovered node state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);
  const [showAccessibleTable, setShowAccessibleTable] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const activeNodeId = hoveredNodeId || selectedUpazilaId || 'loc-1';
  const activeLocation = locations.find((l) => l.id === activeNodeId) || locations[0];

  // Derive Health Risk for Active Node
  const activeHealthRisk: HealthRiskOutput | null = activeLocation
    ? computeHealthRisk({
        district: activeLocation.district,
        upazilaEn: activeLocation.nameEn,
        upazilaBn: activeLocation.nameBn,
        floodRiskScore: activeLocation.riskScore,
        waterLevel: activeLocation.currentWaterLevel,
        dangerLevel: activeLocation.dangerLevel,
      })
    : null;

  // 48-Hour Health Risk Projection Timeline for Active Node
  const projectionResult = activeLocation
    ? computeHealthRiskProjection({
        district: activeLocation.district,
        nameEn: activeLocation.nameEn,
        nameBn: activeLocation.nameBn,
        currentWaterLevel: activeLocation.currentWaterLevel,
        dangerLevel: activeLocation.dangerLevel,
        warningLevel: activeLocation.warningLevel,
        riskScore: activeLocation.riskScore,
        rateOfRise24h: activeLocation.waterLevelChange24h,
      })
    : null;
  const healthTimeline: HealthRiskProjectionPoint[] = projectionResult?.timeline ?? [];

  // Determine if surge is actively in transit
  const maxRisk = Math.max(...locations.map((l) => l.riskScore), 0);
  const hasActiveSurge = maxRisk >= 58 || (cherrapunjiRainfall24h ?? 0) >= 60;
  const flowDurationSec = maxRisk >= 80 ? '1s' : maxRisk >= 60 ? '1.8s' : '3s';

  // Handle escape key on modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectedNodeId) {
        setInspectedNodeId(null);
        lastActiveElementRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectedNodeId]);

  // Derive layer node color
  const getNodeFillColor = (loc?: LocationData, hour: ForecastHour = selectedHour) => {
    if (!loc) return '#64748b';

    // In future hours, project score using rate of rise or projection timeline
    let effectiveRiskScore = loc.riskScore;
    if (hour > 0) {
      const riseBonus = Math.round((hour / 24) * (loc.waterLevelChange24h > 0 ? 15 : 5));
      effectiveRiskScore = Math.min(100, loc.riskScore + riseBonus);
    }

    if (activeLayer === 'flood') {
      if (effectiveRiskScore >= 78) return '#ef4444'; // Red (Critical)
      if (effectiveRiskScore >= 58) return '#f97316'; // Orange (High)
      if (effectiveRiskScore >= 35) return '#eab308'; // Amber (Moderate)
      return '#10b981'; // Green (Low)
    }

    if (activeLayer === 'disease') {
      const risk = computeHealthRisk({
        district: loc.district,
        upazilaEn: loc.nameEn,
        upazilaBn: loc.nameBn,
        floodRiskScore: effectiveRiskScore,
        waterLevel: loc.currentWaterLevel,
        dangerLevel: loc.dangerLevel,
      });
      if (risk.overallScore >= 75) return '#e11d48'; // Severe Rose
      if (risk.overallScore >= 55) return '#f43f5e'; // High Rose
      if (risk.overallScore >= 35) return '#fbbf24'; // Moderate
      return '#34d399'; // Low
    }

    if (activeLayer === 'clinic') {
      // Find matching shelter/clinic in mock board
      const shelter = SAMPLE_SHELTER_MEDICAL_BOARD.find((s) => s.upazilaEn.toLowerCase().includes(loc.nameEn.toLowerCase()));
      const status = shelter?.clinicAccessStatus ?? (loc.riskLevel === 'CRITICAL' ? 'CUT_OFF' : 'PASSABLE');
      if (status === 'CUT_OFF') return '#dc2626';
      if (status === 'WATERLOGGED') return '#d97706';
      return '#059669';
    }

    if (activeLayer === 'shelter') {
      // Shelter stock layer (SIMULATED)
      const shelter = SAMPLE_SHELTER_MEDICAL_BOARD.find((s) => s.upazilaEn.toLowerCase().includes(loc.nameEn.toLowerCase()));
      if (shelter?.shortageFlag) return '#f43f5e';
      return '#06b6d4';
    }

    return '#0891b2';
  };

  // Outer ring represents Disease Risk Tier
  const getDiseaseRingColor = (loc?: LocationData) => {
    if (!loc) return '#64748b';
    const risk = computeHealthRisk({
      district: loc.district,
      upazilaEn: loc.nameEn,
      upazilaBn: loc.nameBn,
      floodRiskScore: loc.riskScore,
      waterLevel: loc.currentWaterLevel,
      dangerLevel: loc.dangerLevel,
    });
    if (risk.overallTier === 'SEVERE') return '#f43f5e';
    if (risk.overallTier === 'HIGH') return '#fb7185';
    if (risk.overallTier === 'MODERATE') return '#f59e0b';
    return '#10b981';
  };

  // Node Click handler
  const handleNodeClick = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      lastActiveElementRef.current = e.currentTarget as HTMLElement;
    }
    setInspectedNodeId(id);
    if (onSelectUpazila) onSelectUpazila(id);
  };

  // Locations with known coordinates vs unmapped
  const mappedLocations = locations.filter((loc) => SCHEMATIC_COORDINATES[loc.id]);
  const unmappedLocations = locations.filter((loc) => !SCHEMATIC_COORDINATES[loc.id]);

  const inspectedLoc = locations.find((l) => l.id === inspectedNodeId);
  const inspectedHealth = inspectedLoc
    ? computeHealthRisk({
        district: inspectedLoc.district,
        upazilaEn: inspectedLoc.nameEn,
        upazilaBn: inspectedLoc.nameBn,
        floodRiskScore: inspectedLoc.riskScore,
        waterLevel: inspectedLoc.currentWaterLevel,
        dangerLevel: inspectedLoc.dangerLevel,
      })
    : null;

  return (
    <div className="relative rounded-2xl bg-slate-900/95 border border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col justify-between space-y-3">
      {/* Top Header: Title + Provenance + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
              {tr.healthRadarTitle}
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
              DERIVED
            </span>
            {activeLayer === 'shelter' && (
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 border border-purple-500/30 px-1.5 py-0.5 rounded">
                SIMULATED
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{tr.healthRadarSubtitle}</p>
        </div>

        {/* Layer Switcher & Table Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          <div
            className="inline-flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-semibold"
            role="tablist"
            aria-label="Radar Map Layer"
          >
            {(['flood', 'disease', 'clinic', 'shelter'] as RadarLayer[]).map((layer) => (
              <button
                key={layer}
                type="button"
                role="tab"
                aria-selected={activeLayer === layer}
                onClick={() => setActiveLayer(layer)}
                className={`px-2 py-1 rounded-md transition capitalize cursor-pointer ${
                  activeLayer === layer
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {layer === 'flood'
                  ? isBn
                    ? 'প্লাবন'
                    : 'Flood'
                  : layer === 'disease'
                  ? isBn
                    ? 'রোগ'
                    : 'Disease'
                  : layer === 'clinic'
                  ? isBn
                    ? 'ক্লিনিক'
                    : 'Clinics'
                  : isBn
                  ? 'আশ্রয়'
                  : 'Shelters'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAccessibleTable(!showAccessibleTable)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
            title="Toggle Accessible Data Table View"
            aria-label="Toggle Accessible Data Table View"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Time Scrubber (Phase 3.1) */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">{isBn ? 'পূর্বাভাস সময়সীমা:' : 'Forecast Horizon:'}</span>
        </div>

        <div className="inline-flex items-center gap-1 font-mono text-[11px]">
          {([0, 12, 24, 36, 48] as ForecastHour[]).map((hour) => (
            <button
              key={hour}
              type="button"
              onClick={() => setSelectedHour(hour)}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                selectedHour === hour
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {hour === 0 ? (isBn ? 'এখন' : 'Now') : `+${hour}h`}
            </button>
          ))}
        </div>

        {selectedHour > 0 && (
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 rounded hidden md:inline">
            DERIVED OLS +48H
          </span>
        )}
      </div>

      {/* Main SVG Schematic or Accessible Table View */}
      {showAccessibleTable ? (
        <div className="w-full aspect-[16/10] max-h-[300px] overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="pb-2">Upazila</th>
                <th className="pb-2">River</th>
                <th className="pb-2">Stage</th>
                <th className="pb-2">Danger Mark</th>
                <th className="pb-2">Risk</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-1.5 text-white font-sans font-semibold">
                    {isBn ? loc.nameBn : loc.nameEn}
                  </td>
                  <td className="py-1.5 text-slate-400">{isBn ? loc.riverNameBn : loc.riverNameEn}</td>
                  <td className="py-1.5 text-cyan-300">{loc.currentWaterLevel.toFixed(2)}m</td>
                  <td className="py-1.5 text-slate-400">{loc.dangerLevel.toFixed(2)}m</td>
                  <td className="py-1.5">
                    <span
                      className="px-1.5 py-0.2 rounded text-[10px] font-bold"
                      style={{ color: getNodeFillColor(loc), backgroundColor: `${getNodeFillColor(loc)}20` }}
                    >
                      {loc.riskLevel}
                    </span>
                  </td>
                  <td className="py-1.5">
                    <button
                      type="button"
                      onClick={() => handleNodeClick(loc.id)}
                      className="text-cyan-400 hover:underline text-[11px]"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative w-full aspect-[16/10] max-h-[290px] overflow-hidden rounded-xl bg-slate-950 border border-slate-800/70 flex items-center justify-center">
          <svg
            viewBox="0 0 580 370"
            className="w-full h-full select-none"
            role="img"
            aria-label="Basin Hydrological & Disease Radar Schematic"
          >
            <style>{`
              @keyframes radarDashFlow {
                to {
                  stroke-dashoffset: -32;
                }
              }
              .flow-dash {
                animation: ${hasActiveSurge ? `radarDashFlow ${flowDurationSec} linear infinite` : 'none'};
              }
              @media (prefers-reduced-motion: reduce) {
                .flow-dash {
                  animation: none !important;
                }
              }
            `}</style>

            {/* Background gridlines */}
            <line x1="40" y1="90" x2="540" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="180" x2="540" y2="180" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="270" x2="540" y2="270" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="290" y1="20" x2="290" y2="350" stroke="#1e293b" strokeDasharray="3 3" />

            {/* River Flow Lines with Hydraulic Corridors */}
            {/* North/Surma Corridor */}
            <path d="M 310,40 Q 240,65 180,110" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeDasharray={hasActiveSurge ? '6 4' : 'none'} className="flow-dash" opacity="0.85" />
            <path d="M 310,40 Q 290,75 270,125" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeDasharray={hasActiveSurge ? '6 4' : 'none'} className="flow-dash" opacity="0.85" />
            <path d="M 180,110 Q 185,150 195,190" fill="none" stroke="#0891b2" strokeWidth="2" strokeDasharray={hasActiveSurge ? '5 3' : 'none'} className="flow-dash" opacity="0.75" />
            <path d="M 270,125 Q 230,160 195,190" fill="none" stroke="#0891b2" strokeWidth="2" strokeDasharray={hasActiveSurge ? '5 3' : 'none'} className="flow-dash" opacity="0.75" />
            <path d="M 195,190 Q 150,225 125,260" fill="none" stroke="#0891b2" strokeWidth="2" strokeDasharray={hasActiveSurge ? '5 3' : 'none'} className="flow-dash" opacity="0.75" />
            <path d="M 180,110 Q 110,150 80,195" fill="none" stroke="#0891b2" strokeWidth="2" strokeDasharray={hasActiveSurge ? '5 3' : 'none'} className="flow-dash" opacity="0.7" />
            <path d="M 80,195 Q 100,230 125,260" fill="none" stroke="#0891b2" strokeWidth="2" strokeDasharray={hasActiveSurge ? '5 3' : 'none'} className="flow-dash" opacity="0.7" />

            {/* East/Kushiyara Corridor */}
            <path d="M 310,40 Q 400,75 490,120" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray={hasActiveSurge ? '6 4' : 'none'} className="flow-dash" opacity="0.85" />
            <path d="M 310,40 Q 350,115 380,195" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray={hasActiveSurge ? '5 3' : 'none'} className="flow-dash" opacity="0.75" />
            <path d="M 490,120 Q 470,190 450,260" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray={hasActiveSurge ? '5 3' : 'none'} className="flow-dash" opacity="0.75" />
            <path d="M 380,195 Q 420,230 450,260" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray={hasActiveSurge ? '4 3' : 'none'} className="flow-dash" opacity="0.65" />

            {/* Haor Confluence */}
            <path d="M 125,260 Q 200,290 260,320" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray={hasActiveSurge ? '5 3' : 'none'} className="flow-dash" opacity="0.8" />
            <path d="M 450,260 Q 350,300 260,320" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray={hasActiveSurge ? '5 3' : 'none'} className="flow-dash" opacity="0.8" />

            {/* Cherrapunji Inflow Headwater Node */}
            <g transform="translate(310, 40)" tabIndex={0} role="button" aria-label="Cherrapunji Runoff Inflow Headwaters">
              <rect x="-85" y="-18" width="170" height="32" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
              <circle cx="-65" cy="-2" r="4" fill="#38bdf8" />
              <text x="-52" y="3" fill="#e2e8f0" fontSize="11" fontWeight="700" fontFamily="sans-serif">
                Meghalaya (Cherrapunji)
              </text>
              <text x="-52" y="11" fill="#38bdf8" fontSize="8" fontFamily="monospace">
                {cherrapunjiRainfall24h !== null ? `${cherrapunjiRainfall24h.toFixed(1)} mm / 24h` : '— mm / 24h'}
              </text>
            </g>

            {/* Upazila Nodes */}
            {mappedLocations.map((loc) => {
              const coords = SCHEMATIC_COORDINATES[loc.id];
              const fillColor = getNodeFillColor(loc);
              const diseaseRing = getDiseaseRingColor(loc);
              const isHovered = activeNodeId === loc.id;

              return (
                <g
                  key={loc.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  className="cursor-pointer focus:outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`${loc.nameEn} station node. Risk level: ${loc.riskLevel}`}
                  onMouseEnter={() => setHoveredNodeId(loc.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={(e) => handleNodeClick(loc.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNodeClick(loc.id, e);
                    }
                  }}
                >
                  {/* Active highlight aura */}
                  {isHovered && (
                    <circle cx="0" cy="0" r="19" fill="none" stroke={fillColor} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.85" />
                  )}

                  {/* Outer Ring: Disease Risk Tier (Phase 3.2) */}
                  <circle cx="0" cy="0" r={isHovered ? 12 : 10} fill="none" stroke={diseaseRing} strokeWidth="2" strokeDasharray="3 2" />

                  {/* Center Node Circle: Fill determines active layer */}
                  <circle cx="0" cy="0" r={isHovered ? 8 : 6.5} fill="#020617" stroke={fillColor} strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="3" fill={fillColor} />

                  {/* Node Name Label */}
                  <text
                    x="0"
                    y="20"
                    textAnchor="middle"
                    fill={isHovered ? '#ffffff' : '#cbd5e1'}
                    fontSize={isHovered ? '10' : '9'}
                    fontWeight={isHovered ? '700' : '500'}
                    fontFamily="sans-serif"
                  >
                    {isBn ? loc.nameBn : loc.nameEn}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip Card for Active Node */}
          {activeLocation && activeHealthRisk && (
            <div className="absolute bottom-2 right-2 max-w-[240px] rounded-lg bg-slate-900/95 border border-slate-700/80 p-2.5 shadow-2xl backdrop-blur text-[11px] pointer-events-none">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-white">
                  {isBn ? activeLocation.nameBn : activeLocation.nameEn}
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold"
                  style={{
                    backgroundColor: `${getNodeFillColor(activeLocation)}20`,
                    color: getNodeFillColor(activeLocation),
                  }}
                >
                  {activeLocation.riskLevel}
                </span>
              </div>

              <div className="space-y-0.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">{tr.stationStage}</span>
                  <span className="font-mono tabular-nums font-semibold">
                    {activeLocation.currentWaterLevel.toFixed(2)}m
                    <span className="text-[9px] text-slate-400 ml-1">
                      ({activeLocation.currentWaterLevel - activeLocation.dangerLevel >= 0 ? '+' : ''}
                      {(activeLocation.currentWaterLevel - activeLocation.dangerLevel).toFixed(2)}m DL)
                    </span>
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-800 pt-1 mt-1 text-[10px]">
                  <span className="text-rose-300 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3 text-rose-400" />
                    {tr.highestDiseaseIndex}:
                  </span>
                  <span className="font-mono font-bold text-rose-300">
                    {activeHealthRisk.overallScore}/100
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unmapped locations fallback list (Phase 3.6) */}
      {unmappedLocations.length > 0 && (
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
          <span className="text-slate-400 font-medium mr-2">
            {isBn ? 'অন্যান্য পর্যবেক্ষণ স্টেশন:' : 'Additional Monitored Stations:'}
          </span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            {unmappedLocations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={(e) => handleNodeClick(loc.id, e)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 font-mono text-[10px]"
              >
                {isBn ? loc.nameBn : loc.nameEn} ({loc.currentWaterLevel.toFixed(2)}m)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Disease-Specific Health Pressure Mini Bars (Phase 3.5 & 4.3) */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-mono font-bold text-rose-400 tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-rose-400" />
            <span>{isBn ? 'রোগ বিস্তার সূচক (৪টি প্রধান সংক্রামক)' : 'Disease Pressure Breakdown'}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">DERIVED • HEURISTIC</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {activeHealthRisk?.diseaseBreakdown?.map((dis) => {
            const isSevere = dis.tier === 'SEVERE';
            const isHigh = dis.tier === 'HIGH';
            const barColor = isSevere ? 'bg-rose-500' : isHigh ? 'bg-amber-400' : 'bg-emerald-400';

            return (
              <div key={dis.id} className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-200 font-semibold truncate">
                    {isBn ? dis.nameBn : dis.nameEn}
                  </span>
                  <span className="font-mono font-bold text-slate-100">{dis.score}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${dis.score}%` }} />
                </div>
                <div className="text-[9px] text-slate-400 flex items-center justify-between font-mono">
                  <span>{dis.tier}</span>
                  <span>{dis.score >= 50 ? 'SURGE' : 'STEADY'}</span>
                </div>
              </div>
            );
          }) ?? (
            <div className="col-span-4 text-center py-2 text-slate-400 text-xs font-mono">
              — {isBn ? 'রোগ বিস্তার উপাত্ত অপর্যাপ্ত' : 'Disease telemetry unavailable'}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Node Details Modal (Phase 3.4) */}
      {inspectedNodeId && inspectedLoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${inspectedLoc.nameEn} Hydrological & Health Detail`}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            ref={modalRef}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4 text-xs"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {isBn ? inspectedLoc.nameBn : inspectedLoc.nameEn}
                  </h3>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                      backgroundColor: `${getNodeFillColor(inspectedLoc)}20`,
                      color: getNodeFillColor(inspectedLoc),
                    }}
                  >
                    {inspectedLoc.riskLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isBn ? inspectedLoc.riverNameBn : inspectedLoc.riverNameEn} • {inspectedLoc.stationName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedNodeId(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-sans">Current Stage</span>
                <span className="text-white font-bold text-sm">{inspectedLoc.currentWaterLevel.toFixed(2)}m</span>
                <span className="text-[9px] text-slate-400 block">DL {inspectedLoc.dangerLevel.toFixed(2)}m</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-sans">24h Change</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {inspectedLoc.waterLevelChange24h >= 0 ? '+' : ''}
                  {inspectedLoc.waterLevelChange24h.toFixed(2)}m
                </span>
                <span className="text-[9px] text-slate-400 block">{inspectedLoc.rainfallTrend}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-sans">Disease Index</span>
                <span className="text-rose-400 font-bold text-sm">
                  {inspectedHealth?.overallScore ?? '—'}/100
                </span>
                <span className="text-[9px] text-slate-400 block">{inspectedHealth?.overallTier ?? '—'}</span>
              </div>
            </div>

            {/* Top 3 Contributing Risk Drivers */}
            {inspectedHealth && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  {isBn ? 'প্রধান ঝুঁকি উপাদানসমূহ' : 'Top Contributing Factors'}
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {(isBn ? inspectedHealth.topFactorsBn : inspectedHealth.topFactorsEn).slice(0, 3).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Action Navigation Buttons */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setInspectedNodeId(null);
                  onNavigate('healthWatch', inspectedLoc.id);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <span>{tr.navHealthWatch}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setInspectedNodeId(null);
                  onNavigate('prediction', inspectedLoc.id);
                }}
                className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <span>{tr.navPrediction}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
