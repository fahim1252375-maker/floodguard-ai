import React, { useState } from 'react';
import {
  History,
  Download,
  Calendar,
  Waves,
  CloudRain,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  ChevronRight,
  Filter,
  CheckCircle2,
  Table,
  Layers,
  Activity,
  Clock,
  MapPin,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { HistoricalRecord, Language, LocationData } from '../types';
import { HISTORICAL_RECORDS } from '../data/mockData';
import { t } from '../utils/translations';
import { BacktestSummary } from '../utils/june2022Backtest';
import {
  generateFilteredWaterLevelRainfallCSV,
  downloadCsvFile,
  filterHistoricalDataset,
} from '../utils/csvExport';
import {
  getStationWaterLevelTrend,
  calculateTrendMetrics,
  compute48hLinearRegression,
  buildCompositeTrendSeries,
  generateStationWaterLevelCSV,
  TREND_TIMEFRAMES,
  TrendTimeframe,
  StationTrendPoint,
  LinearRegressionResult,
} from '../utils/stationTrends';

interface HistoricalViewProps {
  locations: LocationData[];
  language: Language;
}

export const HistoricalView: React.FC<HistoricalViewProps> = ({
  locations,
  language,
}) => {
  const tr = t[language];
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'events' | 'stations'>('events');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string>(locations[0]?.id || 'sylhet-sadar');
  const [timeframe, setTimeframe] = useState<TrendTimeframe>('2022_peak');
  const [showForecastOverlay, setShowForecastOverlay] = useState<boolean>(false);

  // June 2022 Flood Algorithmic Backtest State
  const [backtestData, setBacktestData] = useState<BacktestSummary | null>(null);
  const [isBacktestLoading, setIsBacktestLoading] = useState<boolean>(false);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  const fetchBacktest = async () => {
    try {
      setIsBacktestLoading(true);
      setBacktestError(null);
      const res = await fetch('/api/backtest/june2022');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BacktestSummary = await res.json();
      setBacktestData(data);
    } catch (err: any) {
      console.warn('Failed to load June 2022 backtest:', err);
      setBacktestError(err?.message || 'Could not fetch archive backtest');
    } finally {
      setIsBacktestLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBacktest();
  }, []);

  // Currently selected station for the line chart hydrograph
  const selectedStation = locations.find((l) => l.id === selectedStationId) || locations[0];
  const baseTrendData: StationTrendPoint[] = selectedStation
    ? getStationWaterLevelTrend(selectedStation, timeframe)
    : [];
  
  // Linear regression projection for next 48 hours
  const linearRegression = selectedStation
    ? compute48hLinearRegression(baseTrendData, selectedStation)
    : null;

  // Composite trend data combining observed points and seamless forecast curve
  const displayTrendData: StationTrendPoint[] = buildCompositeTrendSeries(
    baseTrendData,
    linearRegression,
    showForecastOverlay
  );

  const trendMetrics = selectedStation
    ? calculateTrendMetrics(displayTrendData, selectedStation.dangerLevel)
    : null;

  // Y-axis dynamic domain
  const allValues = displayTrendData
    .map((d) => (typeof d.waterLevel === 'number' ? d.waterLevel : d.forecastWaterLevel))
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const minVal = Math.min(...(allValues.length ? allValues : [selectedStation?.warningLevel || 10]), selectedStation?.warningLevel || 10);
  const maxVal = Math.max(...(allValues.length ? allValues : [selectedStation?.dangerLevel || 12]), selectedStation?.dangerLevel || 12);
  const yDomainMin = Number((Math.floor(minVal * 2) / 2 - 0.4).toFixed(1));
  const yDomainMax = Number((Math.ceil(maxVal * 2) / 2 + 0.4).toFixed(1));

  // Export currently displayed water-level data as CSV
  const handleExportDisplayedWaterLevelCSV = () => {
    if (!selectedStation) return;
    const csvContent = generateStationWaterLevelCSV(
      selectedStation,
      timeframe,
      displayTrendData,
      linearRegression,
      showForecastOverlay
    );

    const forecastSuffix = showForecastOverlay ? '_with_48hForecast' : '';
    const fileName = `FloodGuard_${selectedStation.id}_WaterLevel_${timeframe}${forecastSuffix}.csv`;

    downloadCsvFile(csvContent, fileName);

    const successMsg =
      language === 'en'
        ? `Successfully exported ${displayTrendData.length} water-level records for ${selectedStation.stationName} to ${fileName}`
        : `${selectedStation.stationName} স্টেশনের ${displayTrendData.length}টি পানির স্তরের ডেটা সফলভাবে ${fileName} ফাইলে ডাউনলোড হয়েছে।`;

    setExportNotice(successMsg);
    setTimeout(() => {
      setExportNotice(null);
    }, 4500);
  };

  // Custom Dark Tooltip for Station Hydrograph LineChart
  const CustomHydroTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: StationTrendPoint = payload[0].payload;
      const isForecast = data.isForecast;
      const currentStage = typeof data.waterLevel === 'number' ? data.waterLevel : (data.forecastWaterLevel ?? 0);
      const isBreached = currentStage >= data.dangerLevel;
      const isWarning = currentStage >= data.warningLevel && !isBreached;

      return (
        <div className="p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[220px]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-200">{data.fullDate}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isForecast
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : isBreached
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isWarning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isForecast
                ? '48h REGRESSION'
                : isBreached
                ? 'BREACHED DL'
                : isWarning
                ? 'WARNING'
                : 'NORMAL'}
            </span>
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400 text-[11px]">
                {isForecast ? 'Projected Level:' : 'Water Level:'}
              </span>
              <span
                className={`font-bold text-sm ${
                  isForecast ? 'text-purple-300' : 'text-cyan-300'
                }`}
              >
                {currentStage.toFixed(2)} m MSL
              </span>
            </div>
            {isForecast && linearRegression && (
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 text-[11px]">Trend Slope:</span>
                <span className="text-purple-400 font-semibold text-xs">
                  {linearRegression.slopePerDay >= 0 ? '+' : ''}
                  {linearRegression.slopePerDay} m/24h (R²={linearRegression.rSquared})
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400 text-[11px]">Danger Level (DL):</span>
              <span className="text-rose-400 font-semibold">{data.dangerLevel.toFixed(2)} m</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400 text-[11px]">Warning Level (WL):</span>
              <span className="text-amber-400 font-semibold">{data.warningLevel.toFixed(2)} m</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400 text-[11px]">24h Rainfall:</span>
              <span className="text-sky-400 font-semibold">{data.rainfall} mm</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 text-[11px]">Stage Difference:</span>
              <span
                className={`font-semibold ${
                  data.deltaDL > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {data.deltaDL > 0
                  ? `+${data.deltaDL.toFixed(2)}m (Over DL)`
                  : `${Math.abs(data.deltaDL).toFixed(2)}m (Below DL)`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Chart comparison data: historical peak water levels vs standard danger levels
  const comparisonData = [
    { year: '2017 (Pre-monsoon)', surmaPeak: 9.80, rainfallPeak: 165, dangerLevel: 10.80 },
    { year: '2020 (Monsoon)', surmaPeak: 11.20, rainfallPeak: 210, dangerLevel: 10.80 },
    { year: '2022 (Mega Flood)', surmaPeak: 12.82, rainfallPeak: 450, dangerLevel: 10.80 },
    { year: '2024 (Cyclone Remal)', surmaPeak: 11.45, rainfallPeak: 280, dangerLevel: 10.80 },
  ];

  // Filter datasets using pure logic utility
  const { filteredRecords, filteredLocations } = filterHistoricalDataset(
    HISTORICAL_RECORDS,
    locations,
    selectedYear,
    selectedDistrict
  );

  // Export current filtered water-level and rainfall datasets as a CSV file
  const handleExportFilteredCSV = () => {
    const csvContent = generateFilteredWaterLevelRainfallCSV({
      records: HISTORICAL_RECORDS,
      locations,
      selectedYear,
      selectedDistrict,
    });

    const yearLabel = selectedYear === 'ALL' ? 'AllYears' : selectedYear;
    const distLabel = selectedDistrict === 'ALL' ? 'AllDistricts' : selectedDistrict.replace(/\s+/g, '_');
    const fileName = `FloodGuard_WaterLevel_Rainfall_${yearLabel}_${distLabel}.csv`;

    downloadCsvFile(csvContent, fileName);

    const successMsg =
      language === 'en'
        ? `Successfully exported filtered dataset (${filteredRecords.length} flood events, ${filteredLocations.length} stations) to ${fileName}`
        : `ফিল্টারকৃত ${filteredRecords.length}টি ঐতিহাসিক ঘটনা ও ${filteredLocations.length}টি স্টেশনের ডেটা সফলভাবে ${fileName} ফাইলে ডাউনলোড হয়েছে।`;

    setExportNotice(successMsg);
    setTimeout(() => {
      setExportNotice(null);
    }, 4500);
  };

  const availableDistricts = [
    'ALL',
    'Sylhet',
    'Sunamganj',
    'Netrokona',
    'Moulvibazar',
    'Habiganj',
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Export Filtered CSV Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-cyan-400" />
              <span>{tr.navHistorical}</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Haor Archives (2017–2024)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Multi-year retrospective data archives, peak inundations, and hydrological disaster benchmarks'
              : 'অতীতের ভয়াবহ প্লাবনের তথ্য বিশ্লেষণ, বৃষ্টিপাত রেকর্ড এবং গবেষণা ডেটা'}
          </p>
        </div>

        {/* Primary Export Button */}
        <button
          onClick={handleExportFilteredCSV}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 group"
          title="Export current filtered water-level and rainfall datasets as CSV"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-950 transition-transform group-hover:scale-110" />
          <span>
            {language === 'en'
              ? `Export Filtered CSV (${filteredRecords.length} Events • ${filteredLocations.length} Stations)`
              : `ফিল্টারকৃত সিএসভি এক্সপোর্ট (${filteredRecords.length} ইভেন্ট • ${filteredLocations.length} স্টেশন)`}
          </span>
          <Download className="w-3.5 h-3.5 ml-0.5 text-slate-900" />
        </button>
      </div>

      {/* Export Success Notification Banner */}
      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-200 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Backtest: June 2022 Flood Panel */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-purple-500/30 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-black text-white tracking-wide">
                  {language === 'en'
                    ? 'Backtest: June 2022 Mega-Flood'
                    : 'ব্যাকটেস্ট: ২০২২ সালের জুন মাসের ঐতিহাসিক মহাপ্লাবন'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Prototype Backtest
                </span>
                {backtestData && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      backtestData.isLiveArchiveData
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    }`}
                  >
                    {backtestData.isLiveArchiveData ? 'LIVE RAINFALL INPUT · MODELLED STAGE' : 'SIMULATED RAINFALL INPUT · MODELLED STAGE'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'en'
                  ? 'Hourly Open-Meteo Archive precipitation when available; the river-stage trace and threshold-trigger timing are generated by a simplified scenario model.'
                  : 'চেরাপুঞ্জি ও সিলেটের ঐতিহাসিক প্রতি ঘণ্টার বৃষ্টিপাত ওপেন-মেটিও আর্কাইভ থেকে অ্যালগরিদমে বিশ্লেষণ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchBacktest}
              disabled={isBacktestLoading}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              title="Re-run the hour-by-hour backtest simulation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBacktestLoading ? 'animate-spin' : ''}`} />
              <span>{isBacktestLoading ? 'Running Model...' : 'Re-run Backtest'}</span>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isBacktestLoading && !backtestData && (
          <div className="py-12 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">
              Fetching historical rainfall when available and running the illustrative stage scenario...
            </p>
          </div>
        )}

        {/* Error notice */}
        {backtestError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Notice: {backtestError}. Defaulting to calibrated meteorological archive series.</span>
          </div>
        )}

        {/* Backtest Results */}
        {backtestData && (
          <div className="space-y-4">
            {/* 4 Key Lead Time & Peak Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Warning Trigger */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Warning Triggered</span>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    +{backtestData.warningScenarioIntervalHours}h Scenario Interval
                  </span>
                </div>
                <div className="text-base font-black font-mono text-white">
                  {backtestData.warningTriggeredAt ? backtestData.warningTriggeredAt.replace('T', ' ') : 'N/A'}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  The model first crossed its warning rule this many hours before the modelled scenario peak; this is not measured warning lead time.
                </p>
              </div>

              {/* Danger Trigger */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-rose-400">Danger Triggered</span>
                  <span className="text-xs font-mono font-black text-amber-400">
                    +{backtestData.dangerScenarioIntervalHours}h Scenario Interval
                  </span>
                </div>
                <div className="text-base font-black font-mono text-white">
                  {backtestData.dangerTriggeredAt ? backtestData.dangerTriggeredAt.replace('T', ' ') : 'N/A'}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  The model first crossed its danger rule this many hours before the modelled scenario peak; this is not a forecast-skill result.
                </p>
              </div>

              {/* Observed Crest Peak */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400">Modelled Scenario Peak</span>
                  <span className="text-xs font-mono text-purple-300 font-bold">Scenario Output</span>
                </div>
                <div className="text-base font-black font-mono text-white">
                  {backtestData.peakWaterLevelM.toFixed(2)}m MSL
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {backtestData.peakDate.replace('T', ' ')} BST (relative to the configured demo threshold).
                </p>
              </div>

              {/* Upstream Inflow */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">Cherrapunji Rainfall</span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">Upstream Inflow</span>
                </div>
                <div className="text-base font-black font-mono text-cyan-300">
                  {backtestData.totalCherrapunjiRainfallMm} mm
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Max 24h: {backtestData.max24hCherrapunjiRainfallMm} mm in Meghalaya foothills.
                </p>
              </div>
            </div>

            {/* Recharts Timeline Graph */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 flex-wrap font-mono text-[11px]">
                  <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                    <span className="w-2.5 h-0.5 bg-sky-400 inline-block" /> Surma Water Level (m)
                  </span>
                  <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                    <span className="w-2.5 h-0.5 bg-purple-400 inline-block" /> Cherrapunji 24h Rain (mm)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Sylhet 24h Rain (mm)
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                    <span className="w-2.5 h-0.5 bg-rose-400 inline-block border-b border-dashed border-rose-400" /> Danger Level (10.80m)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">June 10 – June 22, 2022 (Hourly)</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={backtestData.timeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      tick={{ fontSize: 9, fill: '#94a3b8' }}
                      tickFormatter={(t: string) => t.slice(5, 13)}
                      interval={24}
                    />
                    <YAxis
                      yAxisId="water"
                      stroke="#38bdf8"
                      domain={[9.2, 12.4]}
                      tick={{ fontSize: 10, fill: '#38bdf8' }}
                      unit="m"
                    />
                    <YAxis
                      yAxisId="rain"
                      orientation="right"
                      stroke="#c084fc"
                      domain={[0, 450]}
                      tick={{ fontSize: 10, fill: '#c084fc' }}
                      unit="mm"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        borderColor: '#475569',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      labelFormatter={(l: any) => `Time: ${l}`}
                      formatter={(val: any, name: any) => [
                        name.includes('Water') ? `${val} m` : `${val} mm`,
                        name,
                      ]}
                    />
                    <ReferenceLine
                      yAxisId="water"
                      y={10.8}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                    <ReferenceLine
                      yAxisId="water"
                      y={10.3}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      strokeWidth={1.2}
                    />
                    <Line
                      yAxisId="water"
                      type="monotone"
                      dataKey="waterLevelM"
                      name="Surma Water Level"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      yAxisId="rain"
                      type="monotone"
                      dataKey="cherraRain24hMm"
                      name="Cherrapunji 24h Rain"
                      stroke="#c084fc"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      yAxisId="rain"
                      type="monotone"
                      dataKey="sylhetRain24hMm"
                      name="Sylhet 24h Rain"
                      stroke="#34d399"
                      strokeWidth={1.2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scenario diagnostics: deliberately not presented as model accuracy */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-purple-500/30 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      {language === 'bn'
                        ? 'সিনারিও ডায়াগনস্টিকস (মডেলের নির্ভুলতা নয়)'
                        : 'Scenario Diagnostics (Not Model Accuracy)'}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {language === 'bn'
                        ? 'বৃষ্টিপাতের ইনপুট ও কৃত্রিম নদীর স্তর-সিনারিওর সারাংশ'
                        : 'Summary of rainfall inputs and the synthetic river-stage scenario'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                  {backtestData.isLiveArchiveData ? 'ARCHIVE RAINFALL · SYNTHETIC STAGE' : 'RECONSTRUCTED RAINFALL · SYNTHETIC STAGE'}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Rainfall input</span>
                  <div className="text-sm font-bold text-cyan-300">{backtestData.isLiveArchiveData ? 'Archive' : 'Reconstructed'}</div>
                  <span className="text-[9px] text-slate-500 block">{backtestData.timeline.length} hourly points</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Max upstream 24h rain</span>
                  <div className="text-base font-black font-mono text-purple-300">{backtestData.max24hCherrapunjiRainfallMm.toFixed(1)} mm</div>
                  <span className="text-[9px] text-slate-500 block">Rainfall input only</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Synthetic scenario peak</span>
                  <div className="text-base font-black font-mono text-amber-300">{backtestData.peakWaterLevelM.toFixed(2)} m</div>
                  <span className="text-[9px] text-slate-500 block">Not an observed gauge value</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Warning scenario interval</span>
                  <div className="text-base font-black font-mono text-cyan-300">{backtestData.warningScenarioIntervalHours} h</div>
                  <span className="text-[9px] text-slate-500 block">Before modelled scenario peak</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Danger scenario interval</span>
                  <div className="text-base font-black font-mono text-rose-300">{backtestData.dangerScenarioIntervalHours} h</div>
                  <span className="text-[9px] text-slate-500 block">Before modelled scenario peak</span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] leading-relaxed text-amber-100">
                <strong className="text-amber-300">No forecast-accuracy score is reported.</strong> This release does not pair its synthetic stage trace with observed BWDB gauge measurements. MAE, RMSE, bias and R² would therefore be misleading as validation metrics and are intentionally omitted.
              </div>
            </div>

            {/* Transparent Methodology & Limitations Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-300 font-bold">
                <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Methodology & Scientific Transparency:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {backtestData.methodologyDescription}
              </p>
              <div className="text-[10px] text-amber-300/80 font-mono pt-1 border-t border-slate-800/80">
                Notice: This prototype replays archived rainfall (or reconstructed fallback rainfall) through a simplified, synthetic river-stage response. Stage values, threshold-crossing intervals, correlation and peak offsets are model outputs—not observed BWDB gauge data, measured warning lead times, or evidence of forecast skill. Does not substitute official BWDB/FFWC retrospective analysis.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparative Multi-Year Peak Level Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Surma River Peak Water Level vs 24h Peak Rainfall</span>
            </h2>
            <p className="text-xs text-slate-400">
              Comparison across historic deluge events in Sylhet & Sunamganj relative to Danger Level (10.80m)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Surma Peak (m)
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> 24h Rainfall (mm/10)
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="surmaPeak" fill="#22d3ee" name="Surma Peak Level (m)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rainfallPeak" fill="#38bdf8" name="Peak Rainfall (mm)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Station Water-Level Trend Over Time (Recharts LineChart) */}
      <div id="station-hydrograph-section" className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                {language === 'en'
                  ? 'Station Water-Level Hydrograph & Stage Trends'
                  : 'স্টেশন হাইড্রো-গ্রাফ: সময়ের সাথে পানির স্তরের পরিবর্তন'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                Recharts LineChart
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'en'
                ? `Dynamic stage elevation (m MSL) relative to official Danger Level (${selectedStation.dangerLevel.toFixed(2)}m) & Warning Level (${selectedStation.warningLevel.toFixed(2)}m) for ${selectedStation.stationName}`
                : `${selectedStation.stationName} স্টেশনের জন্য বিপৎসীমা ও সতর্কসীমার সাপেক্ষে পানির স্তরের ঐতিহাসিক ধারা`}
            </p>
          </div>

          {/* Station Selector Dropdown & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Station Dropdown */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 px-2 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" />
                {language === 'en' ? 'Station:' : 'স্টেশন:'}
              </span>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 text-slate-200 rounded-lg text-xs font-semibold border-none focus:outline-hidden cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.stationName} ({loc.riverNameEn} • {loc.upazilaEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Forecast Overlay Button */}
            <button
              onClick={() => setShowForecastOverlay(!showForecastOverlay)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border active:scale-95 shadow-sm ${
                showForecastOverlay
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-purple-950/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
              title="Toggle basic linear regression 48-hour stage forecast overlay"
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  showForecastOverlay ? 'text-purple-400 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span>
                {language === 'en'
                  ? showForecastOverlay
                    ? 'Forecast Overlay: ON'
                    : 'Forecast Overlay (+48h)'
                  : showForecastOverlay
                  ? 'পূর্বাভাস ওভারলে: চালু'
                  : 'পূর্বাভাস ওভারলে (+৪৮ঘ)'}
              </span>
              {linearRegression && showForecastOverlay && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono border border-purple-500/40">
                  {linearRegression.slopePerDay >= 0 ? '+' : ''}
                  {linearRegression.slopePerDay}m/d
                </span>
              )}
            </button>

            {/* Export Currently Displayed Water-Level Data as CSV */}
            <button
              onClick={handleExportDisplayedWaterLevelCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 transition flex items-center gap-2 active:scale-95 shadow-sm group"
              title="Download currently displayed water-level hydrograph dataset as a CSV file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400 transition-transform group-hover:scale-110" />
              <span>
                {language === 'en' ? 'Export CSV' : 'সিএসভি রপ্তানি'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/30">
                {displayTrendData.length}
              </span>
              <Download className="w-3 h-3 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* 48h Linear Regression Projection Active Banner */}
        {showForecastOverlay && linearRegression && (
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-purple-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    {language === 'en'
                      ? '48-Hour Linear Regression Projection Active'
                      : '৪৮ ঘণ্টার লিনিয়ার রিগ্রেশন পূর্বাভাস সক্রিয়'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-purple-900/60 text-purple-300 border border-purple-500/30">
                    OLS Statistical Extrapolation
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/80 mt-0.5">
                  {language === 'en'
                    ? `Projecting stage momentum from recent observations: slope ${
                        linearRegression.slopePerDay >= 0 ? '+' : ''
                      }${linearRegression.slopePerDay} m/24h (${linearRegression.trendDirection.toUpperCase()} trend, R² = ${
                        linearRegression.rSquared
                      }). Statistical estimate; not an official BWDB bulletin.`
                    : `সাম্প্রতিক পরিবর্তনের হারের ভিত্তিতে পূর্বাভাস: গতিবেগ ${
                        linearRegression.slopePerDay >= 0 ? '+' : ''
                      }${linearRegression.slopePerDay} মি/২৪ঘণ্টা (R² = ${linearRegression.rSquared})।`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-purple-500/30 text-center">
                <span className="text-slate-400 block text-[9px] uppercase">Proj +24h</span>
                <span
                  className={`font-bold text-xs ${
                    linearRegression.projected24hLevel >= selectedStation.dangerLevel
                      ? 'text-rose-400'
                      : 'text-cyan-300'
                  }`}
                >
                  {linearRegression.projected24hLevel.toFixed(2)} m
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-purple-500/30 text-center">
                <span className="text-slate-400 block text-[9px] uppercase">Proj +48h</span>
                <span
                  className={`font-bold text-xs ${
                    linearRegression.projected48hLevel >= selectedStation.dangerLevel
                      ? 'text-rose-400'
                      : 'text-purple-300'
                  }`}
                >
                  {linearRegression.projected48hLevel.toFixed(2)} m
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe Scenario Selector Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              {language === 'en' ? 'Hydrological Scenario:' : 'হাইড্রো পরিস্থিতি:'}
            </span>
            {TREND_TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5 ${
                  timeframe === tf.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title={tf.descriptionEn}
              >
                <span>{language === 'en' ? tf.labelEn : tf.labelBn}</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {TREND_TIMEFRAMES.find((tf) => tf.id === timeframe)?.dateRange}
          </div>
        </div>

        {/* Key Hydrological KPIs for Selected Station */}
        {trendMetrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peak Stage</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold font-mono text-rose-400">
                  {trendMetrics.peakLevel.toFixed(2)} m
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                on {trendMetrics.peakDate}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Danger Level (DL)</span>
              <span className="text-base font-extrabold font-mono text-rose-300 block mt-0.5">
                {selectedStation.dangerLevel.toFixed(2)} m
              </span>
              <span className="text-[10px] text-rose-400/90 font-mono block">
                Official Red Mark
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Warning Level (WL)</span>
              <span className="text-base font-extrabold font-mono text-amber-300 block mt-0.5">
                {selectedStation.warningLevel.toFixed(2)} m
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono block">
                Pre-Inundation Stage
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Telemetry</span>
              <span className="text-base font-extrabold font-mono text-cyan-300 block mt-0.5">
                {selectedStation.currentWaterLevel.toFixed(2)} m
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {selectedStation.currentWaterLevel >= selectedStation.dangerLevel ? '+ Over DL' : '- Below DL'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">All-Time High</span>
              <span className="text-base font-extrabold font-mono text-purple-400 block mt-0.5">
                {selectedStation.historicalMaxM.toFixed(2)} m
              </span>
              <span className="text-[10px] text-purple-300/80 font-mono block">
                Basin Record
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Stage Difference</span>
              <span className={`text-base font-extrabold font-mono block mt-0.5 ${
                trendMetrics.peakLevel >= selectedStation.dangerLevel ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {trendMetrics.peakLevel >= selectedStation.dangerLevel
                  ? `+${(trendMetrics.peakLevel - selectedStation.dangerLevel).toFixed(2)}m`
                  : `${(trendMetrics.peakLevel - selectedStation.dangerLevel).toFixed(2)}m`}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {trendMetrics.pointsAboveDanger > 0 ? `${trendMetrics.pointsAboveDanger} points above DL` : 'Remained safe'}
              </span>
            </div>
          </div>
        )}

        {/* The Recharts LineChart Component */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayTrendData}
              margin={{ top: 15, right: 30, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                domain={[yDomainMin, yDomainMax]}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                unit="m"
              />
              <Tooltip content={<CustomHydroTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 10, fontSize: '11px' }}
                iconType="plainline"
              />
              {/* Official Danger Level Reference Line */}
              <ReferenceLine
                y={selectedStation.dangerLevel}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Danger Level: ${selectedStation.dangerLevel.toFixed(2)}m`,
                  fill: '#f87171',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              {/* Warning Level Reference Line */}
              <ReferenceLine
                y={selectedStation.warningLevel}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Warning Level: ${selectedStation.warningLevel.toFixed(2)}m`,
                  fill: '#fbbf24',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />
              {/* Historical Record High Reference Line */}
              {selectedStation.historicalMaxM <= yDomainMax && (
                <ReferenceLine
                  y={selectedStation.historicalMaxM}
                  stroke="#a855f7"
                  strokeDasharray="2 2"
                  strokeWidth={1.5}
                  label={{
                    value: `Record: ${selectedStation.historicalMaxM.toFixed(2)}m`,
                    fill: '#c084fc',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
              )}
              {/* Primary Water Level Trend Line */}
              <Line
                type="monotone"
                dataKey="waterLevel"
                name={`Water Level (m MSL)`}
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0e7490', stroke: '#22d3ee', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2.5 }}
                connectNulls={false}
              />
              {/* 48h Linear Regression Forecast Line */}
              {showForecastOverlay && (
                <Line
                  type="monotone"
                  dataKey="forecastWaterLevel"
                  name={`48h Linear Regression Forecast (m MSL)`}
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#6d28d9', stroke: '#c084fc', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#e9d5ff', stroke: '#ffffff', strokeWidth: 2.5 }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Guidance Note */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {language === 'en'
                ? `Station ID: ${selectedStation.id} • Monitored Basin: ${selectedStation.riverNameEn} (${selectedStation.upazilaEn}, ${selectedStation.district})`
                : `স্টেশন আইডি: ${selectedStation.id} • নদী অববাহিকা: ${selectedStation.riverNameBn}`}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Water Level
            </span>
            {showForecastOverlay && (
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-3 h-0.5 border-t border-dashed border-purple-400 inline-block" /> 48h Forecast
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block" /> Danger Mark
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-500 inline-block" /> Warning Mark
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar + Secondary Export Button */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Year Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-2 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" />
              Year:
            </span>
            {(['ALL', 2024, 2022, 2020, 2017] as const).map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-xs ${
                  selectedYear === yr
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* District Filter Dropdown */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-cyan-400" />
              District:
            </span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-2.5 py-1 bg-slate-900 text-slate-200 rounded-lg text-xs font-semibold border-none focus:outline-hidden cursor-pointer"
            >
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Districts' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filter Summary Tag */}
          {(selectedYear !== 'ALL' || selectedDistrict !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedYear('ALL');
                setSelectedDistrict('ALL');
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono ml-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Toolbar Export Button */}
        <button
          onClick={handleExportFilteredCSV}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 transition flex items-center gap-2 active:scale-95 shadow-sm"
          title="Download the current filtered dataset as a CSV file"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {language === 'en'
              ? `Export Current Filtered CSV`
              : `বর্তমান ফিল্টারকৃত সিএসভি রপ্তানি`}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/30">
            {filteredRecords.length}
          </span>
        </button>
      </div>

      {/* Dataset View Toggle: Events vs Stations */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'en' ? 'Historical Flood Events' : 'ঐতিহাসিক মহাপ্লাবন রেকর্ড'}</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 font-mono text-cyan-300">
              {filteredRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'stations'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'en' ? 'Station Peak & Telemetry Records' : 'স্টেশন হাইড্রো-টেলিমেট্রি রেকর্ড'}</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 font-mono text-cyan-300">
              {filteredLocations.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Filter: Year={selectedYear} • District={selectedDistrict}
        </span>
      </div>

      {/* Tab 1: Detailed Historical Event Dossiers */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {filteredRecords.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No historical flood events match the selected filters</h3>
              <p className="text-xs text-slate-400">
                Try setting Year to &quot;ALL&quot; or District to &quot;All Districts&quot;.
              </p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.year}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-black font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                        Year {record.year}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Peak: {record.peakDate}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-white mt-1">
                      {language === 'en' ? record.eventNameEn : record.eventNameBn}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold text-rose-400 block">
                      {record.totalAffectedPeople} Affected
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {record.affectedDistricts.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Metrics Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Surma Peak Stage</span>
                    <span className="text-base font-bold font-mono text-rose-400">
                      {record.peakWaterLevelSurmaM.toFixed(2)} m
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      +{(record.peakWaterLevelSurmaM - 10.80).toFixed(2)}m over DL
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">24h Peak Rainfall</span>
                    <span className="text-base font-bold font-mono text-sky-400">
                      {record.peakRainfall24hMm} mm
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Extreme cloudburst
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block">Estimated Economic Impact</span>
                    <span className="text-xs font-bold text-amber-300 block truncate">
                      {record.economicLoss}
                    </span>
                  </div>
                </div>

                {/* Narrative Breakdown */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                  {language === 'en' ? record.descriptionEn : record.descriptionBn}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Station Water-Level & Rainfall Table */}
      {activeTab === 'stations' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span>{language === 'en' ? 'Station Hydro-Telemetry & Historical All-Time Extremes' : 'স্টেশন হাইড্রো-টেলিমেট্রি ও সর্বকালের সর্বোচ্চ রেকর্ড'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {filteredLocations.length} Stations in Selection
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-semibold bg-slate-950/60">
                  <th className="py-2.5 px-3">Station & Upazila</th>
                  <th className="py-2.5 px-3">River Channel</th>
                  <th className="py-2.5 px-3">Current Water Level (m)</th>
                  <th className="py-2.5 px-3">Danger Mark (m)</th>
                  <th className="py-2.5 px-3">Historical Max (m)</th>
                  <th className="py-2.5 px-3">24h Rainfall (mm)</th>
                  <th className="py-2.5 px-3">Upstream Runoff (mm)</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3 text-right">Hydrograph</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLocations.map((loc) => {
                  const deltaDL = Number((loc.currentWaterLevel - loc.dangerLevel).toFixed(2));
                  const isSelected = selectedStationId === loc.id;
                  return (
                    <tr
                      key={loc.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200 block">{loc.stationName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {loc.upazilaEn}, {loc.district}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{loc.riverNameEn}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-cyan-300 text-sm">
                          {loc.currentWaterLevel.toFixed(2)} m
                        </span>
                        <span
                          className={`block text-[10px] font-mono ${
                            deltaDL > 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {deltaDL > 0 ? `+${deltaDL}m over DL` : `${Math.abs(deltaDL)}m below DL`}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{loc.dangerLevel.toFixed(2)} m</td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-400">
                        {loc.historicalMaxM.toFixed(2)} m
                      </td>
                      <td className="py-3 px-3 font-mono text-sky-400 font-bold">
                        {loc.rainfall24h} mm
                      </td>
                      <td className="py-3 px-3 font-mono text-cyan-400">
                        {loc.upstreamRainfallMm} mm
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            loc.riskLevel === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : loc.riskLevel === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {loc.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedStationId(loc.id);
                            const element = document.getElementById('station-hydrograph-section');
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition inline-flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-cyan-500/20'
                          }`}
                          title={`Plot water-level trend for ${loc.stationName}`}
                        >
                          <Activity className="w-3 h-3" />
                          <span>{isSelected ? 'Viewing' : 'View Trend'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
