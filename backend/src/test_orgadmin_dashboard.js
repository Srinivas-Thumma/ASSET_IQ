import mongoose from 'mongoose';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './config/socket.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import { generateAccessToken } from './utils/token.utils.js';

let server;
let serverUrl;

const startTestServer = () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    initSocket(server);
    server.listen(0, '127.0.0.1', () => {
      const assignedPort = server.address().port;
      serverUrl = `http://127.0.0.1:${assignedPort}`;
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

async function testOrgAdminDashboard() {
  console.log('\n======================================================');
  console.log('📊 ORG ADMIN DASHBOARD REAL-TIME STATS TEST SUITE');
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
    const org = await Organization.findOne({ slug: 'techflow-solutions' });
    assert(org, 'Organization TechFlow Solutions found in DB');

    const admin = await User.findOne({ organizationId: org._id, role: 'org_admin' });
    assert(admin, 'Org Admin user found in DB');

    const adminToken = generateAccessToken(admin);

    // 1. Test GET /api/dashboard/stats
    console.log('\n--- 1. Testing GET /api/dashboard/stats ---');
    const resStats = await fetch(`${serverUrl}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataStats = await resStats.json();

    assert(resStats.status === 200, 'GET /api/dashboard/stats returns 200 OK');
    assert(dataStats.data !== undefined, 'Stats data payload exists');
    assert(typeof dataStats.data?.totalAssets === 'number' && dataStats.data.totalAssets > 0, `Total assets is non-zero number (${dataStats.data?.totalAssets})`);
    assert(dataStats.data?.assetsByStatus?.stock !== undefined, `Stock count is returned (${dataStats.data?.assetsByStatus?.stock})`);
    assert(dataStats.data?.assetsByStatus?.assigned !== undefined, `Assigned count is returned (${dataStats.data?.assetsByStatus?.assigned})`);
    assert(dataStats.data?.unassignedStock !== undefined, `Unassigned stock is returned (${dataStats.data?.unassignedStock})`);
    assert(dataStats.data?.pendingRetirement !== undefined, `Pending retirement count is returned (${dataStats.data?.pendingRetirement})`);
    assert(dataStats.data?.overdueTickets !== undefined, `Overdue tickets count is returned (${dataStats.data?.overdueTickets})`);
    assert(Array.isArray(dataStats.data?.assetsByDepartment) && dataStats.data.assetsByDepartment.length > 0, `Assets by department is populated array (${dataStats.data?.assetsByDepartment?.length} depts)`);

    // 2. Test GET /api/dashboard/pending-approvals
    console.log('\n--- 2. Testing GET /api/dashboard/pending-approvals ---');
    const resApprovals = await fetch(`${serverUrl}/api/dashboard/pending-approvals`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataApprovals = await resApprovals.json();
    assert(resApprovals.status === 200, 'GET /api/dashboard/pending-approvals returns 200 OK');
    assert(Array.isArray(dataApprovals.data), 'Pending approvals returns array');

    // 3. Test GET /api/dashboard/exception-counts
    console.log('\n--- 3. Testing GET /api/dashboard/exception-counts ---');
    const resCounts = await fetch(`${serverUrl}/api/dashboard/exception-counts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataCounts = await resCounts.json();
    assert(resCounts.status === 200, 'GET /api/dashboard/exception-counts returns 200 OK');
    assert(dataCounts.data?.totalPendingApprovals !== undefined, 'Exception counts payload contains totalPendingApprovals');

    console.log('\n======================================================');
    console.log(`📊 ORG ADMIN DASHBOARD TESTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await stopTestServer();
    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
  }
}

testOrgAdminDashboard();
