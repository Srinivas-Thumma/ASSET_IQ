import mongoose from 'mongoose';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import { generateAccessToken } from './utils/token.utils.js';

let server;
let serverUrl;

const startTestServer = () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
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

async function testSuperAdminAnalytics() {
  console.log('\n======================================================');
  console.log('📊 SUPERADMIN PLATFORM INTELLIGENCE ANALYTICS TEST SUITE');
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
    const superAdmin = await User.findOne({ role: 'super_admin' });
    const orgAdmin = await User.findOne({ role: 'org_admin' });
    const employee = await User.findOne({ role: 'employee' });

    assert(superAdmin && orgAdmin && employee, 'Test roles retrieved (super_admin, org_admin, employee)');

    const superAdminToken = generateAccessToken(superAdmin);
    const orgAdminToken = generateAccessToken(orgAdmin);
    const employeeToken = generateAccessToken(employee);

    // --- 1. SUPERADMIN FETCHES PLATFORM ANALYTICS ---
    console.log('\n--- 1. SuperAdmin Global Analytics Request ---');
    const res = await fetch(`${serverUrl}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/admin/analytics returns 200 OK for SuperAdmin');
    assert(data.data !== undefined, 'Analytics payload is populated in data object');

    const analytics = data.data;

    // Verify 0-100 Platform Health Score
    assert(analytics.platformHealth !== undefined, 'platformHealth section is present');
    assert(typeof analytics.platformHealth.score === 'number' && analytics.platformHealth.score >= 0 && analytics.platformHealth.score <= 100, `0-100 Platform Health Score generated: ${analytics.platformHealth.score}/100 (${analytics.platformHealth.statusLabel})`);

    // Verify 6 Core KPIs in Overview
    assert(analytics.overview !== undefined, 'overview section is present');
    assert(typeof analytics.overview.totalMRR === 'number', `totalMRR is valid number: $${analytics.overview.totalMRR}`);
    assert(typeof analytics.overview.totalARR === 'number', `totalARR is valid number: $${analytics.overview.totalARR}`);
    assert(typeof analytics.overview.totalAssets === 'number', `totalAssets is valid number: ${analytics.overview.totalAssets}`);
    assert(typeof analytics.overview.totalUsers === 'number', `totalUsers is valid number: ${analytics.overview.totalUsers}`);
    assert(typeof analytics.overview.avgFleetHealth === 'number', `avgFleetHealth is valid number: ${analytics.overview.avgFleetHealth}`);
    assert(typeof analytics.overview.openOpWorkload === 'number', `openOpWorkload is valid number: ${analytics.overview.openOpWorkload}`);

    // Verify SaaS & Plans
    assert(analytics.saas !== undefined && Array.isArray(analytics.saas.planDistribution), 'saas.planDistribution is an array');
    assert(analytics.saas.planDistribution.length > 0, `Dynamic plans returned: ${analytics.saas.planDistribution.map(p => p.name).join(', ')}`);

    // Verify Asset Fleet & Financial Exposure & Category Cleaning
    assert(analytics.assetFleet !== undefined, 'assetFleet section is present');
    assert(typeof analytics.assetFleet.totalFleetValue === 'number' && analytics.assetFleet.totalFleetValue > 0, `Fleet Capital Valuation computed: $${analytics.assetFleet.totalFleetValue.toLocaleString()}`);
    assert(typeof analytics.assetFleet.replacementExposureValue === 'number', `Replacement Exposure Value: $${analytics.assetFleet.replacementExposureValue.toLocaleString()}`);
    assert(typeof analytics.assetFleet.upcomingReplacementValue === 'number', `Upcoming 90-Day Replacement Value: $${analytics.assetFleet.upcomingReplacementValue.toLocaleString()}`);

    // Verify category cleaning: no category name contains '-test-s4-'
    const testCatNames = analytics.assetFleet.byCategory.filter(c => /test-s4/i.test(c.name));
    assert(testCatNames.length === 0, 'Test category names (-test-s4-) are cleanly normalized and excluded from production analytics');

    // Verify Security & Grouped Activity
    assert(analytics.security !== undefined, 'security section is present');
    assert(typeof analytics.security.totalSecurityEvents === 'number', `Security events logged: ${analytics.security.totalSecurityEvents}`);
    assert(Array.isArray(analytics.recentActivity), 'recentActivity is an array');

    // Verify Level 1 Organizations Requiring Attention
    assert(Array.isArray(analytics.attentionRequired), 'attentionRequired is an array');

    // --- 2. QUERY FILTERS ---
    console.log('\n--- 2. Query Filters Verification ---');
    const resFiltered = await fetch(`${serverUrl}/api/admin/analytics?timeRange=7d&planId=starter`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const dataFiltered = await resFiltered.json();
    assert(resFiltered.status === 200, 'GET /api/admin/analytics with filters returns 200 OK');
    assert(dataFiltered.data?.metadata?.timeRange === '7d', 'Filtered metadata reflects timeRange=7d');
    assert(dataFiltered.data?.metadata?.filtersApplied?.planId === 'starter', 'Filtered metadata reflects planId=starter');

    // --- 3. RBAC ISOLATION GUARDS ---
    console.log('\n--- 3. RBAC Isolation Verification ---');
    const resOrgAdmin = await fetch(`${serverUrl}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${orgAdminToken}` }
    });
    assert(resOrgAdmin.status === 403, 'Org Admin accessing /api/admin/analytics is strictly BLOCKED with 403 Forbidden');

    const resEmployee = await fetch(`${serverUrl}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(resEmployee.status === 403, 'Employee accessing /api/admin/analytics is strictly BLOCKED with 403 Forbidden');

    const resAnon = await fetch(`${serverUrl}/api/admin/analytics`);
    assert(resAnon.status === 401, 'Anonymous request to /api/admin/analytics is strictly BLOCKED with 401 Unauthorized');

    console.log('\n======================================================');
    console.log(`📊 SUPERADMIN ANALYTICS TESTS: ${passed} PASSED, ${failed} FAILED`);
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

testSuperAdminAnalytics();
