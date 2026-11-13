import { HistoricalRecord, LocationData } from '../types';

export interface FilteredDatasetExportParams {
  records: HistoricalRecord[];
  locations: LocationData[];
  selectedYear: number | 'ALL';
  selectedDistrict: string | 'ALL';
}

/**
 * Escapes a cell value for CSV format according to RFC 4180.
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Filters historical records and station locations by year and district.
 */
export function filterHistoricalDataset(
  records: HistoricalRecord[],
  locations: LocationData[],
  selectedYear: number | 'ALL',
  selectedDistrict: string | 'ALL'
): { filteredRecords: HistoricalRecord[]; filteredLocations: LocationData[] } {
  const filteredRecords = records.filter((r) => {
    const matchesYear = selectedYear === 'ALL' || r.year === selectedYear;
    const matchesDistrict =
      selectedDistrict === 'ALL' ||
      r.affectedDistricts.some(
        (d) => d.toLowerCase() === selectedDistrict.toLowerCase()
      );
    return matchesYear && matchesDistrict;
  });

  const filteredLocations = locations.filter((loc) => {
    const matchesDistrict =
      selectedDistrict === 'ALL' ||
      loc.district.toLowerCase() === selectedDistrict.toLowerCase();
    return matchesDistrict;
  });

  return { filteredRecords, filteredLocations };
}

/**
 * Generates a comprehensive CSV text representing filtered water-level and rainfall datasets.
 */
export function generateFilteredWaterLevelRainfallCSV({
  records,
  locations,
  selectedYear,
  selectedDistrict,
}: FilteredDatasetExportParams): string {
  const { filteredRecords, filteredLocations } = filterHistoricalDataset(
    records,
    locations,
    selectedYear,
    selectedDistrict
  );

  const lines: string[] = [];

  // Metadata block
  lines.push('# FloodGuard AI - Filtered Water-Level and Rainfall Dataset Export');
  lines.push(`# Export Timestamp: ${new Date().toISOString()}`);
  lines.push(`# Filter Applied: Year = ${selectedYear}, District = ${selectedDistrict}`);
  lines.push(`# Total Historical Flood Events: ${filteredRecords.length}`);
  lines.push(`# Total Monitored Basin Stations: ${filteredLocations.length}`);
  lines.push('');

  // SECTION 1: Historical Flood Events & Basin Peaks
  lines.push('--- HISTORICAL FLOOD EVENTS & BASIN DELUGE METRICS ---');
  const eventHeaders = [
    'Year',
    'Event Name (English)',
    'Event Name (Bengali)',
    'Peak Date Window',
    'Affected Districts',
    'Surma Peak Water Level (m MSL)',
    'Official Danger Mark (m MSL)',
    'Height Above Danger Level (m)',
    '24h Peak Rainfall (mm)',
    'Total Affected Population',
    'Estimated Economic Loss',
    'Hydrological Summary',
  ];
  lines.push(eventHeaders.map(escapeCsvCell).join(','));

  for (const rec of filteredRecords) {
    const surmaDL = 10.80; // Standard Sylhet Surma Danger Level
    const deltaAboveDL = Number((rec.peakWaterLevelSurmaM - surmaDL).toFixed(2));
    const row = [
      rec.year,
      rec.eventNameEn,
      rec.eventNameBn,
      rec.peakDate,
      rec.affectedDistricts.join('; '),
      rec.peakWaterLevelSurmaM.toFixed(2),
      surmaDL.toFixed(2),
      deltaAboveDL > 0 ? `+${deltaAboveDL.toFixed(2)}` : deltaAboveDL.toFixed(2),
      rec.peakRainfall24hMm,
      rec.totalAffectedPeople,
      rec.economicLoss,
      rec.descriptionEn,
    ];
    lines.push(row.map(escapeCsvCell).join(','));
  }

  lines.push('');

  // SECTION 2: Basin Stations Hydro-Telemetry & Historical Extremes
  lines.push('--- MONITORED BASIN STATIONS HYDRO-TELEMETRY & EXTREME HIGH-WATER MARKS ---');
  const stationHeaders = [
    'Station ID',
    'Station Name',
    'River Channel',
    'Upazila',
    'District',
    'Latitude',
    'Longitude',
    'Current Water Level (m)',
    'Danger Level (m)',
    'Warning Level (m)',
    'Historical All-Time Record Level (m)',
    '24h Rainfall (mm)',
    'Rainfall Trend',
    'Upstream Catchment Rain (mm)',
    'Soil Saturation (%)',
    'Risk Classification',
    'Exposed Population',
    'Registered Shelters',
    'Data Status',
  ];
  lines.push(stationHeaders.map(escapeCsvCell).join(','));

  for (const loc of filteredLocations) {
    const row = [
      loc.id,
      loc.stationName,
      loc.riverNameEn,
      loc.upazilaEn,
      loc.district,
      loc.coordinates[0],
      loc.coordinates[1],
      loc.currentWaterLevel.toFixed(2),
      loc.dangerLevel.toFixed(2),
      loc.warningLevel.toFixed(2),
      loc.historicalMaxM.toFixed(2),
      loc.rainfall24h,
      loc.rainfallTrend,
      loc.upstreamRainfallMm,
      loc.soilSaturationPercent,
      loc.riskLevel,
      loc.populationExposed,
      loc.sheltersCount,
      loc.isSimulated ? 'Simulated Stage Input' : 'Reference Stage Input',
    ];
    lines.push(row.map(escapeCsvCell).join(','));
  }

  return lines.join('\n');
}

/**
 * Triggers a browser file download for the CSV string using a Blob.
 */
export function downloadCsvFile(csvContent: string, fileName: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
