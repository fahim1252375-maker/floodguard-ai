import { BasinTwinNode, BasinTwinLink } from '../types';

/**
 * Calculates total hydraulic travel lag time (in hours) along the shortest path
 * between an upstream node and downstream node in the river network.
 */
export function calculateDownstreamLagTime(
  fromNodeId: string,
  toNodeId: string,
  links: BasinTwinLink[]
): number | null {
  if (fromNodeId === toNodeId) return 0;

  // Dijkstra / BFS for shortest lag time in DAG
  const queue: { nodeId: string; totalLag: number }[] = [{ nodeId: fromNodeId, totalLag: 0 }];
  const visited = new Map<string, number>();
  visited.set(fromNodeId, 0);

  let minLag: number | null = null;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.nodeId === toNodeId) {
      if (minLag === null || current.totalLag < minLag) {
        minLag = current.totalLag;
      }
      continue;
    }

    const outgoing = links.filter((l) => l.fromStationId === current.nodeId);
    for (const link of outgoing) {
      const nextLag = current.totalLag + link.travelLagHours;
      const prevBest = visited.get(link.toStationId);
      if (prevBest === undefined || nextLag < prevBest) {
        visited.set(link.toStationId, nextLag);
        queue.push({ nodeId: link.toStationId, totalLag: nextLag });
      }
    }
  }

  return minLag !== null ? Number(minLag.toFixed(1)) : null;
}

/**
 * Calculates cumulative upstream flood surge pressure index (0 - 100) for a given station.
 * Takes into account upstream rainfall, water levels exceeding danger mark, and upstream link weights.
 */
export function calculateUpstreamSurgeImpact(
  targetNodeId: string,
  nodes: BasinTwinNode[],
  links: BasinTwinLink[]
): {
  surgePressureIndex: number;
  breachedUpstreamCount: number;
  criticalUpstreamSources: string[];
  estimatedSurgeArrivalHours: number | null;
} {
  const targetNode = nodes.find((n) => n.stationId === targetNodeId);
  if (!targetNode) {
    return {
      surgePressureIndex: 0,
      breachedUpstreamCount: 0,
      criticalUpstreamSources: [],
      estimatedSurgeArrivalHours: null,
    };
  }

  // Find all ancestor nodes that flow into this target
  const incomingLinks = links.filter((l) => l.toStationId === targetNodeId);
  let totalWeightedPressure = 0;
  let breachedCount = 0;
  const criticalSources: string[] = [];
  let minArrivalLag: number | null = null;

  for (const link of incomingLinks) {
    const upstreamNode = nodes.find((n) => n.stationId === link.fromStationId);
    if (!upstreamNode) continue;

    if (minArrivalLag === null || link.travelLagHours < minArrivalLag) {
      minArrivalLag = link.travelLagHours;
    }

    // Impact factor is determined by upstream rainfall and whether gauge has breached danger level
    const rainfallFactor = Math.min(100, (upstreamNode.upstreamRainfallMm / 300) * 50);
    const breachFactor = upstreamNode.isBreached ? 40 : 10;
    const riseFactor = Math.min(10, upstreamNode.rateOfRiseM24h * 10);

    const nodePressure = rainfallFactor + breachFactor + riseFactor;
    totalWeightedPressure += nodePressure * link.upstreamContributionRatio;

    if (upstreamNode.isBreached) {
      breachedCount++;
      criticalSources.push(upstreamNode.stationName);
    }
  }

  const finalScore = Math.min(100, Math.round(totalWeightedPressure));

  return {
    surgePressureIndex: finalScore,
    breachedUpstreamCount: breachedCount,
    criticalUpstreamSources: criticalSources,
    estimatedSurgeArrivalHours: minArrivalLag,
  };
}

/**
 * Identifies hydraulic bottlenecks where downstream drainage is slower than upstream inflow.
 */
export function identifyBottlenecks(
  nodes: BasinTwinNode[],
  links: BasinTwinLink[]
): { stationId: string; bottleneckSeverity: 'HIGH' | 'MODERATE' | 'LOW'; reason: string }[] {
  const results: { stationId: string; bottleneckSeverity: 'HIGH' | 'MODERATE' | 'LOW'; reason: string }[] = [];

  for (const node of nodes) {
    const incoming = links.filter((l) => l.toStationId === node.stationId);
    const outgoing = links.filter((l) => l.fromStationId === node.stationId);

    // If incoming upstream contribution is high and elevation gradient drops sharply into flatlands
    if (incoming.length > 0 && outgoing.length > 0) {
      const avgIncomingContribution =
        incoming.reduce((sum, l) => sum + l.upstreamContributionRatio, 0) / incoming.length;
      
      if (node.isBreached && avgIncomingContribution >= 0.7) {
        results.push({
          stationId: node.stationId,
          bottleneckSeverity: 'HIGH',
          reason: `High transboundary inflow ratio (${Math.round(avgIncomingContribution * 100)}%) with water level above danger mark by ${(node.currentLevelM - node.dangerLevelM).toFixed(2)}m.`,
        });
      } else if (node.currentLevelM >= node.dangerLevelM * 0.95) {
        results.push({
          stationId: node.stationId,
          bottleneckSeverity: 'MODERATE',
          reason: 'Water level within 5% of danger threshold; restricted backwater outflow.',
        });
      }
    }
  }

  return results;
}
