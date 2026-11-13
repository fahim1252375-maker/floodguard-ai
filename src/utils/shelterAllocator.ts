/**
 * Greedy, priority-ordered shelter allocation.
 *
 * Demand groups (areas with people to evacuate) are served in descending priority.
 * Each group fills its nearest usable shelter pool first and spills over to the next
 * nearest pool when capacity runs out. Pools that are inundated or cut off are skipped;
 * at-risk pools only count for a reduced share of their capacity.
 *
 * This is a planning aid built on assumptions the user can change (evacuation share,
 * capacity per shelter). It is not a substitute for field verification.
 */

export type PoolStatus = 'OPERATIONAL' | 'AT_RISK' | 'INUNDATED' | 'ACCESS_CUT';

export interface DemandGroup {
  id: string;
  name: string;
  coordinates: [number, number];
  people: number;
  priority: number; // higher is served first (e.g. risk score)
}

export interface ShelterPool {
  id: string;
  name: string;
  coordinates: [number, number];
  capacity: number;
  occupied?: number;
  status: PoolStatus;
}

export interface Assignment {
  groupId: string;
  poolId: string;
  people: number;
  distanceKm: number;
}

export interface AllocationResult {
  assignments: Assignment[];
  unmet: { groupId: string; people: number }[];
  utilization: { poolId: string; used: number; usable: number; percent: number }[];
  totals: { demand: number; placed: number; unmet: number; coveragePercent: number };
}

const AT_RISK_DERATE = 0.5;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function usableCapacity(pool: ShelterPool): number {
  if (pool.status === 'INUNDATED' || pool.status === 'ACCESS_CUT') return 0;
  const factor = pool.status === 'AT_RISK' ? AT_RISK_DERATE : 1;
  return Math.max(0, Math.floor(pool.capacity * factor) - (pool.occupied ?? 0));
}

export function allocateShelters(groups: DemandGroup[], pools: ShelterPool[]): AllocationResult {
  const remaining = new Map<string, number>(pools.map((p) => [p.id, usableCapacity(p)]));
  const startUsable = new Map(remaining);
  const assignments: Assignment[] = [];
  const unmet: AllocationResult['unmet'] = [];

  const ordered = [...groups]
    .filter((g) => g.people > 0)
    .sort((a, b) => b.priority - a.priority || b.people - a.people);

  for (const group of ordered) {
    let need = Math.round(group.people);
    const ranked = pools
      .map((p) => ({ pool: p, km: haversineKm(group.coordinates, p.coordinates) }))
      .sort((a, b) => a.km - b.km);

    for (const { pool, km } of ranked) {
      if (need <= 0) break;
      const free = remaining.get(pool.id) ?? 0;
      if (free <= 0) continue;
      const take = Math.min(free, need);
      remaining.set(pool.id, free - take);
      need -= take;
      assignments.push({
        groupId: group.id,
        poolId: pool.id,
        people: take,
        distanceKm: Math.round(km * 10) / 10,
      });
    }
    if (need > 0) unmet.push({ groupId: group.id, people: need });
  }

  const demand = ordered.reduce((s, g) => s + Math.round(g.people), 0);
  const unmetTotal = unmet.reduce((s, u) => s + u.people, 0);
  const placed = demand - unmetTotal;

  return {
    assignments,
    unmet,
    utilization: pools.map((p) => {
      const usable = startUsable.get(p.id) ?? 0;
      const used = usable - (remaining.get(p.id) ?? 0);
      return {
        poolId: p.id,
        used,
        usable,
        percent: usable === 0 ? 0 : Math.round((used / usable) * 100),
      };
    }),
    totals: {
      demand,
      placed,
      unmet: unmetTotal,
      coveragePercent: demand === 0 ? 100 : Math.round((placed / demand) * 100),
    },
  };
}
