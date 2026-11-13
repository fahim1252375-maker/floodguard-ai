import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvCell,
  filterHistoricalDataset,
  generateFilteredWaterLevelRainfallCSV,
} from './csvExport';
import { HISTORICAL_RECORDS, INITIAL_LOCATIONS } from '../data/mockData';

test('escapeCsvCell escapes quotes and wraps in double quotes', () => {
  assert.equal(escapeCsvCell('Simple'), '"Simple"');
  assert.equal(escapeCsvCell('Hello, World'), '"Hello, World"');
  assert.equal(escapeCsvCell('Text with "quotes"'), '"Text with ""quotes"""');
  assert.equal(escapeCsvCell(12.82), '"12.82"');
  assert.equal(escapeCsvCell(null), '""');
});

test('filterHistoricalDataset filters by year', () => {
  const result2022 = filterHistoricalDataset(HISTORICAL_RECORDS, INITIAL_LOCATIONS, 2022, 'ALL');
  assert.equal(result2022.filteredRecords.length, 1);
  assert.equal(result2022.filteredRecords[0].year, 2022);
  assert.equal(result2022.filteredLocations.length, INITIAL_LOCATIONS.length);
});

test('filterHistoricalDataset filters by district', () => {
  const resultSylhet = filterHistoricalDataset(HISTORICAL_RECORDS, INITIAL_LOCATIONS, 'ALL', 'Sylhet');
  assert.ok(resultSylhet.filteredRecords.length >= 3, 'Sylhet is affected in multiple historical floods');
  assert.ok(
    resultSylhet.filteredLocations.every((loc) => loc.district === 'Sylhet'),
    'All returned locations must belong to Sylhet'
  );
});

test('generateFilteredWaterLevelRainfallCSV generates non-empty CSV with headers and data rows', () => {
  const csv = generateFilteredWaterLevelRainfallCSV({
    records: HISTORICAL_RECORDS,
    locations: INITIAL_LOCATIONS,
    selectedYear: 2022,
    selectedDistrict: 'Sunamganj',
  });

  assert.ok(csv.includes('# FloodGuard AI - Filtered Water-Level and Rainfall Dataset Export'));
  assert.ok(csv.includes('Historic Sylhet-Sunamganj Mega Flash Flood'));
  assert.ok(csv.includes('Surma Peak Water Level (m MSL)'));
  assert.ok(csv.includes('Sunamganj'));
  assert.ok(csv.includes('12.82'));
  assert.ok(csv.includes('450'));
});
