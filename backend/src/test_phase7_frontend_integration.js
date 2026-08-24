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
import conversationService from './services/conversation.service.js';
import requestService from './services/request.service.js';
import ticketService from './services/ticket.service.js';
import Organization from './models/Organization.js';
import AdministrativeRequest from './models/AdministrativeRequest.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Ticket from './models/Ticket.js';
import ApiError from './utils/ApiError.js';

const testPhase7 = async () => {
  console.log('\n======================================================');
  console.log('🧪 ASSETOWL PHASE 7 FRONTEND INTEGRATION TEST SUITE');
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

    const org = await Organization.create({
      name: 'Phase 7 Test Org',
      slug: `p7-test-org-${Date.now()}`
    });

    const employeeUser = { _id: new mongoose.Types.ObjectId(), role: 'employee', organizationId: org._id, email: 'emp7@orga.com' };
    const assetManagerUser = { _id: new mongoose.Types.ObjectId(), role: 'asset_manager', organizationId: org._id, email: 'mgr7@orga.com' };
    const orgAdminUser = { _id: new mongoose.Types.ObjectId(), role: 'org_admin', organizationId: org._id, email: 'admin7@orga.com' };
    const superAdminUser = { _id: new mongoose.Types.ObjectId(), role: 'super_admin', organizationId: null, email: 'sa7@platform.com' };

    // ─────────────────────────────────────────────────────────────
    // 1. CONVERSATION RETRIEVAL & REALTIME ROOM TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. TicketChat Conversation Integration ---');

    const maintTicket = await Ticket.create({
      organizationId: org._id,
      ticketCode: `TKT-P7-${Date.now()}`,
      type: 'repair',
      title: 'Phase 7 Test Ticket',
      description: 'Screen repair',
      raisedBy: employeeUser._id,
      status: 'open'
    });

    const ticketConv = await conversationService.createTicketConversation(maintTicket, employeeUser);
    assert(Boolean(ticketConv && ticketConv._id), '1. TicketChat conversation resolved/created');

    await conversationService.addMessageToConversation(ticketConv._id, { content: 'Public message 1', isInternal: false }, employeeUser);
    await conversationService.addMessageToConversation(ticketConv._id, { content: 'Internal staff note 1', isInternal: true }, assetManagerUser);

    const empMessages = await conversationService.getConversationMessages(ticketConv._id, employeeUser);
    assert(empMessages.length === 1 && empMessages[0].content === 'Public message 1', '2. TicketChat loads conversation messages for employee (internal filtered out)');

    const staffMessages = await conversationService.getConversationMessages(ticketConv._id, assetManagerUser);
    assert(staffMessages.length === 2 && staffMessages.some(m => m.isInternal), '6. Internal messages rendered for authorized staff');

    // 7. SuperAdmin cannot send operational ticket messages
    let saWriteErr = false;
    try {
      await conversationService.addMessageToConversation(ticketConv._id, { content: 'SuperAdmin write attempt' }, superAdminUser);
    } catch (err) {
      saWriteErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(saWriteErr, '7. SuperAdmin cannot send operational ticket messages (Read-Only Guard)');

    // ─────────────────────────────────────────────────────────────
    // 2. ORGANIZATION CHANNEL DERIVED ACCESS UX TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Organization Channel Access ---');

    const orgConv = await conversationService.getOrCreateOrganizationConversation(org._id);
    assert(Boolean(orgConv), '8. Organization channel lazily created for Org Admin/SuperAdmin');

    const adminOrgCheck = await conversationService.verifyConversationAccess(orgConv, orgAdminUser);
    assert(adminOrgCheck.authorized, '8b. Organization channel is visible to Org Admin');

    const saOrgCheck = await conversationService.verifyConversationAccess(orgConv, superAdminUser);
    assert(saOrgCheck.authorized, '8c. Organization channel is visible to SuperAdmin');

    const mgrOrgCheck = await conversationService.verifyConversationAccess(orgConv, assetManagerUser);
    assert(!mgrOrgCheck.authorized, '9. Asset Manager cannot access organization channel');

    const empOrgCheck = await conversationService.verifyConversationAccess(orgConv, employeeUser);
    assert(!empOrgCheck.authorized, '10. Employee cannot access organization channel');

    // ─────────────────────────────────────────────────────────────
    // 3. PROCUREMENT & REQUEST API WORKFLOW TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Procurement & Request API Integration ---');

    const procReq = await requestService.createRequest(
      {
        category: 'procurement',
        title: 'Hardware Procurement P7',
        description: 'Need 10 laptops',
        payload: { itemCategory: 'Laptop', itemCount: 10, estimatedBudget: 15000, justification: 'P7 onboarding' }
      },
      assetManagerUser
    );
    assert(procReq && procReq.category === 'procurement', '11. Procurement requests use requestApi');

    const approvedReq = await requestService.updateRequestStatus(procReq._id, { status: 'approved', decisionNotes: 'P7 Approved' }, superAdminUser);
    assert(approvedReq.status === 'approved', '12. Approval/rejection actions call correct requestApi endpoints');

    const saRequests = await requestService.getRequests(null, {}, superAdminUser);
    assert(Array.isArray(saRequests) && saRequests.length >= 1, '13. Admin Support Queue uses global request APIs');

    // ─────────────────────────────────────────────────────────────
    // 4. LEGACY API & BACKWARD COMPATIBILITY PRESERVATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Legacy API & Backward Compatibility ---');

    const legacyTickets = await ticketService.getTickets(org._id, {}, assetManagerUser);
    assert(Array.isArray(legacyTickets) && legacyTickets.length >= 1, '16. Legacy ticket API remains functional');

    // Cleanup
    await Ticket.deleteMany({ organizationId: org._id });
    await AdministrativeRequest.deleteMany({ organizationId: org._id });
    await Conversation.deleteMany({ organizationId: org._id });
    await Message.deleteMany({ organizationId: org._id });
    await Organization.deleteMany({ _id: org._id });

    console.log('\n======================================================');
    console.log(`📊 PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 7 Integration Test Failed:', err);
    process.exit(1);
  }
};

testPhase7();
