import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Waves,
  CloudRain,
  ShieldAlert,
  Users,
  Compass,
  Maximize2,
  Minimize2,
  Info,
  Sparkles,
} from 'lucide-react';
import { LocationData, CommunityReport, Language } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { t } from '../utils/translations';

interface MapViewProps {
  locations: LocationData[];
  reports: CommunityReport[];
  preselectedLocationId?: string | null;
  language: Language;
  onNavigate: (view: string, targetId?: string) => void;
  onSelectLocationForPrediction: (loc: LocationData) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  locations,
  reports,
  preselectedLocationId,
  language,
  onNavigate,
  onSelectLocationForPrediction,
}) => {
  const tr = t[language];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const reportsLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    locations.find((l) => l.id === preselectedLocationId) || locations[0]
  );

  // Layer Toggles
  const [showRiverGauges, setShowRiverGauges] = useState(true);
  const [showRainfallClusters, setShowRainfallClusters] = useState(true);
  const [showHaorZones, setShowHaorZones] = useState(true);
  const [showCommunityPins, setShowCommunityPins] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Center on Sylhet / Sunamganj haor basin (~25.0° N, 91.8° E)
    const map = L.map(mapContainerRef.current, {
      center: [25.04, 91.75],
      zoom: 9,
      zoomControl: true,
      attributionControl: false,
    });

    // Standard OpenStreetMap Tiles (free, open, no API key required)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      className: 'map-tiles-dark',
    }).addTo(map);

    // Attribution
    L.control
      .attribution({
        position: 'bottomright',
        prefix: '© OpenStreetMap contributors, BWDB Hydrology, FloodGuard AI',
      })
      .addTo(map);

    mapInstanceRef.current = map;

    // Create Layer Groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    zonesLayerRef.current = L.layerGroup().addTo(map);
    reportsLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Markers and Features when state updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Clear previous layers
    markersLayerRef.current?.clearLayers();
    zonesLayerRef.current?.clearLayers();
    reportsLayerRef.current?.clearLayers();

    // 2. Render Haor Wetland Vulnerability Geometries
    if (showHaorZones && zonesLayerRef.current) {
      // Tanguar Haor Ramsar Site (Tahirpur)
      L.circle([25.12, 91.15], {
        radius: 12000,
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 4',
      })
        .bindPopup('<strong class="text-slate-900">Tanguar Haor Ramsar Basin</strong><br><span class="text-xs">High Flash Flood Retention Basin</span>')
        .addTo(zonesLayerRef.current);

      // Hakaluki Haor Basin (Fenchuganj/Kulaura)
      L.circle([24.58, 92.03], {
        radius: 14000,
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4',
      })
        .bindPopup('<strong class="text-slate-900">Hakaluki Haor Wetland</strong><br><span class="text-xs">Major agricultural drainage sink</span>')
        .addTo(zonesLayerRef.current);

      // Dekhar Haor (Sunamganj Sadar & Dowarabazar)
      L.circle([25.02, 91.50], {
        radius: 9000,
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.15,
        weight: 1.5,
      })
        .bindPopup('<strong class="text-slate-900">Dekhar Haor Embankment Zone</strong><br><span class="text-xs">Vulnerable low dyke reach</span>')
        .addTo(zonesLayerRef.current);
    }

    // 3. Render River Gauge Markers
    if (showRiverGauges && markersLayerRef.current) {
      locations.forEach((loc) => {
        const color =
          loc.riskLevel === 'CRITICAL'
            ? '#f43f5e'
            : loc.riskLevel === 'HIGH'
            ? '#f97316'
            : loc.riskLevel === 'MODERATE'
            ? '#fbbf24'
            : '#10b981';

        const diff = loc.currentWaterLevel - loc.dangerLevel;
        const isBreached = diff >= 0;

        // Custom HTML marker pin with pulse halo
        const customIcon = L.divIcon({
          className: 'custom-flood-pin',
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
              <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: ${color}; opacity: 0.4; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background-color: #0b1120; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                <span style="width: 10px; height: 10px; border-radius: 9999px; background-color: ${color};"></span>
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker(loc.coordinates, { icon: customIcon });

        marker.on('click', () => {
          setSelectedLocation(loc);
        });

        marker.bindTooltip(
          `<strong>${loc.nameEn}</strong><br>${loc.riverNameEn}<br>Stage: ${loc.currentWaterLevel.toFixed(2)}m (${isBreached ? '+DL' : '-DL'})`,
          { direction: 'top', offset: [0, -10] }
        );

        marker.addTo(markersLayerRef.current!);
      });
    }

    // 4. Render Community Field Reports Pins
    if (showCommunityPins && reportsLayerRef.current) {
      reports.forEach((rep) => {
        if (rep.coordinates) {
          const repIcon = L.divIcon({
            className: 'custom-report-pin',
            html: `
              <div style="width: 22px; height: 22px; border-radius: 6px; background-color: #0284c7; border: 1.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.6);">
                <span style="font-size: 10px; color: white; font-weight: bold;">R</span>
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const repMarker = L.marker(rep.coordinates, { icon: repIcon });
          repMarker.bindPopup(`
            <div style="color: #0f172a; font-size: 11px;">
              <strong>${rep.reporterName}</strong><br>
              ${rep.villageOrArea} (${rep.upazilaEn})<br>
              <em>Water Depth: ${rep.waterDepthValue} ${rep.waterDepthUnit}</em><br>
              <span style="color: ${rep.status === 'verified' ? '#059669' : '#d97706'}">${rep.status.toUpperCase()}</span>
            </div>
          `);
          repMarker.addTo(reportsLayerRef.current!);
        }
      });
    }
  }, [locations, reports, showRiverGauges, showRainfallClusters, showHaorZones, showCommunityPins]);

  // Center on station when selected
  const flyToLocation = (loc: LocationData) => {
    setSelectedLocation(loc);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(loc.coordinates, 11, { duration: 1.2 });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-6 h-6 text-cyan-400" />
              <span>{tr.navMap}</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Leaflet GIS & Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Real-time spatial visualization of BWDB river monitoring gauges and haor vulnerability zones'
              : 'সুরমা ও কুশিয়ারা অববাহিকার নদীর পানি, বৃষ্টিপাত এবং বিপদসীমা সংবলিত ভৌগোলিক মানচিত্র'}
          </p>
        </div>

        {/* Quick Location Fly-to Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([25.04, 91.75], 9, { duration: 1 });
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:border-cyan-500 transition"
          >
            {language === 'en' ? 'Reset Haor Basin View' : 'পুরো হাওর এলাকা'}
          </button>
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([24.8949, 91.8687], 11, { duration: 1 });
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-cyan-300 hover:text-white hover:border-cyan-500 transition"
          >
            Sylhet Sadar
          </button>
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([25.0658, 91.4073], 11, { duration: 1 });
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-cyan-300 hover:text-white hover:border-cyan-500 transition"
          >
            Sunamganj Sadar
          </button>
        </div>
      </div>

      {/* Map Layout: GIS Window (8 cols) + Detail Drawer (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Map Surface (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {/* Layer toggles bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              GIS Layers:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowRiverGauges(!showRiverGauges)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  showRiverGauges
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                <Waves className="w-3 h-3" />
                <span>River Gauges</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  DERIVED: BWDB
                </span>
              </button>

              <button
                onClick={() => setShowHaorZones(!showHaorZones)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  showHaorZones
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                <Compass className="w-3 h-3" />
                <span>Haor Wetlands</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-500/30">
                  SPATIAL: RAMSAR
                </span>
              </button>

              <button
                onClick={() => setShowCommunityPins(!showCommunityPins)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  showCommunityPins
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Field Reports ({reports.length})</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  COMMUNITY: LIVE
                </span>
              </button>
            </div>
          </div>

          {/* Leaflet Map Element */}
          <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-20 p-3 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md text-[11px] space-y-1.5 shadow-xl">
              <span className="font-bold text-white block text-[10px] uppercase tracking-wider">
                Risk Classification Halo
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-300 font-semibold">Critical (Above Danger Mark)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span className="text-orange-300">High Risk (At Warning Mark)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-amber-300">Moderate Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-300">Low Risk (Normal Capacity)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selected Station Telemetry Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedLocation ? (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                    Station Telemetry Inspector
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {language === 'en' ? selectedLocation.nameEn : selectedLocation.nameBn}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {language === 'en' ? selectedLocation.riverNameEn : selectedLocation.riverNameBn}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    BWDB Station: {selectedLocation.stationName}
                  </p>
                </div>
                <RiskBadge level={selectedLocation.riskLevel} language={language} size="md" />
              </div>

              {/* Water Stage Gauge Meter */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Current River Stage:</span>
                  <span className="text-2xl font-black font-mono text-white">
                    {selectedLocation.currentWaterLevel.toFixed(2)} m
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedLocation.riskLevel === 'CRITICAL'
                        ? 'bg-rose-500'
                        : selectedLocation.riskLevel === 'HIGH'
                        ? 'bg-orange-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedLocation.currentWaterLevel / (selectedLocation.dangerLevel + 1.5)) * 100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Warning: {selectedLocation.warningLevel.toFixed(2)}m</span>
                  <span className="font-bold text-rose-400">
                    Danger: {selectedLocation.dangerLevel.toFixed(2)}m
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs font-semibold flex justify-between">
                  <span className="text-slate-400">Delta vs Danger:</span>
                  <span
                    className={
                      selectedLocation.currentWaterLevel >= selectedLocation.dangerLevel
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }
                  >
                    {selectedLocation.currentWaterLevel >= selectedLocation.dangerLevel
                      ? `+${(selectedLocation.currentWaterLevel - selectedLocation.dangerLevel).toFixed(2)}m (FLOODED)`
                      : `${(selectedLocation.dangerLevel - selectedLocation.currentWaterLevel).toFixed(2)}m below DL`}
                  </span>
                </div>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">24h Rainfall</span>
                  <span className="text-base font-bold font-mono text-sky-400">
                    {selectedLocation.rainfall24h} mm
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">24h Crest Rise</span>
                  <span className="text-base font-bold font-mono text-amber-300">
                    +{selectedLocation.waterLevelChange24h.toFixed(2)} m
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Exposed Residents</span>
                  <span className="text-base font-bold font-mono text-white">
                    {(selectedLocation.populationExposed / 1000).toFixed(0)}k
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Active Shelters</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {selectedLocation.sheltersCount}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onSelectLocationForPrediction(selectedLocation);
                    onNavigate('prediction');
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Launch AI Assessment' : 'এআই মূল্যায়ন চালু করুন'}</span>
                </button>

                <button
                  onClick={() => onNavigate('simulator', selectedLocation.id)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition flex items-center justify-center gap-2"
                >
                  <span>{language === 'en' ? 'Simulate Stress Scenarios' : 'বন্যা পরিস্থিতি সিমুলেট করুন'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
              Select any station marker on the map to inspect live hydrology data.
            </div>
          )}

          {/* Quick List of Stations to Jump */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              All Monitored Stations ({locations.length})
            </span>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => flyToLocation(loc)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                    selectedLocation?.id === loc.id
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <span>{loc.nameEn}</span>
                  <RiskBadge level={loc.riskLevel} language={language} size="sm" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
