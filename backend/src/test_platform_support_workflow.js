import mongoose from 'mongoose';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './config/socket.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Ticket from './models/Ticket.js';
import TicketMessage from './models/TicketMessage.js';
import Notification from './models/Notification.js';
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

async function testPlatformSupportWorkflow() {
  console.log('\n======================================================');
  console.log('🚀 REFACTORED PLATFORM SUPPORT WORKFLOW (OPEN -> IN_PROGRESS -> RESOLVED)');
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
    // 1. Setup accounts
    const orgA = await Organization.findOne({ slug: 'techflow-solutions' });
    const orgB = await Organization.findOne({ slug: 'greenleaf-corp' });
    assert(orgA && orgB, 'Test organizations Org A and Org B found in database');

    const superAdmin = await User.findOne({ role: 'super_admin' });
    const adminA = await User.findOne({ email: 'admin@techflow.dev' });
    const adminB = await User.findOne({ email: 'admin@greenleaf.dev' });
    const employeeA = await User.findOne({ email: 'alice@techflow.dev' });

    assert(superAdmin && adminA && adminB && employeeA, 'All test user roles successfully retrieved');

    const superAdminToken = generateAccessToken(superAdmin);
    const adminAToken = generateAccessToken(adminA);
    const adminBToken = generateAccessToken(adminB);
    const employeeAToken = generateAccessToken(employeeA);

    // --- PHASE 1: ORG ADMIN CREATES PLATFORM SUPPORT REQUEST ---
    console.log('\n--- 1. Org Admin Creates Platform Support Request ---');
    const resCreate = await fetch(`${serverUrl}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAToken}`
      },
      body: JSON.stringify({
        type: 'admin_support',
        issueType: 'billing',
        title: 'Need to add 15 additional employee seats for Q3 expansion',
        description: 'We are expanding our engineering department and need our subscription quota increased.'
      })
    });
    const dataCreate = await resCreate.json();
    assert(resCreate.status === 201, 'POST /api/tickets returns 201 Created for admin_support');
    const supportTicketId = dataCreate.data?._id;
    assert(supportTicketId !== undefined, `Platform support ticket created with ID: ${supportTicketId}`);
    assert(dataCreate.data?.status === 'open', 'New platform support request starts in OPEN status');
    assert(dataCreate.data?.priority === 'p3', 'New platform support request defaults to priority P3');

    // Check SuperAdmin received notification
    const saNotif = await Notification.findOne({
      userId: superAdmin._id,
      type: 'admin_support_created',
      relatedId: supportTicketId
    });
    assert(saNotif !== null, 'SuperAdmin received "admin_support_created" in-app notification');

    // --- PHASE 2: SUPERADMIN CROSS-TENANT READ & MARK IN_PROGRESS ---
    console.log('\n--- 2. SuperAdmin Views and Marks Case In Progress ---');
    const resGetSA = await fetch(`${serverUrl}/api/tickets/${supportTicketId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const dataGetSA = await resGetSA.json();
    assert(resGetSA.status === 200, 'SuperAdmin can read platform support ticket cross-tenant');
    assert(dataGetSA.data?.type === 'admin_support', 'Ticket type is admin_support');

    // SuperAdmin transitions case from OPEN to IN_PROGRESS directly (no claim operation)
    const resInProgress = await fetch(`${serverUrl}/api/tickets/${supportTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ status: 'in_progress', priority: 'p2' })
    });
    const dataInProgress = await resInProgress.json();
    assert(resInProgress.status === 200, 'SuperAdmin can mark platform support case as IN_PROGRESS');
    assert(dataInProgress.data?.status === 'in_progress', 'Support case status set to in_progress');
    assert(dataInProgress.data?.priority === 'p2', 'Priority updated to p2');

    // Verify handler is auto-populated for auditing
    const updatedTkt = await Ticket.findById(supportTicketId);
    assert(updatedTkt.handler && String(updatedTkt.handler) === String(superAdmin._id), 'SuperAdmin handler auto-assigned in background without claim step');

    // --- PHASE 3: BIDIRECTIONAL FORMAL CONVERSATION ---
    console.log('\n--- 3. Bidirectional Support Discussion ---');

    // SuperAdmin responds to Org Admin
    const resSAMsg = await fetch(`${serverUrl}/api/tickets/${supportTicketId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        message: 'Hello Priya, I have reviewed your request. We can upgrade your plan to accommodate 15 extra seats immediately.'
      })
    });
    const dataSAMsg = await resSAMsg.json();
    assert(resSAMsg.status === 201, 'SuperAdmin can post formal responses on admin_support tickets');
    assert(dataSAMsg.data?.senderRole === 'super_admin', 'Message senderRole is super_admin');

    // Verify Org Admin received notification of SuperAdmin reply
    const adminANotif = await Notification.findOne({
      userId: adminA._id,
      type: 'admin_support_reply',
      relatedId: supportTicketId
    });
    assert(adminANotif !== null, 'Org Admin received "admin_support_reply" notification for SuperAdmin message');

    // Org Admin replies
    const resAdminMsg = await fetch(`${serverUrl}/api/tickets/${supportTicketId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAToken}`
      },
      body: JSON.stringify({
        message: 'Thank you! Please proceed with the upgrade.'
      })
    });
    assert(resAdminMsg.status === 201, 'Org Admin can reply in platform support discussion');

    // Verify messages retrieved in order
    const resGetMsgs = await fetch(`${serverUrl}/api/tickets/${supportTicketId}/messages`, {
      headers: { Authorization: `Bearer ${adminAToken}` }
    });
    const dataGetMsgs = await resGetMsgs.json();
    assert(resGetMsgs.status === 200, 'GET /api/tickets/:id/messages returns 200 OK');
    assert(Array.isArray(dataGetMsgs.data) && dataGetMsgs.data.length >= 3, `Discussion history contains ${dataGetMsgs.data?.length} messages`);

    // --- PHASE 4: SUPERADMIN RESOLVES CASE ---
    console.log('\n--- 4. SuperAdmin Resolves Support Case ---');
    const resResolve = await fetch(`${serverUrl}/api/tickets/${supportTicketId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        resolutionNotes: 'Plan quota updated to 50 employee seats. Effective immediately.'
      })
    });
    const dataResolve = await resResolve.json();
    assert(resResolve.status === 200, 'SuperAdmin can resolve platform support case');
    assert(dataResolve.data?.status === 'resolved', 'Ticket status changed to resolved');
    assert(dataResolve.data?.resolutionNotes.includes('Plan quota updated'), 'Resolution notes properly recorded');

    // Verify Org Admin received resolution notification
    const resolveNotif = await Notification.findOne({
      userId: adminA._id,
      type: 'admin_support_status',
      relatedId: supportTicketId
    });
    assert(resolveNotif !== null, 'Org Admin received "admin_support_status" resolution notification');

    // --- PHASE 5: SECURITY & RBAC ISOLATION GUARDS ---
    console.log('\n--- 5. Security & RBAC Isolation Verification ---');

    // 1. Create a normal operational ticket (type: repair)
    const opTicket = await Ticket.create({
      organizationId: orgA._id,
      raisedBy: employeeA._id,
      type: 'repair',
      issueType: 'hardware',
      title: 'Operational: Cracked laptop screen',
      description: 'Screen is flickering after a drop',
      status: 'open',
      priority: 'p2'
    });

    // 2. SuperAdmin attempting to post message on operational ticket -> MUST FAIL with 403
    const resSAOpMsg = await fetch(`${serverUrl}/api/tickets/${opTicket._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ message: 'SuperAdmin trying to intervene in operational IT ticket' })
    });
    assert(resSAOpMsg.status === 403, 'SuperAdmin posting to operational ticket is strictly BLOCKED with 403 Forbidden');

    // 3. SuperAdmin attempting to resolve operational ticket -> MUST FAIL with 403
    const resSAOpResolve = await fetch(`${serverUrl}/api/tickets/${opTicket._id}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ resolutionNotes: 'SuperAdmin resolving employee laptop' })
    });
    assert(resSAOpResolve.status === 403, 'SuperAdmin resolving operational ticket is strictly BLOCKED with 403 Forbidden');

    // 4. SuperAdmin attempting to claim operational ticket -> MUST FAIL with 403
    const resSAOpClaim = await fetch(`${serverUrl}/api/tickets/${opTicket._id}/claim`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ priority: 'p1' })
    });
    assert(resSAOpClaim.status === 403, 'SuperAdmin claiming operational ticket is strictly BLOCKED with 403 Forbidden');

    // 5. Cross-tenant IDOR: Org Admin B trying to access Org A's platform support ticket -> MUST FAIL with 404
    const resOrgBIDOR = await fetch(`${serverUrl}/api/tickets/${supportTicketId}`, {
      headers: { Authorization: `Bearer ${adminBToken}` }
    });
    assert(resOrgBIDOR.status === 404, 'Cross-tenant access to platform support ticket is strictly BLOCKED with 404 Not Found');

    // 6. Employee trying to access platform support ticket -> MUST FAIL with 403
    const resEmpAccess = await fetch(`${serverUrl}/api/tickets/${supportTicketId}`, {
      headers: { Authorization: `Bearer ${employeeAToken}` }
    });
    assert(resEmpAccess.status === 403, 'Employee access to platform support ticket is strictly BLOCKED with 403 Forbidden');

    // Cleanup test records
    await Ticket.findByIdAndDelete(supportTicketId);
    await Ticket.findByIdAndDelete(opTicket._id);
    await TicketMessage.deleteMany({ ticketId: supportTicketId });

    console.log('\n======================================================');
    console.log(`📊 PLATFORM SUPPORT WORKFLOW TESTS: ${passed} PASSED, ${failed} FAILED`);
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

testPlatformSupportWorkflow();
