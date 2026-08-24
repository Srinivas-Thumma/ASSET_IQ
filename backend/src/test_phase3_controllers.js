import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env.development')
});

import { MONGODB_URI } from './config/env.js';
import requestService from './services/request.service.js';
import conversationService from './services/conversation.service.js';
import ticketService from './services/ticket.service.js';
import Organization from './models/Organization.js';
import AdministrativeRequest from './models/AdministrativeRequest.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Ticket from './models/Ticket.js';
import ApiError from './utils/ApiError.js';

const testPhase3 = async () => {
  console.log('\n======================================================');
  console.log('🧪 ASSETOWL PHASE 3 CONTROLLER & API TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  };

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`🔌 Connected to MongoDB: ${mongoose.connection.db.databaseName}\n`);

    // Create Test Organizations
    const testOrgA = await Organization.create({
      name: 'Test Org Alpha',
      slug: `test-org-alpha-${Date.now()}`
    });
    const testOrgB = await Organization.create({
      name: 'Test Org Beta',
      slug: `test-org-beta-${Date.now()}`
    });

    const orgIdA = testOrgA._id;
    const orgIdB = testOrgB._id;

    const employeeUser = { _id: new mongoose.Types.ObjectId(), role: 'employee', organizationId: orgIdA, email: 'emp@orga.com' };
    const assetManagerUser = { _id: new mongoose.Types.ObjectId(), role: 'asset_manager', organizationId: orgIdA, email: 'mgr@orga.com' };
    const orgAdminUser = { _id: new mongoose.Types.ObjectId(), role: 'org_admin', organizationId: orgIdA, email: 'admin@orga.com' };
    const orgAdminUserB = { _id: new mongoose.Types.ObjectId(), role: 'org_admin', organizationId: orgIdB, email: 'admin@orgb.com' };
    const superAdminUser = { _id: new mongoose.Types.ObjectId(), role: 'super_admin', organizationId: null, email: 'sa@platform.com' };

    // ─────────────────────────────────────────────────────────────
    // 1. REQUEST CREATION RESTRICTIONS
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. Request Creation Restrictions ---');

    // 1. Employee cannot create AdministrativeRequest
    let empCreateErr = false;
    try {
      await requestService.createRequest({ category: 'procurement', title: 'T', description: 'D' }, employeeUser);
    } catch (err) {
      empCreateErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(empCreateErr, '1. Employee cannot create AdministrativeRequest (403)');

    // 2. Asset Manager can create procurement request
    const procReq = await requestService.createRequest(
      {
        category: 'procurement',
        title: 'Laptops Procurement',
        description: 'Need 5 laptops',
        payload: { itemCategory: 'Laptop', itemCount: 5, estimatedBudget: 7500, justification: 'New hires' }
      },
      assetManagerUser
    );
    assert(procReq && procReq.category === 'procurement', '2. Asset Manager can create procurement request');

    // 3. Asset Manager cannot create plan_upgrade request
    let mgrPlanErr = false;
    try {
      await requestService.createRequest(
        { category: 'plan_upgrade', title: 'Upgrade', description: 'D', payload: { targetPlanId: 'pro', billingCycle: 'monthly' } },
        assetManagerUser
      );
    } catch (err) {
      mgrPlanErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(mgrPlanErr, '3. Asset Manager cannot create plan_upgrade request (403)');

    // 4. Org Admin can create platform_support request
    const platReq = await requestService.createRequest(
      { category: 'platform_support', title: 'Platform Bug', description: 'UI error', payload: { affectedModule: 'dashboard' } },
      orgAdminUser
    );
    assert(platReq && platReq.category === 'platform_support', '4. Org Admin can create platform_support request');

    // ─────────────────────────────────────────────────────────────
    // 2. REQUEST READ RESTRICTIONS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Request Read Restrictions ---');

    // 5. Employee cannot read AdministrativeRequest
    let empReadErr = false;
    try {
      await requestService.getRequestById(procReq._id, employeeUser);
    } catch (err) {
      empReadErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(empReadErr, '5. Employee cannot read AdministrativeRequest (403)');

    // 6. Org Admin can read own organization's request
    const adminReadReq = await requestService.getRequestById(procReq._id, orgAdminUser);
    assert(adminReadReq && String(adminReadReq._id) === String(procReq._id), '6. Org Admin can read own organization request');

    // 7. Org Admin cannot read another organization's request
    let crossReadErr = false;
    try {
      await requestService.getRequestById(procReq._id, orgAdminUserB);
    } catch (err) {
      crossReadErr = err instanceof ApiError && err.statusCode === 404;
    }
    assert(crossReadErr, '7. Org Admin cannot read another organization request (404/403)');

    // 8. SuperAdmin can access global requests
    const saGlobalRequests = await requestService.getRequests(null, {}, superAdminUser);
    assert(Array.isArray(saGlobalRequests) && saGlobalRequests.length >= 2, '8. SuperAdmin can access global requests queue');

    // ─────────────────────────────────────────────────────────────
    // 3. APPROVAL / REJECTION AUTHORIZATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Approval & Rejection Authorization ---');

    // 9. Unauthorized user (Asset Manager) cannot approve request
    let mgrApproveErr = false;
    try {
      await requestService.updateRequestStatus(procReq._id, { status: 'approved' }, assetManagerUser);
    } catch (err) {
      mgrApproveErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(mgrApproveErr, '9. Unauthorized user (Asset Manager) cannot approve request (403)');

    // 10. Authorized SuperAdmin can approve request
    const approvedReq = await requestService.updateRequestStatus(procReq._id, { status: 'approved', decisionNotes: 'Authorized' }, superAdminUser);
    assert(approvedReq.status === 'approved', '10. Authorized SuperAdmin can approve request');

    // ─────────────────────────────────────────────────────────────
    // 4. CONVERSATION & CHANNEL AUTHORIZATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Conversation & Channel Authorization ---');

    const orgConvA = await conversationService.getOrCreateOrganizationConversation(orgIdA);

    // 11. Employee cannot access organization conversation
    let empOrgChannelErr = false;
    try {
      await conversationService.getConversationById(orgConvA._id, employeeUser);
    } catch (err) {
      empOrgChannelErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(empOrgChannelErr, '11. Employee cannot access organization conversation (403)');

    // 12. Org Admin can access own organization conversation
    const adminOrgConv = await conversationService.getConversationById(orgConvA._id, orgAdminUser);
    assert(adminOrgConv && String(adminOrgConv._id) === String(orgConvA._id), '12. Org Admin can access own organization conversation');

    // 13. Cross-tenant organization conversation is denied
    let crossOrgConvErr = false;
    try {
      await conversationService.getConversationById(orgConvA._id, orgAdminUserB);
    } catch (err) {
      crossOrgConvErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(crossOrgConvErr, '13. Cross-tenant organization conversation correctly DENIED (403)');

    // ─────────────────────────────────────────────────────────────
    // 5. MESSAGE & INTERNAL NOTE SECURITY
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Message & Internal Note Security ---');

    // Create a ticket conversation for employee
    const tempTicket = await Ticket.create({
      organizationId: orgIdA,
      ticketCode: `TKT-${Date.now()}`,
      type: 'repair',
      title: 'Broken Screen',
      description: 'Screen is dead',
      raisedBy: employeeUser._id,
      status: 'open'
    });
    const ticketConv = await conversationService.createTicketConversation(tempTicket, employeeUser);

    // Staff adds public message and internal note
    await conversationService.addMessageToConversation(ticketConv._id, { content: 'We will inspect this', isInternal: false }, assetManagerUser);
    await conversationService.addMessageToConversation(ticketConv._id, { content: 'Internal staff note: replacement stock available', isInternal: true }, assetManagerUser);

    // 14. Employee cannot receive internal messages
    const empMsgs = await conversationService.getConversationMessages(ticketConv._id, employeeUser);
    assert(empMsgs.length === 1 && !empMsgs.some(m => m.isInternal), '14. Employee receives public messages only (internal notes filtered)');

    // 15. Employee cannot create internal notes
    let empInternalErr = false;
    try {
      await conversationService.addMessageToConversation(ticketConv._id, { content: 'Employee trying to post internal note', isInternal: true }, employeeUser);
    } catch (err) {
      empInternalErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(empInternalErr, '15. Employee cannot create internal notes (403)');

    // 16. Authorized staff can create internal notes
    const staffNote = await conversationService.addMessageToConversation(ticketConv._id, { content: 'Staff internal note test', isInternal: true }, assetManagerUser);
    assert(staffNote.isInternal === true, '16. Authorized staff can create internal notes');

    // 17. Conversation messages require conversation authorization
    let unauthMsgErr = false;
    try {
      await conversationService.getConversationMessages(ticketConv._id, orgAdminUserB);
    } catch (err) {
      unauthMsgErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(unauthMsgErr, '17. Conversation messages require valid conversation authorization (403)');

    // ─────────────────────────────────────────────────────────────
    // 6. EXISTING TICKET ENDPOINTS PRESERVATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Existing Ticket System Preservation ---');

    const legacyTickets = await ticketService.getTickets(orgIdA, {}, assetManagerUser);
    assert(Array.isArray(legacyTickets) && legacyTickets.length >= 1, '18. Existing ticket service & endpoints still function seamlessly');

    // Clean up test documents
    await AdministrativeRequest.deleteMany({ organizationId: { $in: [orgIdA, orgIdB] } });
    await Ticket.deleteMany({ organizationId: { $in: [orgIdA, orgIdB] } });
    await Conversation.deleteMany({ organizationId: { $in: [orgIdA, orgIdB] } });
    await Message.deleteMany({ organizationId: { $in: [orgIdA, orgIdB] } });
    await Organization.deleteMany({ _id: { $in: [orgIdA, orgIdB] } });

    console.log('\n======================================================');
    console.log(`📊 PHASE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 3 Test Suite Failed:', err);
    process.exit(1);
  }
};

testPhase3();
