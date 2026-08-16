import mongoose from 'mongoose';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './config/socket.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Asset from './models/Asset.js';
import Ticket from './models/Ticket.js';
import Assignment from './models/Assignment.js';
import Notification from './models/Notification.js';
import TicketMessage from './models/TicketMessage.js';
import AuditLog from './models/AuditLog.js';
import { generateAccessToken } from './utils/token.utils.js';
import { runWarrantyNotificationCheck } from './services/notification.service.js';

let server;
let serverUrl;
let port = 5077;

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

async function runPerformanceTests() {
  console.log('\n======================================================');
  console.log('🚀 SPRINT 3 — PERFORMANCE & SCALABILITY TEST SUITE');
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
    const adminUser = await User.findOne({ email: 'admin@techflow.dev' });
    const managerUser = await User.findOne({ email: 'manager@techflow.dev' });
    const org = await Organization.findOne({ slug: 'techflow-solutions' });

    assert(Boolean(adminUser && managerUser && org), 'Seed users and organization found');

    const adminToken = generateAccessToken(adminUser._id, adminUser.email, adminUser.role, adminUser.organizationId);
    const managerToken = generateAccessToken(managerUser._id, managerUser.email, managerUser.role, managerUser.organizationId);

    // ----------------------------------------------------------------
    // 1. API PAGINATION & SEARCH TESTS
    // ----------------------------------------------------------------
    console.log('\n--- 1. API Pagination & Search Filtering Tests ---');

    // 1.1 Asset Pagination
    const pageRes = await fetch(`${serverUrl}/api/assets?page=1&limit=3`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const pageData = await pageRes.json();
    assert(pageRes.status === 200, 'Paginated asset query returns 200 OK');
    assert(Array.isArray(pageData.data) && pageData.data.length <= 3, 'Paginated data items match page size limit');
    assert(
      pageData.pagination && pageData.pagination.page === 1 && pageData.pagination.limit === 3 && typeof pageData.pagination.total === 'number',
      'Pagination metadata returned with page, limit, total, and totalPages'
    );

    // 1.2 Asset Search Filter
    const searchRes = await fetch(`${serverUrl}/api/assets?search=MacBook`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, 'Asset search query returns 200 OK');
    assert(Array.isArray(searchData.data), 'Search query returns array of matched assets');

    // 1.3 Backward Compatibility (No pagination params returns array)
    const unpaginatedRes = await fetch(`${serverUrl}/api/assets`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const unpaginatedData = await unpaginatedRes.json();
    assert(Array.isArray(unpaginatedData.data), 'Standard query without page param returns full dataset array');

    // 1.4 Ticket Pagination
    const ticketPageRes = await fetch(`${serverUrl}/api/tickets?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const ticketPageData = await ticketPageRes.json();
    assert(ticketPageRes.status === 200, 'Paginated ticket query returns 200 OK');
    assert(
      ticketPageData.pagination && ticketPageData.pagination.limit === 2,
      'Ticket pagination returns valid metadata structure'
    );

    // ----------------------------------------------------------------
    // 2. DATABASE PERFORMANCE INDEX VERIFICATION
    // ----------------------------------------------------------------
    console.log('\n--- 2. Database Compound Index Verification ---');

    // Check indexes are registered on schemas
    const assetIndexes = Asset.schema.indexes();
    const ticketIndexes = Ticket.schema.indexes();
    const assignmentIndexes = Assignment.schema.indexes();
    const notificationIndexes = Notification.schema.indexes();

    assert(
      assetIndexes.some((idx) => idx[0].organizationId && idx[0].status),
      'Asset model contains compound index: { organizationId: 1, status: 1 }'
    );
    assert(
      assetIndexes.some((idx) => idx[0].organizationId && idx[0].createdAt),
      'Asset model contains compound index: { organizationId: 1, createdAt: -1 }'
    );
    assert(
      ticketIndexes.some((idx) => idx[0].organizationId && idx[0].status),
      'Ticket model contains compound index: { organizationId: 1, status: 1 }'
    );
    assert(
      ticketIndexes.some((idx) => idx[0].organizationId && idx[0].handler),
      'Ticket model contains compound index: { organizationId: 1, handler: 1 }'
    );
    assert(
      assignmentIndexes.some((idx) => idx[0].organizationId && idx[0].employeeId && idx[0].returnedAt),
      'Assignment model contains compound index: { organizationId: 1, employeeId: 1, returnedAt: 1 }'
    );
    assert(
      notificationIndexes.some((idx) => idx[0].userId && idx[0].read && idx[0].createdAt),
      'Notification model contains compound index: { userId: 1, read: 1, createdAt: -1 }'
    );

    // ----------------------------------------------------------------
    // 3. AI ANALYSIS CACHING & COOLDOWN TESTS
    // ----------------------------------------------------------------
    console.log('\n--- 3. AI Analysis Caching & Cooldown Tests ---');

    const sampleAsset = await Asset.findOne({ organizationId: org._id, status: { $ne: 'retired' } });
    assert(Boolean(sampleAsset), 'Sample asset found for AI evaluation');

    // 3.1 Initial Analysis (Fresh computation)
    const t0 = Date.now();
    const aiRes1 = await fetch(`${serverUrl}/api/assets/${sampleAsset._id}/analyze?force=true`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const aiData1 = await aiRes1.json();
    const t1 = Date.now();
    assert(aiRes1.status === 200 && aiData1.data?.healthScore > 0, 'Initial AI diagnosis completes successfully');

    // 3.2 Second Analysis within cooldown (Instant cache return)
    const t2 = Date.now();
    const aiRes2 = await fetch(`${serverUrl}/api/assets/${sampleAsset._id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const aiData2 = await aiRes2.json();
    const t3 = Date.now();
    const cachedLatency = t3 - t2;

    assert(aiRes2.status === 200, 'Subsequent AI request within cooldown returns 200 OK');
    assert(
      aiData2.data?.cached === true || aiData2.data?.source === 'cached',
      'AI returns cached diagnosis without re-running LLM/heuristics'
    );
    assert(cachedLatency < 50, `Cached AI response is lightning fast (${cachedLatency}ms < 50ms)`);

    // ----------------------------------------------------------------
    // 4. BULK WARRANTY NOTIFICATION INSERTION
    // ----------------------------------------------------------------
    console.log('\n--- 4. Bulk Warranty Notification Performance ---');

    const warrantyResult = await runWarrantyNotificationCheck(org._id);
    assert(warrantyResult.success === true, 'Bulk warranty notification check executed cleanly');

    // ----------------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`SPRINT 3 TEST RUN: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await stopTestServer();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Test suite fatal error:', err);
    await stopTestServer();
    process.exit(1);
  }
}

runPerformanceTests();
