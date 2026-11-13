import test from 'node:test';
import assert from 'node:assert';
import { parseRoute, buildRoute } from './router';

test('parseRoute parses root and empty hashes to landing view', () => {
  assert.deepStrictEqual(parseRoute(''), { view: 'landing' });
  assert.deepStrictEqual(parseRoute('#'), { view: 'landing' });
  assert.deepStrictEqual(parseRoute('#/'), { view: 'landing' });
  assert.deepStrictEqual(parseRoute('#/landing'), { view: 'landing' });
});

test('parseRoute parses valid kebab-case views to internal camelCase view IDs', () => {
  assert.deepStrictEqual(parseRoute('#/dashboard'), { view: 'dashboard' });
  assert.deepStrictEqual(parseRoute('#/health-watch'), { view: 'healthWatch' });
  assert.deepStrictEqual(parseRoute('#/route-safe'), { view: 'routeSafe' });
  assert.deepStrictEqual(parseRoute('#/resilience-planner'), { view: 'resiliencePlanner' });
  assert.deepStrictEqual(parseRoute('#/basin-twin'), { view: 'basinTwin' });
  assert.deepStrictEqual(parseRoute('#/safety-plan'), { view: 'safetyPlan' });
});

test('parseRoute extracts area query parameters', () => {
  assert.deepStrictEqual(parseRoute('#/health-watch?area=gowainghat'), {
    view: 'healthWatch',
    areaId: 'gowainghat',
  });
  assert.deepStrictEqual(parseRoute('#/prediction?area=loc-1'), {
    view: 'prediction',
    areaId: 'loc-1',
  });
});

test('parseRoute falls back to landing on unknown or malformed routes', () => {
  assert.deepStrictEqual(parseRoute('#/random-unknown-slug'), { view: 'landing' });
  assert.deepStrictEqual(parseRoute('#/invalid?foo=bar'), { view: 'landing' });
});

test('buildRoute creates valid hash strings for views and areas', () => {
  assert.strictEqual(buildRoute('landing'), '#/');
  assert.strictEqual(buildRoute('dashboard'), '#/dashboard');
  assert.strictEqual(buildRoute('healthWatch'), '#/health-watch');
  assert.strictEqual(buildRoute('healthWatch', 'gowainghat'), '#/health-watch?area=gowainghat');
  assert.strictEqual(buildRoute('routeSafe', 'loc-2'), '#/route-safe?area=loc-2');
});
