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
import Organization from './models/Organization.js';
import AdministrativeRequest from './models/AdministrativeRequest.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Ticket from './models/Ticket.js';
import TicketMessage from './models/TicketMessage.js';
import ApiError from './utils/ApiError.js';

const testPhase9 = async () => {
  console.log('\n======================================================');
  console.log('🧪 ASSETOWL PHASE 9 FINAL CONSISTENCY & RELEASE TEST');
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
    const db = mongoose.connection.db;
    console.log(`🔌 Connected to MongoDB: ${db.databaseName}\n`);

    const orgP9 = await Organization.create({ name: 'Phase 9 Test Org', slug: `p9-org-${Date.now()}` });
    const empP9 = { _id: new mongoose.Types.ObjectId(), role: 'employee', organizationId: orgP9._id, email: 'emp9@orga.com' };
    const mgrP9 = { _id: new mongoose.Types.ObjectId(), role: 'asset_manager', organizationId: orgP9._id, email: 'mgr9@orga.com' };
    const adminP9 = { _id: new mongoose.Types.ObjectId(), role: 'org_admin', organizationId: orgP9._id, email: 'admin9@orga.com' };
    const saP9 = { _id: new mongoose.Types.ObjectId(), role: 'super_admin', organizationId: null, email: 'sa9@platform.com' };

    // ─────────────────────────────────────────────────────────────
    // 1. REQUEST ↔ CONVERSATION CONSISTENCY
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. Request ↔ Conversation Consistency ---');

    const req = await requestService.createRequest({
      category: 'procurement',
      title: 'P9 Verification Laptop',
      description: 'Need Mac Studio',
      payload: { itemCategory: 'Workstation', itemCount: 1, estimatedBudget: 4000, justification: 'Design' }
    }, mgrP9);

    const conv = await Conversation.findById(req.conversationId);
    assert(Boolean(conv), '1. Request conversation exists');
    assert(String(conv.contextId) === String(req._id), '2. Conversation.contextId matches AdministrativeRequest._id');
    assert(String(req.conversationId) === String(conv._id), '3. AdministrativeRequest.conversationId matches Conversation._id');

    // ─────────────────────────────────────────────────────────────
    // 2. TICKET ↔ CONVERSATION CONSISTENCY
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Ticket ↔ Conversation Consistency ---');

    const ticket = await Ticket.create({
      organizationId: orgP9._id,
      ticketCode: `TKT-P9-${Date.now()}`,
      type: 'repair',
      title: 'P9 Maintenance Ticket',
      description: 'Thermal paste replacement',
      raisedBy: empP9._id,
      status: 'open'
    });

    const ticketConv = await conversationService.createTicketConversation(ticket, empP9);
    assert(Boolean(ticketConv), '4. Maintenance ticket conversation created');
    assert(String(ticketConv.contextId) === String(ticket._id), '5. Ticket conversation contextId matches Ticket._id');

    // Report legacy orphaned messages
    const orphanMsgs = await TicketMessage.find({ _id: { $in: ['6a855c57a86d7f76130d5f58', '6a85847be3779f7944bf20e5'] } }).lean();
    assert(orphanMsgs.length === 2, '6. Exactly 2 known orphaned legacy TicketMessages documented and intact');

    // ─────────────────────────────────────────────────────────────
    // 3. MESSAGE ↔ CONVERSATION CONSISTENCY & ISOLATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Message ↔ Conversation Consistency ---');

    const msg = await conversationService.addMessageToConversation(ticketConv._id, { content: 'Public message P9', isInternal: false }, empP9);
    const internalNote = await conversationService.addMessageToConversation(ticketConv._id, { content: 'Internal note P9', isInternal: true }, mgrP9);

    assert(String(msg.conversationId) === String(ticketConv._id), '7. Message points to correct Conversation');
    assert(String(msg.organizationId) === String(orgP9._id), '8. Message organizationId matches tenant organizationId');

    const empFetchedMsgs = await conversationService.getConversationMessages(ticketConv._id, empP9);
    assert(empFetchedMsgs.length === 1 && empFetchedMsgs[0].content === 'Public message P9', '9. Internal message isolation enforced for employees');

    // ─────────────────────────────────────────────────────────────
    // 4. ORGANIZATION CHANNEL UNIQENESS & DERIVED ACCESS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Organization Channel Uniqueness ---');

    const orgConv1 = await conversationService.getOrCreateOrganizationConversation(orgP9._id);
    const orgConv2 = await conversationService.getOrCreateOrganizationConversation(orgP9._id);
    assert(String(orgConv1._id) === String(orgConv2._id), '10. Organization channel uniqueness enforced (Single lazy channel per tenant)');

    // ─────────────────────────────────────────────────────────────
    // 5. REQUEST STATE MACHINE
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Request State Machine ---');

    const updatedReq = await requestService.updateRequestStatus(req._id, { status: 'under_review' }, adminP9);
    assert(updatedReq.status === 'under_review', '11. Valid state transition: submitted -> under_review');

    let invalidJumpErr = false;
    try {
      await requestService.updateRequestStatus(req._id, { status: 'submitted' }, adminP9);
    } catch (err) {
      invalidJumpErr = err instanceof ApiError && err.statusCode === 400;
    }
    assert(invalidJumpErr, '12. Invalid backward transition under_review -> submitted rejected (400)');

    // ─────────────────────────────────────────────────────────────
    // 6. SUPERADMIN READ-ONLY GUARD
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. SuperAdmin Operational Write Guard ---');

    let saWriteBlockErr = false;
    try {
      await conversationService.addMessageToConversation(ticketConv._id, { content: 'SuperAdmin block test' }, saP9);
    } catch (err) {
      saWriteBlockErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(saWriteBlockErr, '13. SuperAdmin operational ticket write guard enforced (403)');

    // ─────────────────────────────────────────────────────────────
    // 7. DATABASE INDEX & EXPLAIN PERFORMANCE
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 7. Database Index & Query Explain Verification ---');

    const convColl = db.collection('conversations');
    const dummyId = new mongoose.Types.ObjectId();
    const convExplain = await convColl.find({ contextType: 'request', contextId: dummyId }).explain('executionStats');
    const indexName = convExplain.queryPlanner.winningPlan.inputStage?.indexName || convExplain.queryPlanner.winningPlan.indexName;
    assert(indexName === 'idx_query_context_lookup', '14. IXSCAN index usage verified for contextType + contextId lookup');

    // Cleanup P9 synthetic test records
    await Ticket.deleteMany({ organizationId: orgP9._id });
    await AdministrativeRequest.deleteMany({ organizationId: orgP9._id });
    await Conversation.deleteMany({ organizationId: orgP9._id });
    await Message.deleteMany({ organizationId: orgP9._id });
    await Organization.deleteMany({ _id: orgP9._id });

    console.log('\n======================================================');
    console.log(`📊 PHASE 9 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 9 Suite Failed:', err);
    process.exit(1);
  }
};

testPhase9();
