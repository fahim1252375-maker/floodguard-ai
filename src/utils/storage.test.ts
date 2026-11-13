import test from 'node:test';
import assert from 'node:assert';
import { safeGetItem, safeSetItem, safeRemoveItem } from './storage';

test('safeGetItem and safeSetItem work correctly with in-memory mock', () => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };

  // Attach mock to global window
  (globalThis as any).window = {
    localStorage: mockStorage,
  };

  const success = safeSetItem('test_key', { count: 42, label: 'health' });
  assert.strictEqual(success, true);

  const value = safeGetItem('test_key', { count: 0, label: '' });
  assert.deepStrictEqual(value, { count: 42, label: 'health' });

  safeRemoveItem('test_key');
  const afterRemove = safeGetItem('test_key', 'default_val');
  assert.strictEqual(afterRemove, 'default_val');
});

test('safeGetItem returns defaultValue when key does not exist', () => {
  const store: Record<string, string> = {};
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    },
  };

  const val = safeGetItem('non_existent', 'fallback');
  assert.strictEqual(val, 'fallback');
});

test('safeGetItem and safeSetItem gracefully catch throwing storage exceptions', () => {
  // Simulate private mode SecurityError / QuotaExceededError
  (globalThis as any).window = {
    localStorage: {
      getItem: () => {
        throw new Error('SecurityError: The operation is insecure.');
      },
      setItem: () => {
        throw new Error('QuotaExceededError: Storage quota exceeded.');
      },
      removeItem: () => {
        throw new Error('SecurityError: The operation is insecure.');
      },
    },
  };

  const getResult = safeGetItem('restricted_key', 'safe_fallback');
  assert.strictEqual(getResult, 'safe_fallback');

  const setResult = safeSetItem('restricted_key', { some: 'data' });
  assert.strictEqual(setResult, false);

  const removeResult = safeRemoveItem('restricted_key');
  assert.strictEqual(removeResult, false);
});
