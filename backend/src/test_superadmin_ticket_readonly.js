import mongoose from 'mongoose';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './config/socket.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Ticket from './models/Ticket.js';
import TicketMessage from './models/TicketMessage.js';
import { generateAccessToken } from './utils/token.utils.js';

let server;
let serverUrl;
let port = 5059;

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

async function runSuperAdminTicketTests() {
  console.log('\n======================================================');
  console.log('🛡️ SUPERADMIN TICKET READ-ONLY AUTHORIZATION TEST SUITE');
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
    console.log('📦 Setting up test fixtures...');

    const superAdmin = await User.findOne({ role: 'super_admin' });
    const orgA = await Organization.findOne({ slug: 'techflow-solutions' });
    const orgB = await Organization.findOne({ slug: 'greenleaf-corp' });

    assert(superAdmin, 'SuperAdmin user exists in database');
    assert(orgA && orgB, 'Test organizations exist in database');

    const managerA = await User.findOne({ organizationId: orgA._id, role: 'asset_manager' });
    const employeeA = await User.findOne({ organizationId: orgA._id, role: 'employee' });

    assert(managerA && employeeA, 'Manager and Employee users exist for Org A');

    const superAdminToken = generateAccessToken(superAdmin);
    const managerAToken = generateAccessToken(managerA);
    const employeeAToken = generateAccessToken(employeeA);

    // Find a ticket in Org A
    let ticketA = await Ticket.findOne({ organizationId: orgA._id });
    if (!ticketA) {
      ticketA = await Ticket.create({
        organizationId: orgA._id,
        raisedBy: employeeA._id,
        title: 'Test Laptop Repair',
        description: 'Screen broken',
        type: 'repair',
        status: 'open',
        priority: 'p2'
      });
    }

    console.log('\n--- 1. SuperAdmin Read Operations (ALLOWED) ---');

    // 1.1 SuperAdmin reads ticket list
    const resList = await fetch(`${serverUrl}/api/tickets`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const dataList = await resList.json();
    assert(resList.status === 200 && Array.isArray(dataList.data || dataList), 'SuperAdmin GET /api/tickets returns 200 OK');

    // 1.2 SuperAdmin reads specific ticket by ID
    const resDetail = await fetch(`${serverUrl}/api/tickets/${ticketA._id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const dataDetail = await resDetail.json();
    assert(
      resDetail.status === 200 && dataDetail.data?._id === String(ticketA._id),
      'SuperAdmin GET /api/tickets/:id returns full ticket detail with 200 OK'
    );
    assert(
      dataDetail.data?.organizationId !== undefined,
      'SuperAdmin GET /api/tickets/:id response contains organization context'
    );

    // 1.3 SuperAdmin reads ticket messages
    const resMsgs = await fetch(`${serverUrl}/api/tickets/${ticketA._id}/messages`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert(resMsgs.status === 200, 'SuperAdmin GET /api/tickets/:id/messages returns 200 OK');

    console.log('\n--- 2. SuperAdmin Operational Mutations (BLOCKED -> 403 Forbidden) ---');

    // 2.1 SuperAdmin creating an operational ticket -> BLOCKED 403
    const resCreateTicket = await fetch(`${serverUrl}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        title: 'Unauthorized SuperAdmin Ticket',
        description: 'SuperAdmin should not create operational tickets',
        type: 'repair',
        priority: 'p2'
      })
    });
    assert(
      resCreateTicket.status === 403,
      'SuperAdmin POST /api/tickets (Create Ticket) is BLOCKED with 403 Forbidden',
      `Got status ${resCreateTicket.status}`
    );

    // 2.2 SuperAdmin posting a message -> BLOCKED 403
    const resPostMsg = await fetch(`${serverUrl}/api/tickets/${ticketA._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        message: 'SuperAdmin trying to chat',
        isInternal: false
      })
    });
    assert(
      resPostMsg.status === 403,
      'SuperAdmin POST /api/tickets/:id/messages (Create Message) is BLOCKED with 403 Forbidden',
      `Got status ${resPostMsg.status}`
    );

    // 2.3 SuperAdmin claiming a ticket -> BLOCKED 403
    const resClaim = await fetch(`${serverUrl}/api/tickets/${ticketA._id}/claim`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ priority: 'p1' })
    });
    assert(
      resClaim.status === 403,
      'SuperAdmin PATCH /api/tickets/:id/claim (Claim Ticket) is BLOCKED with 403 Forbidden',
      `Got status ${resClaim.status}`
    );

    // 2.4 SuperAdmin resolving a ticket -> BLOCKED 403
    const resResolve = await fetch(`${serverUrl}/api/tickets/${ticketA._id}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ resolutionNotes: 'SuperAdmin resolve attempt' })
    });
    assert(
      resResolve.status === 403,
      'SuperAdmin PATCH /api/tickets/:id/resolve (Resolve Ticket) is BLOCKED with 403 Forbidden',
      `Got status ${resResolve.status}`
    );

    // 2.5 SuperAdmin updating ticket status -> BLOCKED 403
    const resStatus = await fetch(`${serverUrl}/api/tickets/${ticketA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ status: 'resolved' })
    });
    assert(
      resStatus.status === 403,
      'SuperAdmin PATCH /api/tickets/:id/status (Status Change) is BLOCKED with 403 Forbidden',
      `Got status ${resStatus.status}`
    );

    // 2.6 SuperAdmin escalating a ticket -> BLOCKED 403
    const resEscalate = await fetch(`${serverUrl}/api/tickets/${ticketA._id}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      }
    });
    assert(
      resEscalate.status === 403,
      'SuperAdmin POST /api/tickets/:id/escalate (Escalate Ticket) is BLOCKED with 403 Forbidden',
      `Got status ${resEscalate.status}`
    );

    console.log('\n--- 3. Normal Operational Workflows for Tenant Roles (ALLOWED) ---');

    // 3.1 Manager can message ticket
    const resMgrMsg = await fetch(`${serverUrl}/api/tickets/${ticketA._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerAToken}`
      },
      body: JSON.stringify({ message: 'Manager diagnostic reply', isInternal: false })
    });
    assert(resMgrMsg.status === 201, 'Asset Manager POST /api/tickets/:id/messages succeeds with 201 Created');

    // 3.2 Manager can claim ticket
    const resMgrClaim = await fetch(`${serverUrl}/api/tickets/${ticketA._id}/claim`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerAToken}`
      },
      body: JSON.stringify({ priority: 'p2' })
    });
    assert(resMgrClaim.status === 200, 'Asset Manager PATCH /api/tickets/:id/claim succeeds with 200 OK');

    // 3.3 Manager can update ticket status
    const resMgrStatus = await fetch(`${serverUrl}/api/tickets/${ticketA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerAToken}`
      },
      body: JSON.stringify({ status: 'in_progress', priority: 'p2' })
    });
    assert(resMgrStatus.status === 200, 'Asset Manager PATCH /api/tickets/:id/status succeeds with 200 OK');

    console.log('\n--- 4. Multi-Tenant Isolation ---');
    // Cross-tenant access: Manager from Org A trying to mutate/read Org B ticket
    const ticketB = await Ticket.findOne({ organizationId: orgB._id });
    if (ticketB) {
      const resCrossTenant = await fetch(`${serverUrl}/api/tickets/${ticketB._id}`, {
        headers: { Authorization: `Bearer ${managerAToken}` }
      });
      assert(resCrossTenant.status === 404, 'Cross-tenant IDOR ticket access is blocked with 404 Not Found');
    }

    console.log('\n======================================================');
    console.log(`📊 SUPERADMIN TICKET TESTS: ${passed} PASSED, ${failed} FAILED`);
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

runSuperAdminTicketTests();
