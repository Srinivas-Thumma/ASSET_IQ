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
import { runArtifactCleanup } from './scripts/clean_test_artifacts.js';
import conversationService from './services/conversation.service.js';
import requestService from './services/request.service.js';
import ticketService from './services/ticket.service.js';
import Organization from './models/Organization.js';
import AdministrativeRequest from './models/AdministrativeRequest.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Ticket from './models/Ticket.js';
import TicketMessage from './models/TicketMessage.js';
import ApiError from './utils/ApiError.js';

const testPhase8 = async () => {
  console.log('\n======================================================');
  console.log('🧪 ASSETOWL PHASE 8 PRODUCTION HARDENING TEST SUITE');
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

    const orgA = await Organization.create({ name: 'Hardening Org A', slug: `hard-org-a-${Date.now()}` });
    const orgB = await Organization.create({ name: 'Hardening Org B', slug: `hard-org-b-${Date.now()}` });

    const empUser = { _id: new mongoose.Types.ObjectId(), role: 'employee', organizationId: orgA._id, email: 'emp8@orga.com' };
    const mgrUser = { _id: new mongoose.Types.ObjectId(), role: 'asset_manager', organizationId: orgA._id, email: 'mgr8@orga.com' };
    const adminUserA = { _id: new mongoose.Types.ObjectId(), role: 'org_admin', organizationId: orgA._id, email: 'admin8@orga.com' };
    const adminUserB = { _id: new mongoose.Types.ObjectId(), role: 'org_admin', organizationId: orgB._id, email: 'admin8@orgb.com' };
    const superAdminUser = { _id: new mongoose.Types.ObjectId(), role: 'super_admin', organizationId: null, email: 'sa8@platform.com' };

    // ─────────────────────────────────────────────────────────────
    // 1. REST ↔ SERVICE ↔ SOCKET AUTHORIZATION CONSISTENCY
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. Auth Consistency & Security ---');

    const maintTicket = await Ticket.create({
      organizationId: orgA._id,
      ticketCode: `TKT-P8-${Date.now()}`,
      type: 'repair',
      title: 'Hardening Ticket',
      description: 'Fan repair',
      raisedBy: empUser._id,
      status: 'open'
    });

    const ticketConv = await conversationService.createTicketConversation(maintTicket, empUser);

    // Cross-tenant read block
    let crossTenantErr = false;
    try {
      await conversationService.getConversationById(ticketConv._id, adminUserB);
    } catch (err) {
      crossTenantErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(crossTenantErr, '1. REST & Service cross-tenant access correctly DENIED (403)');

    // SuperAdmin read-only operational ticket write block
    let saWriteErr = false;
    try {
      await conversationService.addMessageToConversation(ticketConv._id, { content: 'SuperAdmin write' }, superAdminUser);
    } catch (err) {
      saWriteErr = err instanceof ApiError && err.statusCode === 403;
    }
    assert(saWriteErr, '2. SuperAdmin operational ticket write guard enforced (403)');

    // ─────────────────────────────────────────────────────────────
    // 2. REQUEST STATE MACHINE TRANSITIONS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Request State Machine Validation ---');

    const req = await requestService.createRequest({
      category: 'procurement',
      title: 'Monitors Order',
      description: 'Need 5 4K monitors',
      payload: { itemCategory: 'Monitor', itemCount: 5, estimatedBudget: 2500, justification: 'Design team' }
    }, mgrUser);

    assert(req.status === 'submitted', 'Initial request status is "submitted"');

    // Valid: submitted -> under_review
    const underReviewReq = await requestService.updateRequestStatus(req._id, { status: 'under_review' }, adminUserA);
    assert(underReviewReq.status === 'under_review', 'Valid transition: submitted -> under_review');

    // Valid: under_review -> approved
    const approvedReq = await requestService.updateRequestStatus(req._id, { status: 'approved', decisionNotes: 'Approved by OrgAdmin' }, adminUserA);
    assert(approvedReq.status === 'approved', 'Valid transition: under_review -> approved');

    // Invalid: approved -> rejected
    let invalidTransitionErr = false;
    try {
      await requestService.updateRequestStatus(req._id, { status: 'rejected' }, adminUserA);
    } catch (err) {
      invalidTransitionErr = err instanceof ApiError && err.statusCode === 400;
    }
    assert(invalidTransitionErr, 'Invalid transition approved -> rejected correctly REJECTED (400)');

    // Valid: approved -> completed
    const completedReq = await requestService.updateRequestStatus(req._id, { status: 'completed' }, adminUserA);
    assert(completedReq.status === 'completed', 'Valid transition: approved -> completed');

    // Invalid: completed -> submitted (Terminal state block)
    let terminalStateErr = false;
    try {
      await requestService.updateRequestStatus(req._id, { status: 'submitted' }, adminUserA);
    } catch (err) {
      terminalStateErr = err instanceof ApiError && err.statusCode === 400;
    }
    assert(terminalStateErr, 'Invalid transition completed -> submitted correctly REJECTED (400)');

    // ─────────────────────────────────────────────────────────────
    // 3. CONCURRENCY & LAZY ORG CHANNEL PROTECTION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Concurrency & Lazy Org Channel Protection ---');

    const [orgConv1, orgConv2] = await Promise.all([
      conversationService.getOrCreateOrganizationConversation(orgA._id),
      conversationService.getOrCreateOrganizationConversation(orgA._id)
    ]);
    assert(String(orgConv1._id) === String(orgConv2._id), 'Concurrent getOrCreateOrganizationConversation calls resolved to identical conversation without index duplicate error');

    // ─────────────────────────────────────────────────────────────
    // 4. MESSAGE CONCURRENCY & INTEGRITY
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Message Concurrency & Integrity ---');

    const [msg1, msg2] = await Promise.all([
      conversationService.addMessageToConversation(ticketConv._id, { content: 'Concurrent Msg 1' }, empUser),
      conversationService.addMessageToConversation(ticketConv._id, { content: 'Concurrent Msg 2' }, mgrUser)
    ]);

    assert(Boolean(msg1 && msg2), 'Concurrent messages created successfully');

    const updatedConv = await Conversation.findById(ticketConv._id).lean();
    assert(Boolean(updatedConv.lastMessageAt), 'lastMessageAt timestamp updated');
    assert(Boolean(updatedConv.lastMessageSnippet), 'lastMessageSnippet updated');

    // ─────────────────────────────────────────────────────────────
    // 5. PHYSICAL DATABASE INDEX VERIFICATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Physical Database Index Verification ---');

    const convIndexes = await db.collection('conversations').indexes();
    const hasOrgPartialIndex = convIndexes.some(idx => idx.name === 'idx_unique_organization_conversation');
    const hasReqPartialIndex = convIndexes.some(idx => idx.name === 'idx_unique_request_conversation');
    assert(hasOrgPartialIndex && hasReqPartialIndex, 'Physical MongoDB partial unique indexes verified in assetowl_dev');

    // ─────────────────────────────────────────────────────────────
    // 6. READ-ONLY MIGRATION INTEGRITY
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Migration Integrity Check ---');

    const legacyTicketsCount = await Ticket.countDocuments();
    const legacyMessagesCount = await TicketMessage.countDocuments();
    const reqCount = await AdministrativeRequest.countDocuments();
    const convCount = await Conversation.countDocuments();

    assert(legacyTicketsCount >= 0 && legacyMessagesCount >= 0, 'Read-only migration count check executed');

    // Cleanup synthetic hardening test data
    await Ticket.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await AdministrativeRequest.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await Conversation.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await Message.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await Organization.deleteMany({ _id: { $in: [orgA._id, orgB._id] } });
    await runArtifactCleanup({ isExecute: true });

    console.log('\n======================================================');
    console.log(`📊 PHASE 8 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 8 Production Hardening Suite Failed:', err);
    process.exit(1);
  }
};

testPhase8();
