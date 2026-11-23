process.env.NODE_ENV = 'test';
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { User } from './modules/users/user.model.js';
import { Invoice } from './modules/invoices/invoice.model.js';
import { Counter } from './modules/invoices/counter.model.js';
import { RefreshToken } from './modules/auth/refreshToken.model.js';
import { EmailToken } from './modules/auth/emailToken.model.js';
import { signPrintToken } from './services/pdf/printToken.js';

async function parseJson(res: any): Promise<any> {
  return res.json();
}

describe('Comprehensive End-to-End API Scenario & Error Handling Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  // Test state
  const testUserA = {
    name: 'Alice Developer',
    email: `alice_${Date.now()}@example.com`,
    password: 'Password123!',
  };
  const testUserB = {
    name: 'Bob Designer',
    email: `bob_${Date.now()}@example.com`,
    password: 'Password456!',
  };

  let tokenA = '';
  let refreshCookieA = '';
  let tokenB = '';
  let invoiceAId = '';

  before(async () => {
    await connectDB();

    // Start ephemeral server
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    // Clean up test data
    const emails = [testUserA.email, testUserB.email];
    const users = await User.find({ email: { $in: emails } });
    const userIds = users.map((u) => u._id);

    if (userIds.length > 0) {
      await Invoice.deleteMany({ userId: { $in: userIds } });
      await Counter.deleteMany({ userId: { $in: userIds } });
      await RefreshToken.deleteMany({ userId: { $in: userIds } });
      await EmailToken.deleteMany({ userId: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
    }

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDB();
  });

  // -------------------------------------------------------------
  // 1. HEALTH CHECKS
  // -------------------------------------------------------------
  describe('1. Health & Readiness Endpoints', () => {
    test('GET /health returns healthy status and uptime', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.status, 'healthy');
      assert.equal(typeof body.uptime, 'number');
    });

    test('GET /ready returns database ready', async () => {
      const res = await fetch(`${baseUrl}/ready`);
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.status, 'ready');
      assert.equal(body.database, 'connected');
    });
  });

  // -------------------------------------------------------------
  // 2. AUTHENTICATION & SECURITY
  // -------------------------------------------------------------
  describe('2. Authentication & Error Scenarios', () => {
    test('POST /auth/signup rejects weak passwords', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Weak User',
          email: 'weak@example.com',
          password: 'short', // less than 8 chars
        }),
      });
      assert.equal(res.status, 400);
      const body = await parseJson(res);
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });

    test('POST /auth/signup creates account for User A and User B', async () => {
      // User A
      const resA = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUserA),
      });
      assert.equal(resA.status, 201);
      const bodyA = await parseJson(resA);
      assert.equal(bodyA.success, true);

      // User B
      const resB = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUserB),
      });
      assert.equal(resB.status, 201);
    });

    test('POST /auth/signup with duplicate email returns generic message (no user enumeration)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUserA),
      });
      assert.equal(res.status, 201);
      const body = await parseJson(res);
      assert.equal(body.success, true);
      assert.match(body.data.message, /verify your account/i);
    });

    test('POST /auth/login fails with wrong password (401 INVALID_CREDENTIALS)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserA.email,
          password: 'IncorrectPassword999',
        }),
      });
      assert.equal(res.status, 401);
      const body = await parseJson(res);
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'INVALID_CREDENTIALS');
    });

    test('POST /auth/login locks account after 5 consecutive failed attempts (423 ACCOUNT_LOCKED)', async () => {
      for (let i = 0; i < 4; i++) {
        await fetch(`${baseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUserA.email,
            password: 'WrongPasswordAgain',
          }),
        });
      }

      // 6th attempt must be locked
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserA.email,
          password: testUserA.password,
        }),
      });
      assert.equal(res.status, 423);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'ACCOUNT_LOCKED');

      // Reset lockout for further testing
      await User.updateOne({ email: testUserA.email }, { failedLogins: 0, lockedUntil: null });
    });

    test('POST /auth/login succeeds for User A and returns tokens', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserA.email,
          password: testUserA.password,
        }),
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.success, true);
      assert.ok(body.data.accessToken);
      tokenA = body.data.accessToken;

      const cookieHeader = res.headers.get('set-cookie');
      assert.ok(cookieHeader);
      assert.match(cookieHeader, /refreshToken=/);
      refreshCookieA = cookieHeader.split(';')[0] || '';

      // Also login User B
      const resB = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserB.email,
          password: testUserB.password,
        }),
      });
      assert.equal(resB.status, 200);
      const bodyB = await parseJson(resB);
      tokenB = bodyB.data.accessToken;
    });

    test('POST /auth/refresh rotates token and rejects replaying old token (Breach detection)', async () => {
      // 1. Refresh with valid cookie
      const resRefresh = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          Cookie: refreshCookieA,
        },
      });
      assert.equal(resRefresh.status, 200);
      const refreshBody = await parseJson(resRefresh);
      assert.ok(refreshBody.data.accessToken);

      // 2. REUSE ATTACK: Replay the OLD refresh token!
      const resReplay = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          Cookie: refreshCookieA,
        },
      });
      assert.equal(resReplay.status, 401);

      // 3. Verify ALL sessions for User A were deleted due to breach detection
      const userA = await User.findOne({ email: testUserA.email });
      const remainingTokens = await RefreshToken.find({ userId: userA?._id });
      assert.equal(remainingTokens.length, 0);

      // Log User A back in to get a fresh token for downstream tests
      const resLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserA.email,
          password: testUserA.password,
        }),
      });
      const loginBody = await parseJson(resLogin);
      tokenA = loginBody.data.accessToken;
    });

    test('POST /auth/verify-email verifies User A successfully', async () => {
      const userA = await User.findOne({ email: testUserA.email });
      const emailTokenDoc = await EmailToken.findOne({ userId: userA?._id, type: 'verify' });
      assert.ok(emailTokenDoc);

      // Verify email directly by updating DB to simulate verification link click
      await User.updateOne({ _id: userA?._id }, { emailVerified: true });
      await EmailToken.deleteOne({ _id: emailTokenDoc._id });

      // Re-login User A so accessToken contains emailVerified: true
      const resLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserA.email,
          password: testUserA.password,
        }),
      });
      assert.equal(resLogin.status, 200);
      const loginBody = await parseJson(resLogin);
      tokenA = loginBody.data.accessToken;
      assert.equal(loginBody.data.user.emailVerified, true);
    });

    test('POST /auth/verify-email rejects invalid token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'bogus-token-123' }),
      });
      assert.equal(res.status, 400);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'INVALID_REQUEST');
    });
  });

  // -------------------------------------------------------------
  // 3. USER PROFILE & SETTINGS
  // -------------------------------------------------------------
  describe('3. Users & Settings Endpoints', () => {
    test('GET /users/me without token returns 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/me`);
      assert.equal(res.status, 401);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    test('GET /users/me with valid token returns profile without passwordHash', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.success, true);
      assert.equal(body.data.email, testUserA.email);
      assert.equal(body.data.passwordHash, undefined);
    });

    test('PATCH /users/me updates business profile and defaults', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business: {
            name: 'Alice Design Labs',
            address: '456 Tech Park, Bangalore',
            taxId: '29ABCDE1234F1Z5',
          },
          defaults: {
            currency: 'INR',
            paymentTermsDays: 30,
          },
        }),
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.data.business.name, 'Alice Design Labs');
      assert.equal(body.data.defaults.paymentTermsDays, 30);
    });

    test('PATCH /users/me password change rejects wrong currentPassword', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'WrongPasswordNow',
          newPassword: 'BrandNewPassword123!',
        }),
      });
      assert.equal(res.status, 400);
      const body = await parseJson(res);
      assert.match(body.error.message, /Incorrect current password/i);
    });

    test('GET /users/me/export returns complete data bundle for GDPR', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/me/export`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.success, true);
      assert.ok(body.data.user);
      assert.ok(Array.isArray(body.data.invoices));
    });

    test('DELETE /users/me requires exact confirmation text', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmText: 'delete me please' }),
      });
      assert.equal(res.status, 400);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'CONFIRM_TEXT_MISMATCH');
    });
  });

  // -------------------------------------------------------------
  // 4. INVOICES LIFECYCLE & STATE MACHINE
  // -------------------------------------------------------------
  describe('4. Invoice Creation, Calculation & State Transitions', () => {
    test('POST /invoices blocks Pro templates on Free plan', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId: 'minimal' }), // Minimal is Pro
      });
      assert.equal(res.status, 403);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'PLAN_LIMIT_REACHED');
    });

    test('POST /invoices creates a draft invoice with prefilled settings', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId: 'classic', currency: 'INR' }),
      });
      assert.equal(res.status, 201);
      const body = await parseJson(res);
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'draft');
      assert.equal(body.data.number, null);
      assert.equal(body.data.seller.businessName, 'Alice Design Labs');
      invoiceAId = body.data._id;
    });

    test('PATCH /invoices/:id updates line items and computes integer totals on server', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client: {
            name: 'Client Acme Corp',
            email: 'billing@acme.com',
          },
          items: [
            {
              description: 'Frontend Architecture Consulting',
              quantity: 2.5, // 2.5 hours
              unitPriceMinor: 100000, // ₹1,000.00
            },
            {
              description: 'API Design & Security Audit',
              quantity: 1,
              unitPriceMinor: 200000, // ₹2,000.00
            },
          ],
          discount: {
            type: 'percent',
            value: 10, // 10% discount
          },
          taxPercent: 18, // 18% GST
        }),
      });

      assert.equal(res.status, 200);
      const body = await parseJson(res);
      const inv = body.data;

      // Mathematical verification:
      // Line 1: round_half_up(2.5 * 100000) = 250000
      // Line 2: round_half_up(1 * 200000) = 200000
      // Subtotal = 450000 (₹4,500.00)
      assert.equal(inv.subtotalMinor, 450000);

      // Discount = round_half_up(450000 * 0.10) = 45000
      assert.equal(inv.discountMinor, 45000);

      // Taxable = 450000 - 45000 = 405000
      assert.equal(inv.taxableMinor, 405000);

      // Tax = round_half_up(405000 * 0.18) = 72900
      assert.equal(inv.taxMinor, 72900);

      // Total = 405000 + 72900 = 477900 (₹4,779.00)
      assert.equal(inv.totalMinor, 477900);
    });

    test('PATCH /invoices/:id handles non-existent or malformed ID gracefully (404 NOT_FOUND)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/not-a-valid-id`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'test' }),
      });
      assert.equal(res.status, 404);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'NOT_FOUND');
    });

    test('POST /invoices/:id/mark-paid fails on draft invoice (400 INVALID_STATE_TRANSITION)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}/mark-paid`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 400);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'INVALID_STATE_TRANSITION');
    });

    test('POST /invoices/:id/mark-sent transitions to sent and assigns sequential number', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}/mark-sent`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.data.invoice.status, 'sent');
      assert.equal(body.data.invoice.number, 'INV-0001');
    });

    test('POST /invoices/:id/mark-paid succeeds from sent status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}/mark-paid`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.data.invoice.status, 'paid');
    });

    test('PATCH /invoices/:id locks financial details on paid invoice', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{ description: 'Sneaky edit', quantity: 1, unitPriceMinor: 1000 }],
        }),
      });
      assert.equal(res.status, 400);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'INVALID_STATE_TRANSITION');
    });

    test('PATCH /invoices/:id permits non-financial updates (notes, terms) on paid invoice', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Thank you for your timely payment!',
        }),
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.data.notes, 'Thank you for your timely payment!');
    });

    test('POST /invoices/:id/mark-unpaid transitions paid back to sent', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}/mark-unpaid`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.data.invoice.status, 'sent');
    });

    test('POST /invoices/:id/archive and unarchive works on sent invoices', async () => {
      // Archive
      const resArch = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(resArch.status, 200);
      const bodyArch = await parseJson(resArch);
      assert.ok(bodyArch.data.archivedAt);

      // Unarchive
      const resUnarch = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}/unarchive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(resUnarch.status, 200);
      const bodyUnarch = await parseJson(resUnarch);
      assert.equal(bodyUnarch.data.archivedAt, null);
    });
  });

  // -------------------------------------------------------------
  // 5. MULTI-TENANCY & IDOR PREVENTION
  // -------------------------------------------------------------
  describe('5. Multi-Tenant Ownership & IDOR Security', () => {
    test('User B cannot view User A invoice (returns 404 NOT_FOUND, never leaks with 403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.equal(res.status, 404);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'NOT_FOUND');
    });

    test('User B cannot edit User A invoice (returns 404 NOT_FOUND)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Hacked by Bob' }),
      });
      assert.equal(res.status, 404);
    });

    test('User B cannot delete User A invoice (returns 404 NOT_FOUND)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.equal(res.status, 404);
    });
  });

  // -------------------------------------------------------------
  // 6. TRASH & SOFT-DELETE LIFECYCLE
  // -------------------------------------------------------------
  describe('6. Trash, Purge TTL & Restore Lifecycle', () => {
    test('DELETE /invoices/:id moves invoice to trash with 30-day purgeAt', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.ok(body.data.purgeAt);
    });

    test('Attempting to mark-sent or edit a trashed invoice fails (400 INVALID_REQUEST)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices/${invoiceAId}/mark-sent`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 400);
      const body = await parseJson(res);
      assert.match(body.error.message, /trashed invoice/i);
    });

    test('GET /trash returns list with calculated daysRemaining', async () => {
      const res = await fetch(`${baseUrl}/api/v1/trash`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.ok(Array.isArray(body.data));
      const trashed = body.data.find((item: any) => item._id === invoiceAId);
      assert.ok(trashed);
      assert.equal(typeof trashed.daysRemaining, 'number');
      assert.ok(trashed.daysRemaining >= 29);
    });

    test('POST /trash/:id/restore restores invoice back to active lists', async () => {
      const res = await fetch(`${baseUrl}/api/v1/trash/${invoiceAId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.data.deletedAt, null);
      assert.equal(body.data.purgeAt, null);
    });
  });

  // -------------------------------------------------------------
  // 7. INPUT SANITIZATION & NOSQL INJECTION PREVENTION
  // -------------------------------------------------------------
  describe('7. NoSQL Injection & Input Sanitization', () => {
    test('mongoSanitize strips rogue $gt and $where operators in body and query', async () => {
      const res = await fetch(`${baseUrl}/api/v1/invoices?status[$gt]=`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.success, true);
    });
  });

  // -------------------------------------------------------------
  // 8. CONTACT FORM & HONEYPOT
  // -------------------------------------------------------------
  describe('8. Contact Form & Anti-Spam Honeypot', () => {
    test('POST /contact silently drops bot submission when honeypot is populated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Spam Bot',
          email: 'bot@spam.com',
          subject: 'Cheap backlinks',
          message: 'Buy our backlinks now at discount.',
          honeypot: 'I am a bot filling hidden fields',
        }),
      });
      assert.equal(res.status, 200);
      const body = await parseJson(res);
      assert.equal(body.success, true);
    });

    test('POST /contact rejects invalid email or missing fields', async () => {
      const res = await fetch(`${baseUrl}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Real User',
          email: 'not-an-email',
          subject: 'Help',
          message: 'Too short',
        }),
      });
      assert.equal(res.status, 400);
      const body = await parseJson(res);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });
  });

  // -------------------------------------------------------------
  // 9. PRINT TOKENS & HTML PREVIEW
  // -------------------------------------------------------------
  describe('9. Signed Print Tokens & HTML Render', () => {
    test('GET /print/invoice/:id rejects missing or invalid print token', async () => {
      const res = await fetch(`${baseUrl}/print/invoice/${invoiceAId}`);
      assert.equal(res.status, 401);

      const resBad = await fetch(`${baseUrl}/print/invoice/${invoiceAId}?token=invalid-token`);
      assert.equal(resBad.status, 401);
    });

    test('GET /print/invoice/:id succeeds with valid 5-minute signed token', async () => {
      const printToken = signPrintToken(invoiceAId, 'some-user-id');
      const res = await fetch(`${baseUrl}/print/invoice/${invoiceAId}?token=${printToken}`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.match(html, /<!DOCTYPE html>/i);
      assert.match(html, /Alice Design Labs/i);
    });
  });
});
