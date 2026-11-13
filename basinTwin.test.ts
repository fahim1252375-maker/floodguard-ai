import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDownstreamLagTime,
  calculateUpstreamSurgeImpact,
  identifyBottlenecks,
} from './basinTwin';
import { BASIN_TWIN_NODES, BASIN_TWIN_LINKS } from '../data/globalIntelligenceData';

test('calculateDownstreamLagTime returns 0 for same node', () => {
  const lag = calculateDownstreamLagTime('sarighat', 'sarighat', BASIN_TWIN_LINKS);
  assert.equal(lag, 0);
});

test('calculateDownstreamLagTime calculates direct travel lag correctly', () => {
  // meghalaya-catchment -> sarighat is 4.5 hours
  const lag = calculateDownstreamLagTime('meghalaya-catchment', 'sarighat', BASIN_TWIN_LINKS);
  assert.equal(lag, 4.5);
});

test('calculateDownstreamLagTime calculates multi-hop travel lag correctly', () => {
  // meghalaya-catchment -> sarighat (4.5h) -> sylhet-sw267 (8.0h) = 12.5h
  const lag = calculateDownstreamLagTime('meghalaya-catchment', 'sylhet-sw267', BASIN_TWIN_LINKS);
  assert.equal(lag, 12.5);
});

test('calculateUpstreamSurgeImpact computes surge index and identifies critical sources', () => {
  const impact = calculateUpstreamSurgeImpact('sarighat', BASIN_TWIN_NODES, BASIN_TWIN_LINKS);
  assert.ok(impact.surgePressureIndex > 50, 'Surge pressure should be significant given 310mm upstream rain');
  assert.equal(impact.breachedUpstreamCount, 1);
  assert.equal(impact.estimatedSurgeArrivalHours, 4.5);
});

test('identifyBottlenecks identifies vulnerable breached stations', () => {
  const bottlenecks = identifyBottlenecks(BASIN_TWIN_NODES, BASIN_TWIN_LINKS);
  assert.ok(bottlenecks.length > 0);
  const chhatak = bottlenecks.find((b) => b.stationId === 'chhatak-sw269');
  assert.ok(chhatak, 'Chhatak should be identified as a bottleneck node');
  assert.equal(chhatak?.bottleneckSeverity, 'HIGH');
});
