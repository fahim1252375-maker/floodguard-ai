/**
 * Exercises the real route handlers by walking router.stack, so no HTTP server is needed.
 * Works with Express 4/5 Routers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from './db';
import { createOpsRouter } from './opsRouter';
import { INITIAL_LOCATIONS } from '../src/data/mockData';
import { seedDemoHistory, runCycle } from './engine';
import { getAdminPin } from '../src/utils/adminAuth';

type Resp = { status: number; body: any };

function makeApp() {
  const db = openDb(':memory:');
  seedDemoHistory(db, INITIAL_LOCATIONS);
  const router: any = createOpsRouter(db, INITIAL_LOCATIONS, async () => ({ locations: INITIAL_LOCATIONS, isLive: false }));
  async function call(
    method: string,
    url: string,
    opts: { body?: any; headers?: Record<string, string>; ip?: string } = {}
  ): Promise<Resp> {
    const [pathname, qs = ''] = url.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs));
    for (const layer of router.stack) {
      const route = layer.route;
      if (!route || !route.methods?.[method.toLowerCase()]) continue;
      const names: string[] = [];
      const re = new RegExp('^' + route.path.replace(/:([A-Za-z]+)/g, (_: string, n: string) => (names.push(n), '([^/]+)')) + '$');
      const m = pathname.match(re);
      if (!m) continue;
      const params = Object.fromEntries(names.map((n, i) => [n, m[i + 1]]));
      const headers = Object.fromEntries(Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
      const req: any = { params, query, body: opts.body ?? {}, headers, ip: opts.ip ?? '1.1.1.1', socket: {} };
      let out: Resp = { status: 200, body: undefined };
      let done = false;
      const res: any = {
        status(c: number) { out.status = c; return res; },
        json(b: any) { out.body = b; done = true; return res; },
        writeHead() {}, write() {}, 
      };
      const handlers = route.stack.map((l: any) => l.handle);
      for (const h of handlers) {
        let advanced = false;
        await h(req, res, () => { advanced = true; });
        if (done || !advanced) break;
      }
      return out;
    }
    throw new Error(`no route ${method} ${pathname}`);
  }
  return { db, call };
}
const PIN = { 'x-admin-pin': '' };

test('forecast uses recorded readings when enough exist, and says so', async () => {
  const { call } = makeApp();
  const r = await call('GET', '/forecast/kanaighat?horizon=24');
  assert.equal(r.body.available, true);
  assert.equal(r.body.basis, 'recorded_readings');
  assert.equal(r.body.includesDemoSeed, true);
  assert.equal(r.body.result.points.length, 24);
  assert.equal((await call('GET', '/forecast/nowhere')).status, 404);
});

test('check-in flow: validate, rate-limit, summarise publicly, resolve/delete via token', async () => {
  const { call } = makeApp();
  const bad = await call('POST', '/checkins', { body: { locationId: 'chhatak', status: 'safe', people: 2 } });
  assert.equal(bad.status, 400);
  const good = { locationId: 'chhatak', status: 'need_help', people: 5, contact: '+8801700000000', consent: true };
  const made = await call('POST', '/checkins', { body: good });
  assert.equal(made.status, 201);
  assert.ok(made.body.token);
  const sum = await call('GET', '/checkins/summary');
  assert.equal(sum.body.areas.chhatak.need_help.people, 5);
  assert.ok(!JSON.stringify(sum.body).includes('+88017'));
  assert.equal((await call('POST', '/checkins/mine/resolve', { headers: { 'x-ops-token': made.body.token } })).status, 200);
  assert.equal((await call('GET', '/checkins/summary')).body.areas.chhatak?.need_help, undefined);
  assert.equal((await call('DELETE', '/checkins/mine', { headers: { 'x-ops-token': made.body.token } })).status, 200);
  assert.equal((await call('DELETE', '/checkins/mine', { headers: { 'x-ops-token': 'nope' } })).status, 404);
  for (let i = 0; i < 6; i++) await call('POST', '/checkins', { body: good, ip: '9.9.9.9' });
  assert.equal((await call('POST', '/checkins', { body: good, ip: '9.9.9.9' })).status, 429);
});

test('admin routes reject missing/incorrect PIN and accept the right one', async () => {
  const { call } = makeApp();
  for (const [m, u] of [['GET', '/checkins'], ['GET', '/outbox'], ['GET', '/audit'], ['GET', '/sitreps'], ['POST', '/cycle']] as const) {
    assert.equal((await call(m, u)).status, 401, `${m} ${u}`);
    assert.equal((await call(m, u, { headers: { 'x-admin-pin': 'wrong' } })).status, 401);
  }
  PIN['x-admin-pin'] = getAdminPin();
  // The previous ten wrong-PIN requests deliberately rate-limited 1.1.1.1.
  // Use a fresh test IP to verify that a valid administrator can still authenticate.
  const list = await call('GET', '/checkins', { headers: PIN, ip: '2.2.2.2' });
  assert.equal(list.status, 200);
});

test('subscribe, read back masked, then unsubscribe deletes the record', async () => {
  const { call } = makeApp();
  assert.equal((await call('POST', '/subscribers', { body: { locationId: 'chhatak', channel: 'sms', contact: '+8801700000000' } })).status, 400);
  const s = await call('POST', '/subscribers', { body: { locationId: 'chhatak', channel: 'sms', contact: '+8801700000000', language: 'bn', consent: true } });
  assert.equal(s.status, 201);
  const me = await call('GET', '/subscribers/me', { headers: { 'x-ops-token': s.body.token } });
  assert.ok(me.body.contact.includes('*') && !me.body.contact.includes('0000000'));
  assert.equal((await call('DELETE', '/subscribers/me', { headers: { 'x-ops-token': s.body.token } })).status, 200);
  assert.equal((await call('GET', '/subscribers/me', { headers: { 'x-ops-token': s.body.token } })).status, 404);
});

test('admin workflow: cycle creates events, outbox send, sitrep archive, audit trail', async () => {
  const { call, db } = makeApp();
  const H = { 'x-admin-pin': getAdminPin() };
  const adminIp = '3.3.3.3';
  await call('POST', '/subscribers', { body: { locationId: 'gowainghat', channel: 'sms', contact: '+8801700000000', language: 'en', minSeverity: 'watch', consent: true } });
  const cyc = await call('POST', '/cycle', { headers: H, ip: adminIp });
  assert.equal(cyc.status, 200);
  assert.ok(cyc.body.newEvents > 0);
  const events = await call('GET', '/events?limit=5');
  assert.ok(events.body.events.length > 0);
  const ack = await call('POST', `/events/${events.body.events[0].id}/ack`, { headers: H, ip: adminIp });
  assert.equal(ack.status, 200);
  assert.equal((await call('POST', `/events/${events.body.events[0].id}/ack`, { headers: H, ip: adminIp })).status, 404);
  const box = await call('GET', '/outbox', { headers: H, ip: adminIp });
  assert.ok(box.body.queued.length > 0);
  assert.equal((await call('POST', `/outbox/${box.body.queued[0].id}/sent`, { headers: H, ip: adminIp })).status, 200);
  assert.equal((await call('POST', '/sitreps', { headers: H, ip: adminIp, body: { body: 'short' } })).status, 400);
  assert.equal((await call('POST', '/sitreps', { headers: H, ip: adminIp, body: { body: '# SitRep\n'.repeat(5), language: 'en' } })).status, 201);
  assert.equal((await call('GET', '/sitreps', { headers: H, ip: adminIp })).body.sitreps.length, 1);
  const audit = await call('GET', '/audit', { headers: H, ip: adminIp });
  assert.ok(audit.body.audit.some((a: any) => a.action === 'outbox.sent'));
  void db; void runCycle;
});
