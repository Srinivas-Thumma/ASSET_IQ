import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import http from 'http';
import { io as ClientIO } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './config/socket.js';
import { JWT_SECRET } from './config/env.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Asset from './models/Asset.js';
import Ticket from './models/Ticket.js';
import Category from './models/Category.js';
import Location from './models/Location.js';
import Employee from './models/Employee.js';
import RefreshToken from './models/RefreshToken.js';
import { generateAccessToken, generateRefreshToken } from './utils/token.utils.js';

let server;
let serverUrl;
let port = 5055;

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

async function runTests() {
  console.log('\n======================================================');
  console.log('🔒 SPRINT 1 — SECURITY HARDENING COMPREHENSIVE TEST SUITE');
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
    // SETUP FIXTURES
    // ----------------------------------------------------------------
    console.log('📦 Loading Test Data Fixtures from DB...');
    
    // Find TechFlow and GreenLeaf organizations
    const orgA = await Organization.findOne({ slug: 'techflow-solutions' });
    const orgB = await Organization.findOne({ slug: 'greenleaf-corp' });

    assert(orgA && orgB, 'Test organizations (TechFlow and GreenLeaf) exist in dev database');

    const adminA = await User.findOne({ email: 'admin@techflow.dev' });
    const managerA = await User.findOne({ email: 'manager@techflow.dev' });
    const employeeA = await User.findOne({ email: 'alice@techflow.dev' });
    const employeeA2 = await User.findOne({ email: 'bob@techflow.dev' });

    const adminB = await User.findOne({ email: 'admin@greenleaf.dev' });
    const managerB = await User.findOne({ email: 'manager@greenleaf.dev' });
    const employeeB = await User.findOne({ email: 'carol@greenleaf.dev' });

    assert(adminA && managerA && employeeA && adminB && managerB && employeeB, 'Seeded accounts loaded for Org A & Org B');

    const assetA = await Asset.findOne({ organizationId: orgA._id });
    const assetB = await Asset.findOne({ organizationId: orgB._id });
    const ticketA = await Ticket.findOne({ organizationId: orgA._id, raisedBy: employeeA._id });
    const ticketB = await Ticket.findOne({ organizationId: orgB._id });
    const categoryB = await Category.findOne({ organizationId: orgB._id });
    const locationB = await Location.findOne({ organizationId: orgB._id });
    const employeeRecordB = await Employee.findOne({ organizationId: orgB._id });

    assert(assetA && assetB && ticketA && ticketB, 'Assets and Tickets loaded for Org A and Org B');

    // ----------------------------------------------------------------
    // 1. AUTHENTICATION & LOGIN SECURITY TESTS
    // ----------------------------------------------------------------
    console.log('\n--- 1. Authentication & Security Tests ---');

    // 1.1 Valid login
    const loginRes = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@techflow.dev', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const cookies = loginRes.headers.get('set-cookie') || '';
    assert(loginRes.status === 200 && loginData.success, 'Valid login returns 200 OK');
    assert(!loginData.data?.user?.passwordHash, 'User passwordHash is NOT returned in login response');
    assert(cookies.includes('accessToken') && cookies.includes('refreshToken'), 'Login sets HttpOnly accessToken and refreshToken cookies');

    // 1.2 Invalid password
    const badLogin = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@techflow.dev', password: 'wrongpassword' })
    });
    assert(badLogin.status === 401, 'Invalid password returns 401 Unauthorized');

    // 1.3 Inactive user login
    const testInactiveUser = await User.create({
      email: 'inactive_test@techflow.dev',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'employee',
      organizationId: orgA._id,
      status: 'inactive'
    });
    const inactiveLogin = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'inactive_test@techflow.dev', password: 'password123' })
    });
    assert(inactiveLogin.status === 403, 'Inactive user login is blocked with 403 Forbidden');
    await User.deleteOne({ _id: testInactiveUser._id });

    // 1.4 Suspended organization login
    const suspendedOrg = await Organization.create({
      name: 'Suspended Corp',
      code: 'SUSP-01',
      slug: 'suspended-corp',
      status: 'suspended'
    });
    const suspendedUser = await User.create({
      email: 'user@suspended.dev',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'employee',
      organizationId: suspendedOrg._id,
      status: 'active'
    });
    const suspendedLogin = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@suspended.dev', password: 'password123' })
    });
    assert(suspendedLogin.status === 403, 'User belonging to suspended organization is blocked with 403 Forbidden');
    await User.deleteOne({ _id: suspendedUser._id });
    await Organization.deleteOne({ _id: suspendedOrg._id });

    // ----------------------------------------------------------------
    // 2. SOCKET.IO SECURITY TESTS
    // ----------------------------------------------------------------
    console.log('\n--- 2. Socket.IO Authentication & Authorization Tests ---');

    // Helper to create token
    const tokenUserA = generateAccessToken(employeeA._id, employeeA.email, employeeA.role, orgA._id);
    const tokenUserB = generateAccessToken(employeeB._id, employeeB.email, employeeB.role, orgB._id);
    const tokenManagerA = generateAccessToken(managerA._id, managerA.email, managerA.role, orgA._id);

    // 2.1 Unauthenticated socket connection MUST fail
    await new Promise((resolve) => {
      const unauthSocket = ClientIO(serverUrl, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: false
      });
      unauthSocket.on('connect', () => {
        assert(false, 'Unauthenticated socket connected (VULNERABILITY!)');
        unauthSocket.disconnect();
        resolve();
      });
      unauthSocket.on('connect_error', (err) => {
        assert(err.message.includes('Authentication error'), 'Unauthenticated socket connection rejected with Authentication error');
        unauthSocket.disconnect();
        resolve();
      });
    });

    // 2.2 Invalid token socket connection MUST fail
    await new Promise((resolve) => {
      const badTokenSocket = ClientIO(serverUrl, {
        transports: ['websocket'],
        auth: { token: 'invalid.jwt.token.string' },
        autoConnect: true,
        reconnection: false
      });
      badTokenSocket.on('connect', () => {
        assert(false, 'Invalid token socket connected (VULNERABILITY!)');
        badTokenSocket.disconnect();
        resolve();
      });
      badTokenSocket.on('connect_error', (err) => {
        assert(err.message.includes('Authentication error'), 'Invalid token socket connection rejected');
        badTokenSocket.disconnect();
        resolve();
      });
    });

    // 2.3 Valid authenticated socket connection succeeds
    let clientSocketA;
    await new Promise((resolve) => {
      clientSocketA = ClientIO(serverUrl, {
        transports: ['websocket'],
        auth: { token: tokenUserA },
        autoConnect: true,
        reconnection: false
      });
      clientSocketA.on('connect', () => {
        assert(true, 'Authenticated socket connected successfully');
        resolve();
      });
      clientSocketA.on('connect_error', (err) => {
        assert(false, 'Authenticated socket failed to connect', err.message);
        resolve();
      });
    });

    // 2.4 Authorized Ticket Room Join (Employee A joins Ticket A raised by Employee A)
    await new Promise((resolve) => {
      const onJoined = (data) => {
        clientSocketA.off('error', onError);
        assert(String(data.ticketId) === String(ticketA._id), 'Authorized user successfully joins their ticket room');
        resolve();
      };
      const onError = (err) => {
        clientSocketA.off('ticket-joined', onJoined);
        assert(false, 'Authorized ticket room join failed', err.message);
        resolve();
      };

      clientSocketA.once('ticket-joined', onJoined);
      clientSocketA.once('error', onError);
      clientSocketA.emit('join-ticket', String(ticketA._id));
    });

    // 2.5 Cross-Tenant Ticket Room Join Blocked (User A tries joining Org B Ticket)
    await new Promise((resolve) => {
      const onError = (err) => {
        assert(
          err.message.includes('organization') || err.message.includes('Unauthorized'),
          'Cross-tenant socket ticket room join BLOCKED with security error'
        );
        resolve();
      };
      clientSocketA.once('error', onError);
      clientSocketA.emit('join-ticket', String(ticketB._id));

      // Safety timeout in case no error emitted
      setTimeout(() => {
        clientSocketA.off('error', onError);
        resolve();
      }, 500);
    });

    if (clientSocketA) clientSocketA.disconnect();

    // ----------------------------------------------------------------
    // 3. REST API CROSS-TENANT IDOR TESTS
    // ----------------------------------------------------------------
    console.log('\n--- 3. REST API Cross-Tenant IDOR Tests ---');

    const authHeaderA = `Bearer ${tokenManagerA}`;
    const authHeaderB = `Bearer ${tokenUserB}`;

    // 3.1 Org A manager accessing Org A asset (Allowed)
    const resA_AssetA = await fetch(`${serverUrl}/api/assets/${assetA._id}`, {
      headers: { Authorization: authHeaderA }
    });
    assert(resA_AssetA.status === 200, 'Org A manager reading Org A asset -> 200 OK');

    // 3.2 Org A manager accessing Org B asset (IDOR BLOCKED -> 404)
    const resA_AssetB = await fetch(`${serverUrl}/api/assets/${assetB._id}`, {
      headers: { Authorization: authHeaderA }
    });
    assert(resA_AssetB.status === 404, 'Org A manager reading Org B asset -> 404 Not Found (Cross-tenant IDOR blocked)');

    // 3.3 Org A manager updating Org B asset (IDOR BLOCKED -> 404)
    const resA_UpdateAssetB = await fetch(`${serverUrl}/api/assets/${assetB._id}`, {
      method: 'PUT',
      headers: { Authorization: authHeaderA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Asset Name' })
    });
    assert(resA_UpdateAssetB.status === 404, 'Org A manager updating Org B asset -> 404 Not Found (Cross-tenant update blocked)');

    // 3.4 Org A manager accessing Org B ticket (IDOR BLOCKED -> 404)
    const resA_TicketB = await fetch(`${serverUrl}/api/tickets/${ticketB._id}`, {
      headers: { Authorization: authHeaderA }
    });
    assert(resA_TicketB.status === 404, 'Org A manager reading Org B ticket -> 404 Not Found (Cross-tenant ticket blocked)');

    // 3.5 Org A manager posting message to Org B ticket (IDOR BLOCKED -> 404)
    const resA_MsgTicketB = await fetch(`${serverUrl}/api/tickets/${ticketB._id}/messages`, {
      method: 'POST',
      headers: { Authorization: authHeaderA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Cross-tenant message injection attempt' })
    });
    assert(resA_MsgTicketB.status === 404, 'Org A posting message to Org B ticket -> 404 Not Found (Cross-tenant message injection blocked)');

    // 3.6 Org A manager updating Org B category (IDOR BLOCKED -> 404)
    if (categoryB) {
      const resA_UpdateCatB = await fetch(`${serverUrl}/api/categories/${categoryB._id}`, {
        method: 'PUT',
        headers: { Authorization: authHeaderA, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hacked Category' })
      });
      assert(resA_UpdateCatB.status === 404, 'Org A updating Org B category -> 404 Not Found (Cross-tenant category update blocked)');
    }

    // 3.7 Org A manager deleting Org B employee (IDOR BLOCKED -> 404)
    if (employeeRecordB) {
      const resA_DeleteEmpB = await fetch(`${serverUrl}/api/employees/${employeeRecordB._id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeaderA }
      });
      assert(resA_DeleteEmpB.status === 404, 'Org A deleting Org B employee -> 404 Not Found (Cross-tenant employee deletion blocked)');
    }

    // ----------------------------------------------------------------
    // 4. REGISTRATION SECURITY TESTS
    // ----------------------------------------------------------------
    console.log('\n--- 4. Registration Security Tests ---');

    // 4.1 Register with valid organization code as employee
    const codeReg = await fetch(`${serverUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `new_employee_${Date.now()}@techflow.dev`,
        password: 'Password123!',
        firstName: 'New',
        lastName: 'Hire',
        organizationCode: orgA.code
      })
    });
    const codeRegData = await codeReg.json();
    assert(codeReg.status === 201 && codeRegData.data?.user?.role === 'employee', 'Registration with Organization Code creates employee under that org');

    // 4.2 Register with invalid organization code
    const badCodeReg = await fetch(`${serverUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `bad_code_${Date.now()}@invalid.dev`,
        password: 'Password123!',
        organizationCode: 'NON_EXISTENT_CODE_999'
      })
    });
    assert(badCodeReg.status === 404, 'Registration with invalid organization code rejected with 404');

    // ----------------------------------------------------------------
    // 5. RBAC & ENDPOINT PROTECTION TESTS
    // ----------------------------------------------------------------
    console.log('\n--- 5. RBAC & Endpoint Protection Tests ---');

    // 5.1 Employee cannot trigger warranty check
    const empWarrantyCheck = await fetch(`${serverUrl}/api/notifications/run-warranty-check`, {
      method: 'POST',
      headers: { Authorization: authHeaderB }
    });
    assert(empWarrantyCheck.status === 403, 'Employee role blocked from running warranty check (403 Access denied)');

    // 5.2 Manager CAN trigger warranty check
    const mgrWarrantyCheck = await fetch(`${serverUrl}/api/notifications/run-warranty-check`, {
      method: 'POST',
      headers: { Authorization: authHeaderA }
    });
    assert(mgrWarrantyCheck.status === 200, 'Manager role allowed to run warranty check (200 OK)');

    // ----------------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await stopTestServer();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Test suite fatal error:', err);
    await stopTestServer();
    process.exit(1);
  }
}

runTests();
