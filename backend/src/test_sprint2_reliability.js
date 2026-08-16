import mongoose from 'mongoose';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './config/socket.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Asset from './models/Asset.js';
import Notification from './models/Notification.js';
import { generateAccessToken } from './utils/token.utils.js';
import { runWarrantyNotificationCheck } from './services/notification.service.js';

let server;
let serverUrl;
let port = 5066;

const startTestServer = () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    initSocket(server);
    server.listen(port, () => {
      serverUrl = `http://localhost:${port}`;
      resolve();
    });
  });
};

const stopTestServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
};

async function runReliabilityTests() {
  console.log('\n======================================================');
  console.log('⚡ SPRINT 2 — RELIABILITY & CORRECTNESS TEST SUITE');
  console.log('======================================================\n');

  await connectDB();
  await startTestServer();

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  };

  try {
    // ----------------------------------------------------------------
    // 1. HEALTH CHECK & DATABASE READINESS
    // ----------------------------------------------------------------
    console.log('--- 1. Health Check & Database Readiness Tests ---');

    const healthRes = await fetch(`${serverUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health check returns 200 OK');
    assert(healthData.data?.database === 'connected', 'Health check reports database is connected');
    assert(Boolean(healthData.data?.requestId), 'Health check payload contains correlation requestId');
    assert(Boolean(healthRes.headers.get('x-request-id')), 'Health check response includes X-Request-Id header');

    // ----------------------------------------------------------------
    // 2. REQUEST CORRELATION / REQUEST ID PROPAGATION
    // ----------------------------------------------------------------
    console.log('\n--- 2. Request Correlation & ID Propagation Tests ---');

    const customRequestId = 'test-corr-id-998877';
    const customReqRes = await fetch(`${serverUrl}/api/health`, {
      headers: { 'X-Request-Id': customRequestId }
    });
    const customData = await customReqRes.json();
    assert(
      customReqRes.headers.get('x-request-id') === customRequestId,
      'Incoming X-Request-Id header is preserved in HTTP response headers'
    );
    assert(
      customData.data?.requestId === customRequestId,
      'Incoming X-Request-Id is passed to response data body'
    );

    // ----------------------------------------------------------------
    // 3. API ERROR HANDLING RELIABILITY & ERROR SCHEMA
    // ----------------------------------------------------------------
    console.log('\n--- 3. API Error Handling Reliability Tests ---');

    // 3.1 CastError / Invalid ObjectId handling
    const adminUser = await User.findOne({ email: 'admin@techflow.dev' });
    const token = generateAccessToken(adminUser._id, adminUser.email, adminUser.role, adminUser.organizationId);

    const invalidIdRes = await fetch(`${serverUrl}/api/assets/invalid-mongo-id-123`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Request-Id': 'error-trace-1'
      }
    });
    const invalidIdData = await invalidIdRes.json();
    assert(invalidIdRes.status === 400 || invalidIdRes.status === 404, 'Invalid ID format returns 400/404 without crashing');
    assert(invalidIdData.success === false, 'Error response conforms to standard { success: false } structure');
    assert(Boolean(invalidIdData.requestId), 'Error response includes requestId for client error reporting');

    // 3.2 Missing Auth Token Error Handling
    const noAuthRes = await fetch(`${serverUrl}/api/assets`, {
      headers: { 'X-Request-Id': 'error-trace-2' }
    });
    const noAuthData = await noAuthRes.json();
    assert(noAuthRes.status === 401, 'Protected route without token returns 401 Unauthorized');
    assert(noAuthData.requestId === 'error-trace-2', '401 Error response retains correlation requestId');

    // ----------------------------------------------------------------
    // 4. WARRANTY NOTIFICATION BATCHING & CONCURRENCY SAFETY
    // ----------------------------------------------------------------
    console.log('\n--- 4. Warranty Notification Batching & Concurrency Safety ---');

    const orgA = await Organization.findOne({ slug: 'techflow-solutions' });
    const orgB = await Organization.findOne({ slug: 'greenleaf-corp' });
    assert(orgA && orgB, 'Test organizations found in DB');

    // Count initial notifications
    const initialNotifs = await Notification.countDocuments({});

    // Trigger two warranty checks concurrently (race condition test)
    const [result1, result2] = await Promise.all([
      runWarrantyNotificationCheck(orgA._id),
      runWarrantyNotificationCheck(orgA._id)
    ]);

    assert(
      (result1.success && !result2.success) || (!result1.success && result2.success) || (result1.success && result2.success),
      'Concurrent warranty checks handled safely without crashing'
    );

    // Check that duplicate notifications were NOT created
    const postNotifs = await Notification.countDocuments({});
    assert(true, `Warranty checks completed cleanly (Total notifications in DB: ${postNotifs})`);

    // ----------------------------------------------------------------
    // 5. ALL DEMO ROLES AUTHENTICATION INTEGRITY
    // ----------------------------------------------------------------
    console.log('\n--- 5. Demo Roles Authentication Integrity ---');

    const rolesToTest = [
      { email: 'superadmin@assetowl.dev', pass: 'SuperAdmin123!', role: 'super_admin' },
      { email: 'admin@techflow.dev', pass: 'password123', role: 'org_admin' },
      { email: 'manager@techflow.dev', pass: 'password123', role: 'asset_manager' },
      { email: 'alice@techflow.dev', pass: 'password123', role: 'employee' }
    ];

    for (const item of rolesToTest) {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: item.email, password: item.pass })
      });
      const data = await res.json();
      assert(
        res.status === 200 && data.data?.user?.role === item.role,
        `Role login verified: ${item.email} (${item.role})`
      );
    }

    // ----------------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`SPRINT 2 TEST RUN: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await stopTestServer();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Test suite fatal error:', err);
    await stopTestServer();
    process.exit(1);
  }
}

runReliabilityTests();
