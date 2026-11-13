import test from 'node:test';
import assert from 'node:assert';
import { summarizeNetwork } from './landingSummary';
import { INITIAL_LOCATIONS, INITIAL_ALERTS } from '../data/mockData';
import { LocationData, AlertItem } from '../types';

test('summarizeNetwork calculates accurate counts and exposed populations', () => {
  const summary = summarizeNetwork(INITIAL_LOCATIONS, INITIAL_ALERTS);

  assert.strictEqual(summary.totalLocations, INITIAL_LOCATIONS.length);
  assert.ok(summary.totalPopulationExposed > 0);
  assert.strictEqual(
    summary.countsByRisk.LOW +
      summary.countsByRisk.MODERATE +
      summary.countsByRisk.HIGH +
      summary.countsByRisk.CRITICAL,
    INITIAL_LOCATIONS.length
  );
  assert.strictEqual(
    summary.highOrCriticalCount,
    summary.countsByRisk.HIGH + summary.countsByRisk.CRITICAL
  );
});

test('summarizeNetwork correctly ranks top 3 priority upazilas by combined flood and health risk', () => {
  const summary = summarizeNetwork(INITIAL_LOCATIONS, INITIAL_ALERTS);

  assert.strictEqual(summary.topPriorityUpazilas.length, 3);

  const [first, second, third] = summary.topPriorityUpazilas;
  assert.ok(first.combinedScore >= second.combinedScore);
  assert.ok(second.combinedScore >= third.combinedScore);

  assert.ok(first.location.nameEn.length > 0);
  assert.ok(first.healthRisk.overallScore >= 0);
  assert.ok(['PASSABLE', 'WATERLOGGED', 'CUT_OFF'].includes(first.clinicAccessStatus));
});

test('summarizeNetwork dynamically derives shelter and emergency alert counts', () => {
  const customAlerts: AlertItem[] = [
    {
      id: 'alt-1',
      severity: 'emergency',
      titleEn: 'Emergency Flash Surge',
      titleBn: 'জরুরি পাহাড়ি ঢল',
      locationEn: 'Gowainghat',
      locationBn: 'গোয়াইনঘাট',
      district: 'Sylhet',
      messageEn: 'Breach imminent',
      messageBn: 'বিপদসীমা অতিক্রম',
      actionEn: 'Evacuate now',
      actionBn: 'দ্রুত সরে যান',
      timestamp: '10m ago',
      isVerified: true,
      isRead: false,
      affectedPopulation: 25000,
      source: 'BWDB',
    },
    {
      id: 'alt-2',
      severity: 'warning',
      titleEn: 'Warning Alert',
      titleBn: 'সতর্কবার্তা',
      locationEn: 'Companiganj',
      locationBn: 'কোম্পানীগঞ্জ',
      district: 'Sylhet',
      messageEn: 'Water rising',
      messageBn: 'পানি বাড়ছে',
      actionEn: 'Prepare emergency kit',
      actionBn: 'জরুরি কিট প্রস্তুত রাখুন',
      timestamp: '20m ago',
      isVerified: true,
      isRead: true,
      affectedPopulation: 12000,
      source: 'BWDB',
    },
  ];

  const summary = summarizeNetwork(INITIAL_LOCATIONS, customAlerts);

  assert.strictEqual(summary.totalUnreadAlerts, 1);
  assert.strictEqual(summary.totalEmergencyAlerts, 1);
  assert.ok(summary.totalSheltersCount > 0);
});

test('summarizeNetwork handles empty inputs without throwing', () => {
  const summary = summarizeNetwork([], []);

  assert.strictEqual(summary.totalLocations, 0);
  assert.strictEqual(summary.totalPopulationExposed, 0);
  assert.strictEqual(summary.highOrCriticalCount, 0);
  assert.strictEqual(summary.topPriorityUpazilas.length, 0);
  assert.strictEqual(summary.totalUnreadAlerts, 0);
});
