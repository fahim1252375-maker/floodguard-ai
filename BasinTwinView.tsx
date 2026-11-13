import React, { useState } from 'react';
import {
  Network,
  ArrowRight,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  Waves,
  Mountain,
  ChevronDown,
  Activity,
  Layers,
} from 'lucide-react';
import { Language, BasinTwinNode } from '../types';
import { BASIN_TWIN_NODES, BASIN_TWIN_LINKS } from '../data/globalIntelligenceData';
import {
  calculateDownstreamLagTime,
  calculateUpstreamSurgeImpact,
  identifyBottlenecks,
} from '../utils/basinTwin';

interface BasinTwinViewProps {
  language: Language;
  onNavigate?: (view: string, id?: string) => void;
}

export const BasinTwinView: React.FC<BasinTwinViewProps> = ({ language, onNavigate }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('meghalaya-catchment');

  const selectedNode =
    BASIN_TWIN_NODES.find((n) => n.stationId === selectedNodeId) || BASIN_TWIN_NODES[0];

  const upstreamImpact = calculateUpstreamSurgeImpact(
    selectedNode.stationId,
    BASIN_TWIN_NODES,
    BASIN_TWIN_LINKS
  );

  const bottlenecks = identifyBottlenecks(BASIN_TWIN_NODES, BASIN_TWIN_LINKS);

  const incomingLinks = BASIN_TWIN_LINKS.filter((l) => l.toStationId === selectedNode.stationId);
  const outgoingLinks = BASIN_TWIN_LINKS.filter((l) => l.fromStationId === selectedNode.stationId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                {language === 'en' ? 'Illustrative Basin Scenario Graph' : 'হাইড্রোলজিক্যাল রিভার গ্রাফ ইঞ্জিন'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                Directed Acyclic Graph (DAG)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'en' ? 'BasinTwin: Upstream Catchment to Haor Sink' : 'বেসিনটুইন: উজান অববাহিকা থেকে হাওর অবক্ষেপণ'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              {language === 'en'
                ? 'Explore an illustrative upstream-to-downstream river network using fixed example values and assumed travel-lag parameters. This is not a live hydraulic model or a calibrated crest forecast.'
                : 'স্থির উদাহরণ মান ও অনুমানভিত্তিক যাত্রাকাল দিয়ে উজান থেকে ভাটির নদী নেটওয়ার্ক দেখানো হয়েছে। এটি live hydraulic model বা calibrated crest forecast নয়।'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {language === 'en' ? 'Total Graph Nodes' : 'গ্রাফ নোড সংখ্যা'}
              </span>
              <span className="text-lg font-bold text-cyan-400 font-mono">
                {BASIN_TWIN_NODES.length} Example Nodes
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {language === 'en' ? 'Active Bottlenecks' : 'চিহ্নিত প্রতিবন্ধকতা'}
              </span>
              <span className="text-lg font-bold text-amber-400 font-mono">
                {bottlenecks.length} Critical
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario data disclosure */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-100 leading-relaxed">
        <strong className="text-amber-300">SIMULATED SCENARIO — NOT LIVE RIVER STATUS.</strong> Node water levels, breach flags, exposed-population estimates, connectivity and travel-lag values are static illustrative inputs. Do not use them for evacuation or operational decisions.
      </div>

      {/* Main Grid: Network Flow Chart + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: River Network Flow Cascades */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-400" />
                {language === 'en' ? 'Hydraulic Propagation Cascade' : 'জলপ্রবাহ ও ঢল সঞ্চালন পরিক্রমা'}
              </h2>
              <span className="text-xs text-slate-400">
                {language === 'en' ? 'Click any node to inspect lag & inflows' : 'নোডে ক্লিক করে বিস্তারিত দেখুন'}
              </span>
            </div>

            {/* Visual Node Sequence */}
            <div className="space-y-3">
              {BASIN_TWIN_NODES.map((node, idx) => {
                const isSelected = node.stationId === selectedNodeId;
                const isSource = node.directUpstreamIds.length === 0;
                const isSink = node.directDownstreamIds.length === 0;

                return (
                  <div
                    key={node.stationId}
                    onClick={() => setSelectedNodeId(node.stationId)}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                        : node.isBreached
                        ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700/80'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                            isSource
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isSink
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100">{node.stationName}</span>
                            {node.isBreached && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Scenario Threshold
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{node.riverName} • {node.basinName}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-cyan-300">
                          {node.currentLevelM.toFixed(2)} m
                          <span className="text-[11px] font-normal text-slate-400 ml-1">
                            (DL: {node.dangerLevelM.toFixed(2)}m)
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Elev: {node.elevationM}m MSL • Rise: +{node.rateOfRiseM24h}m/24h
                        </span>
                      </div>
                    </div>

                    {/* Mini Flow Indicator */}
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Clock className="w-3 h-3" />
                        {node.calculatedDownstreamSurgeETA}
                      </span>
                      <span className="font-mono text-slate-400">
                        Exposure: {node.downstreamExposurePop.toLocaleString()} pop
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upstream to Downstream Links Table */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              {language === 'en' ? 'Direct Hydrologic Link Parameters' : 'নদী চ্যানেল ও প্রবাহের গতিপথ প্যারামিটার'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-semibold">
                    <th className="py-2 px-3">Reach / Channel</th>
                    <th className="py-2 px-3">Distance</th>
                    <th className="py-2 px-3">Travel Lag</th>
                    <th className="py-2 px-3">Gradient</th>
                    <th className="py-2 px-3">Upstream Contrib.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {BASIN_TWIN_LINKS.map((link, idx) => {
                    const fromNode = BASIN_TWIN_NODES.find((n) => n.stationId === link.fromStationId);
                    const toNode = BASIN_TWIN_NODES.find((n) => n.stationId === link.toStationId);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-200">{link.riverName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {fromNode?.stationName.split(' ')[0]} → {toNode?.stationName.split(' ')[0]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{link.distanceKm} km</td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300 font-bold">
                          {link.travelLagHours} hrs
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{link.slopeGradient}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          {Math.round(link.upstreamContributionRatio * 100)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Node Inspector & Bottleneck Diagnostic */}
        <div className="space-y-4">
          {/* Active Node Detail Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                  {language === 'en' ? 'Inspected Node' : 'নির্বাচিত হাইড্রোলজিক নোড'}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedNode.stationName}</h3>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-bold font-mono ${
                  selectedNode.isBreached
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {selectedNode.isBreached ? 'SCENARIO FLAG' : 'NO SCENARIO FLAG'}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Elevation</span>
                <span className="text-sm font-mono font-bold text-slate-100">
                  {selectedNode.elevationM} m MSL
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Stage vs Danger</span>
                <span
                  className={`text-sm font-mono font-bold ${
                    selectedNode.isBreached ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {(selectedNode.currentLevelM - selectedNode.dangerLevelM > 0 ? '+' : '') +
                    (selectedNode.currentLevelM - selectedNode.dangerLevelM).toFixed(2)}
                  m
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Upstream Rain</span>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {selectedNode.upstreamRainfallMm} mm
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Exposure</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {selectedNode.downstreamExposurePop.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Upstream Surge Impact Calculation */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {language === 'en' ? 'Upstream Inflow Surge Index' : 'উজান ঢল চাপ সূচক'}
                </span>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {upstreamImpact.surgePressureIndex} / 100
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    upstreamImpact.surgePressureIndex > 70
                      ? 'bg-rose-500'
                      : upstreamImpact.surgePressureIndex > 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${upstreamImpact.surgePressureIndex}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {upstreamImpact.criticalUpstreamSources.length > 0
                  ? `Critical inflow pressure transmitted from: ${upstreamImpact.criticalUpstreamSources.join(', ')}.`
                  : 'No breached upstream stations feeding into this node.'}
              </p>
            </div>

            {/* Travel Lag from Meghalaya Catchment */}
            {selectedNode.stationId !== 'meghalaya-catchment' && (
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs">
                <span className="text-[11px] font-bold text-cyan-300 block mb-1">
                  {language === 'en' ? 'Estimated Transboundary Surge Lag' : 'সীমান্তবর্তী ঢল পৌঁছানোর আনুমানিক সময়'}
                </span>
                <div className="flex items-center gap-2 text-slate-200 font-mono text-sm">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>
                    {calculateDownstreamLagTime('meghalaya-catchment', selectedNode.stationId, BASIN_TWIN_LINKS)} Hours
                  </span>
                  <span className="text-xs text-slate-400 font-sans">from Cherrapunji crest</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottleneck Alerts */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {language === 'en' ? 'Hydraulic Drainage Bottlenecks' : 'পানি নিষ্কাশন প্রতিবন্ধকতা সতর্কতা'}
            </h3>
            <div className="space-y-2">
              {bottlenecks.map((b) => {
                const node = BASIN_TWIN_NODES.find((n) => n.stationId === b.stationId);
                return (
                  <div
                    key={b.stationId}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200">{node?.stationName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {b.bottleneckSeverity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{b.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
