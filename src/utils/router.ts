/**
 * Hash Routing Utilities for FloodGuard AI
 * Supports lightweight client-side routing using window.location.hash
 * Example routes:
 *   #/dashboard
 *   #/health-watch
 *   #/health-watch?area=gowainghat
 *   #/prediction?area=loc-1
 */

export interface ParsedRoute {
  view: string;
  areaId?: string;
}

// Maps internal camelCase view IDs to clean URL kebab-case slugs
export const VIEW_TO_PATH: Record<string, string> = {
  landing: 'landing',
  dashboard: 'dashboard',
  healthWatch: 'health-watch',
  prediction: 'prediction',
  simulator: 'simulator',
  map: 'map',
  alerts: 'alerts',
  routeSafe: 'route-safe',
  basinTwin: 'basin-twin',
  evidenceFusion: 'evidence-fusion',
  satellite: 'satellite',
  impactLens: 'impact-lens',
  resiliencePlanner: 'resilience-planner',
  safetyPlan: 'safety-plan',
  opsCenter: 'ops-center',
  globalCoverage: 'global-coverage',
  community: 'community',
  historical: 'historical',
  assistant: 'assistant',
  admin: 'admin',
  about: 'about',
};

// Maps URL kebab-case slugs back to internal camelCase view IDs
export const PATH_TO_VIEW: Record<string, string> = Object.entries(VIEW_TO_PATH).reduce(
  (acc, [view, path]) => {
    acc[path] = view;
    return acc;
  },
  {} as Record<string, string>
);

// Fallback view when unknown or empty hash
export const DEFAULT_VIEW = 'landing';

/**
 * Parses window.location.hash into a view ID and optional query parameters (such as ?area=...)
 */
export function parseRoute(hash: string): ParsedRoute {
  if (!hash || hash === '#' || hash === '#/') {
    return { view: DEFAULT_VIEW };
  }

  // Strip leading '#' or '#/'
  const raw = hash.replace(/^#\/?/, '').trim();
  if (!raw) {
    return { view: DEFAULT_VIEW };
  }

  const [pathPart, queryPart] = raw.split('?');
  const normalizedPath = (pathPart || '').toLowerCase().trim();
  const matchedView = PATH_TO_VIEW[normalizedPath];

  const view = matchedView || DEFAULT_VIEW;

  const result: ParsedRoute = { view };
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    const area = params.get('area');
    if (area) {
      result.areaId = area.trim().toLowerCase();
    }
  }

  return result;
}

/**
 * Builds a valid hash string for the specified view and optional target area ID
 */
export function buildRoute(view: string, areaId?: string): string {
  const path = VIEW_TO_PATH[view] || (view === 'landing' ? '' : view);
  if (!path || path === 'landing') {
    return areaId ? `#/landing?area=${encodeURIComponent(areaId)}` : '#/';
  }

  if (areaId) {
    return `#/${path}?area=${encodeURIComponent(areaId)}`;
  }

  return `#/${path}`;
}
