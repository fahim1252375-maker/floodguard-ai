import test from 'node:test';
import assert from 'node:assert';
import { getAdminPin, verifyAdminPin, adminAuthMiddleware } from './adminAuth';

test('getAdminPin generates random PIN or reads environment variable', () => {
  const pin = getAdminPin();
  assert.ok(typeof pin === 'string' && pin.length >= 6);
});

test('verifyAdminPin validates matching PIN and rejects incorrect ones', () => {
  const actual = getAdminPin();
  assert.strictEqual(verifyAdminPin(actual), true);
  assert.strictEqual(verifyAdminPin('wrong-pin-9999'), false);
  assert.strictEqual(verifyAdminPin(undefined), false);
  assert.strictEqual(verifyAdminPin(''), false);
});

test('adminAuthMiddleware rejects requests without valid x-admin-pin header with 401', () => {
  let statusCode = 0;
  let responseBody: any = null;
  let nextCalled = false;

  const mockReq: any = {
    headers: {},
    ip: '127.0.0.1',
    socket: {},
  };

  const mockRes: any = {
    status(code: number) {
      statusCode = code;
      return {
        json(body: any) {
          responseBody = body;
        },
      };
    },
  };

  const mockNext = () => {
    nextCalled = true;
  };

  adminAuthMiddleware(mockReq, mockRes, mockNext);

  assert.strictEqual(statusCode, 401);
  assert.strictEqual(nextCalled, false);
  assert.ok(responseBody?.error?.includes('Unauthorized'));
});

test('adminAuthMiddleware allows requests with matching x-admin-pin header', () => {
  let nextCalled = false;

  const mockReq: any = {
    headers: {
      'x-admin-pin': getAdminPin(),
    },
    ip: '127.0.0.2',
    socket: {},
  };

  const mockRes: any = {};
  const mockNext = () => {
    nextCalled = true;
  };

  adminAuthMiddleware(mockReq, mockRes, mockNext);

  assert.strictEqual(nextCalled, true);
});

test('verifyAdminPin safely rejects differing lengths without throwing timing exceptions', () => {
  assert.strictEqual(verifyAdminPin('1'), false);
  assert.strictEqual(verifyAdminPin('1234567890'), false);
  assert.strictEqual(verifyAdminPin('!@#$%^'), false);
});


test('verifyAdminPin rejects multi-byte candidates without throwing', () => {
  assert.strictEqual(verifyAdminPin('éééééé'), false);
});
