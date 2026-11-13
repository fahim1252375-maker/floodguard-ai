import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  writeAtomicJson,
  validateReportInput,
  sanitizeReportInput,
  toPublicReport,
  checkRateLimit,
  resetRateLimits,
  RATE_LIMIT_MAX_REPORTS,
} from './persistence';

test('writeAtomicJson writes valid JSON and preserves content', async () => {
  const testFile = path.resolve(process.cwd(), 'data', 'test_atomic.json');
  const payload = { test: true, timestamp: Date.now() };

  await writeAtomicJson(testFile, payload);
  assert.ok(fs.existsSync(testFile));

  const content = JSON.parse(await fs.promises.readFile(testFile, 'utf-8'));
  assert.strictEqual(content.test, true);

  // Clean up
  await fs.promises.unlink(testFile);
});

const validReport = () => ({
  reporterName: 'Field Volunteer',
  phoneOrContact: '+880 1700-000000',
  district: 'Sylhet',
  upazilaEn: 'Gowainghat',
  villageOrArea: 'Jaflong Road Sector 4',
  waterDepthValue: 2.5,
  waterDepthUnit: 'ft',
  waterTrend: 'rapidly_rising',
  roadCondition: 'inundated',
  electricityStatus: 'cut_off',
  description: 'Water flowing rapidly into low-lying village paddy fields',
  consent: true,
});

test('validateReportInput accepts the payload the report form actually sends', () => {
  assert.strictEqual(validateReportInput(validReport()).valid, true);
});

test('validateReportInput rejects missing consent, bad enums, bad depth and non-https photos', () => {
  assert.strictEqual(validateReportInput({ ...validReport(), consent: false }).valid, false);
  assert.strictEqual(validateReportInput({ ...validReport(), consent: undefined }).valid, false);
  assert.strictEqual(validateReportInput({ ...validReport(), district: 'Dhaka' }).valid, false);
  assert.strictEqual(validateReportInput({ ...validReport(), roadCondition: 'on_fire' }).valid, false);
  assert.strictEqual(validateReportInput({ ...validReport(), waterDepthValue: -5 }).valid, false);
  assert.strictEqual(validateReportInput({ ...validReport(), waterDepthValue: 500 }).valid, false); // 500 ft
  assert.strictEqual(validateReportInput({ ...validReport(), description: 'x' }).valid, false);
  assert.strictEqual(validateReportInput({ ...validReport(), photoUrl: 'javascript:alert(1)' }).valid, false);
  assert.strictEqual(validateReportInput({ ...validReport(), photoUrl: 'http://example.com/a.jpg' }).valid, false);
  assert.strictEqual(validateReportInput({ ...validReport(), photoUrl: 'https://example.com/a.jpg' }).valid, true);
  assert.strictEqual(validateReportInput(null).valid, false);
});

test('sanitizeReportInput whitelists fields and strips markup so clients cannot set status or verifiedBy', () => {
  const stored = sanitizeReportInput({
    ...validReport(),
    reporterName: '  <b>Rahim</b>\u0000  ',
    status: 'verified',
    verifiedBy: 'Fake Officer',
    id: 'hijack',
    isAdmin: true,
  }) as any;

  assert.strictEqual(stored.reporterName, 'bRahim/b');
  assert.strictEqual(stored.status, undefined);
  assert.strictEqual(stored.verifiedBy, undefined);
  assert.strictEqual(stored.id, undefined);
  assert.strictEqual(stored.isAdmin, undefined);
  assert.strictEqual(stored.photoUrl, undefined);
  assert.ok(typeof stored.consentedAt === 'string' && !Number.isNaN(Date.parse(stored.consentedAt)));
});

test('toPublicReport never exposes the contact number', () => {
  const full: any = {
    ...sanitizeReportInput(validReport()),
    id: 'rep-1',
    timestamp: 'now',
    status: 'pending',
  };
  assert.strictEqual(full.phoneOrContact, '+880 1700-000000');
  const publicView: any = toPublicReport(full);
  assert.strictEqual('phoneOrContact' in publicView, false);
  assert.strictEqual(publicView.reporterName, 'Field Volunteer');
});

test('checkRateLimit enforces 5 reports per 10 minutes per IP', () => {
  resetRateLimits();
  const testIp = '192.168.1.100';

  for (let i = 0; i < RATE_LIMIT_MAX_REPORTS; i++) {
    const res = checkRateLimit(testIp);
    assert.strictEqual(res.allowed, true, `Attempt ${i + 1} should be allowed`);
  }

  // 6th attempt should be blocked
  const blockedRes = checkRateLimit(testIp);
  assert.strictEqual(blockedRes.allowed, false);
  assert.ok(blockedRes.retryAfterSeconds && blockedRes.retryAfterSeconds > 0);

  // Different IP should still be allowed
  const differentIpRes = checkRateLimit('192.168.1.101');
  assert.strictEqual(differentIpRes.allowed, true);
});


test('concurrent JSON updates complete in call order without an older write replacing the latest state', async () => {
  const testFile = path.resolve(process.cwd(), 'data', 'test_concurrent_atomic.json');
  await Promise.all(Array.from({ length: 25 }, (_, i) => writeAtomicJson(testFile, { revision: i, payload: `record-${i}` })));
  const latest = JSON.parse(await fs.promises.readFile(testFile, 'utf-8'));
  assert.equal(latest.revision, 24);
  assert.equal(latest.payload, 'record-24');
  await fs.promises.unlink(testFile);
});
