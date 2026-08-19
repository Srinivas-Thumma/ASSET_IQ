import mongoose from 'mongoose';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './config/socket.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Ticket from './models/Ticket.js';
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

async function testOrgAdminDashboardAndApprovals() {
  console.log('\n======================================================');
  console.log('📊 ORG ADMIN DASHBOARD & PROCUREMENT APPROVALS TEST');
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
    const employee = await User.findOne({ organizationId: org._id, role: 'employee' });
    assert(admin && employee, 'Org Admin and Employee users found in DB');

    const adminToken = generateAccessToken(admin);

    // 1. Test GET /api/dashboard/stats
    console.log('\n--- 1. Testing GET /api/dashboard/stats ---');
    const resStats = await fetch(`${serverUrl}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataStats = await resStats.json();

    assert(resStats.status === 200, 'GET /api/dashboard/stats returns 200 OK');
    assert(dataStats.data !== undefined, 'Stats data payload exists');
    assert(typeof dataStats.data?.totalAssets === 'number' && dataStats.data.totalAssets > 0, `Total assets is non-zero (${dataStats.data?.totalAssets})`);
    assert(dataStats.data?.assetsByStatus?.stock !== undefined, `Stock count is returned (${dataStats.data?.assetsByStatus?.stock})`);
    assert(dataStats.data?.assetsByStatus?.assigned !== undefined, `Assigned count is returned (${dataStats.data?.assetsByStatus?.assigned})`);
    assert(dataStats.data?.unassignedStock !== undefined, `Unassigned stock is returned (${dataStats.data?.unassignedStock})`);
    assert(dataStats.data?.pendingRetirement !== undefined, `Pending retirement count is returned (${dataStats.data?.pendingRetirement})`);
    assert(dataStats.data?.overdueTickets !== undefined, `Overdue tickets count is returned (${dataStats.data?.overdueTickets})`);
    assert(Array.isArray(dataStats.data?.assetsByDepartment) && dataStats.data.assetsByDepartment.length > 0, `Assets by department is populated array (${dataStats.data?.assetsByDepartment?.length} depts)`);

    // 2. Test Procurement Approval Flow
    console.log('\n--- 2. Testing Procurement Request Approval Lifecycle ---');
    
    // Create test procurement request
    const testProcTicket = await Ticket.create({
      organizationId: org._id,
      raisedBy: employee._id,
      type: 'request',
      issueType: 'hardware',
      title: 'Procurement: Ergonomic Mechanical Keyboard',
      description: 'Dev requirement for dual workstation',
      status: 'open',
      priority: 'p3'
    });

    // Check that it shows in pending approvals
    const resPendingBefore = await fetch(`${serverUrl}/api/dashboard/pending-approvals`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataPendingBefore = await resPendingBefore.json();
    const foundBefore = dataPendingBefore.data?.find((i) => i._id === String(testProcTicket._id));
    assert(foundBefore !== undefined, 'Open procurement ticket appears in pending approvals queue');

    // Admin Approves Procurement Request (Status -> in_progress)
    const resApprove = await fetch(`${serverUrl}/api/tickets/${testProcTicket._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'in_progress',
        resolutionNotes: 'Procurement approved by Organization Administrator.'
      })
    });
    const dataApprove = await resApprove.json();
    assert(resApprove.status === 200 && dataApprove.data?.status === 'in_progress', 'Org Admin approves procurement request (status -> in_progress)');

    // Verify it is REMOVED from pending approvals queue
    const resPendingAfter = await fetch(`${serverUrl}/api/dashboard/pending-approvals`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataPendingAfter = await resPendingAfter.json();
    const foundAfter = dataPendingAfter.data?.find((i) => i._id === String(testProcTicket._id));
    assert(foundAfter === undefined, 'Approved procurement ticket is removed from pending approvals queue');

    // Clean up test ticket
    await Ticket.findByIdAndDelete(testProcTicket._id);

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

testOrgAdminDashboardAndApprovals();
