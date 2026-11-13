import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateShelters, usableCapacity, haversineKm, ShelterPool, DemandGroup } from './shelterAllocator';

const pool = (id: string, lat: number, cap: number, status: ShelterPool['status'] = 'OPERATIONAL'): ShelterPool => ({
  id,
  name: id,
  coordinates: [lat, 91],
  capacity: cap,
  status,
});
const group = (id: string, lat: number, people: number, priority = 50): DemandGroup => ({
  id,
  name: id,
  coordinates: [lat, 91],
  people,
  priority,
});

test('haversine is ~111 km per degree of latitude', () => {
  assert.ok(Math.abs(haversineKm([24, 91], [25, 91]) - 111.2) < 1);
});

test('inundated and cut-off pools have zero usable capacity, at-risk is halved', () => {
  assert.equal(usableCapacity(pool('a', 24, 100, 'INUNDATED')), 0);
  assert.equal(usableCapacity(pool('b', 24, 100, 'ACCESS_CUT')), 0);
  assert.equal(usableCapacity(pool('c', 24, 100, 'AT_RISK')), 50);
});

test('nearest pool is filled first and overflow spills to the next', () => {
  const r = allocateShelters([group('g', 24, 150)], [pool('near', 24.01, 100), pool('far', 24.5, 100)]);
  assert.deepEqual(
    r.assignments.map((a) => [a.poolId, a.people]),
    [['near', 100], ['far', 50]]
  );
  assert.equal(r.totals.unmet, 0);
});

test('higher priority group is served first when capacity is scarce', () => {
  const r = allocateShelters(
    [group('low', 24, 80, 10), group('high', 24, 80, 90)],
    [pool('only', 24, 100)]
  );
  const high = r.assignments.filter((a) => a.groupId === 'high').reduce((s, a) => s + a.people, 0);
  assert.equal(high, 80);
  assert.equal(r.unmet[0].groupId, 'low');
  assert.equal(r.unmet[0].people, 60);
  assert.equal(r.totals.coveragePercent, 63);
});

test('capacity is never exceeded', () => {
  const r = allocateShelters([group('a', 24, 500), group('b', 24.1, 500)], [pool('p1', 24, 200), pool('p2', 24.2, 300)]);
  for (const u of r.utilization) assert.ok(u.used <= u.usable);
  assert.equal(r.totals.placed, 500);
});
