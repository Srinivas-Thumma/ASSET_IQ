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
import { runMigration, verifyMigration } from './scripts/migrate_tickets_requests.js';
import { runArtifactCleanup } from './scripts/clean_test_artifacts.js';
import Organization from './models/Organization.js';
import AdministrativeRequest from './models/AdministrativeRequest.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Ticket from './models/Ticket.js';
import TicketMessage from './models/TicketMessage.js';

const testPhase5 = async () => {
  console.log('\n======================================================');
  console.log('🧪 ASSETOWL PHASE 5 DATA MIGRATION TEST SUITE');
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

    // Create Isolated Test Organization
    const testOrg = await Organization.create({
      name: 'Migration Test Org',
      slug: `migration-test-org-${Date.now()}`
    });
    const orgId = testOrg._id;
    const testUser = new mongoose.Types.ObjectId();

    // Create Synthetic Legacy Tickets & Messages
    const legacyMaintTicket = await Ticket.create({
      type: 'repair',
      status: 'open',
      title: 'Broken Laptop Screen',
      description: 'Display flicker',
      raisedBy: testUser,
      organizationId: orgId
    });

    const legacyAdminTicket = await Ticket.create({
      type: 'admin_support',
      status: 'open',
      issueType: 'billing',
      title: 'Invoice Query',
      description: 'Need March invoice',
      raisedBy: testUser,
      organizationId: orgId
    });

    const legacyMsg1 = await TicketMessage.create({
      ticketId: legacyMaintTicket._id,
      senderId: testUser,
      senderName: 'Test Tech',
      senderRole: 'asset_manager',
      message: 'Inspecting device display',
      isInternal: true,
      organizationId: orgId,
      createdAt: new Date('2026-01-15T10:00:00Z')
    });

    const legacyMsg2 = await TicketMessage.create({
      ticketId: legacyMaintTicket._id,
      senderId: testUser,
      senderName: 'Test User',
      senderRole: 'employee',
      message: 'Screen flickers when moved',
      isInternal: false,
      organizationId: orgId,
      createdAt: new Date('2026-01-15T10:05:00Z')
    });

    // ─────────────────────────────────────────────────────────────
    // 1. DRY-RUN SAFETY TEST
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. Dry-Run Safety ---');
    const dryRunStats = await runMigration({ isDryRun: true, isExecute: false, isVerify: false });
    assert(dryRunStats.legacyTicketsInspected >= 2, 'Legacy tickets inspected');
    assert(dryRunStats.legacyTicketMessagesInspected >= 2, 'Legacy messages inspected');

    // Verify 0 writes performed during dry run
    const postDryConvCount = await Conversation.countDocuments({ organizationId: orgId });
    const postDryMsgCount = await Message.countDocuments({ organizationId: orgId });
    assert(postDryConvCount === 0 && postDryMsgCount === 0, 'Dry-run performed ZERO database mutations');

    // ─────────────────────────────────────────────────────────────
    // 2. EXECUTE MIGRATION & IDEMPOTENCY TEST
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Migration Execution & Idempotency ---');
    const execStats1 = await runMigration({ isDryRun: false, isExecute: true, isVerify: false });
    assert(execStats1.ticketConversationsCreated >= 1, 'Ticket Conversation created');
    assert(execStats1.requestConversationsCreated >= 1, 'Request Conversation created');
    assert(execStats1.messagesMigrated >= 2, 'Messages migrated');

    const createdMaintConv = await Conversation.findOne({ contextType: 'ticket', contextId: legacyMaintTicket._id });
    const createdReq = await AdministrativeRequest.findOne({ requestCode: `REQ-LEGACY-${legacyAdminTicket._id.toString().slice(-8).toUpperCase()}` });
    const createdReqConv = await Conversation.findById(createdReq?.conversationId);

    assert(Boolean(createdMaintConv), 'Maintenance Ticket Conversation correctly created');
    assert(Boolean(createdReq) && createdReq.category === 'billing', 'Administrative Request correctly created with category=billing');
    assert(Boolean(createdReqConv), 'Request Conversation correctly created');

    // RERUN IDEMPOTENCY CHECK
    const execStats2 = await runMigration({ isDryRun: false, isExecute: true, isVerify: false });
    assert(execStats2.alreadyMigrated >= 2, 'Second migration run correctly detected already migrated records');
    assert(execStats2.duplicatesPrevented >= 2, 'Second migration run correctly prevented duplicate messages');

    // Verify total counts in DB did not increase on rerun
    const totalConvCount = await Conversation.countDocuments({ organizationId: orgId });
    assert(totalConvCount === 2, 'Total conversations count remains exactly 2 (Idempotency verified)');

    // ─────────────────────────────────────────────────────────────
    // 3. MESSAGE & CONVERSATION INTEGRITY TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Message & Conversation Integrity ---');

    const migratedMsg1 = await Message.findOne({ conversationId: createdMaintConv._id, content: 'Inspecting device display' });
    assert(migratedMsg1 && migratedMsg1.isInternal === true, 'Internal note status (isInternal: true) preserved');
    assert(migratedMsg1 && migratedMsg1.createdAt.toISOString() === legacyMsg1.createdAt.toISOString(), 'Original timestamp preserved');
    assert(migratedMsg1 && String(migratedMsg1.senderId) === String(testUser), 'Sender identity preserved');
    assert(migratedMsg1 && String(migratedMsg1.organizationId) === String(orgId), 'Organization ID matches source organization');

    const lazyOrgConv = await Conversation.findOne({ organizationId: orgId, contextType: 'organization' });
    assert(lazyOrgConv === null, 'Organization channel remains lazy (NOT bulk-created during migration)');

    // ─────────────────────────────────────────────────────────────
    // 4. NON-DESTRUCTIVE LEGACY DATA PRESERVATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Legacy Data Preservation ---');

    const intactLegacyTicket = await Ticket.findById(legacyMaintTicket._id);
    const intactLegacyMsg = await TicketMessage.findById(legacyMsg1._id);

    assert(Boolean(intactLegacyTicket), 'Legacy Ticket document remains intact in MongoDB');
    assert(Boolean(intactLegacyMsg), 'Legacy TicketMessage document remains intact in MongoDB');

    // Verify verification mode
    const verResult = await verifyMigration();
    assert(verResult.passed === true, 'Migration verification report PASSED');

    // Clean up synthetic test records
    await Ticket.deleteMany({ _id: { $in: [legacyMaintTicket._id, legacyAdminTicket._id] } });
    await TicketMessage.deleteMany({ _id: { $in: [legacyMsg1._id, legacyMsg2._id] } });
    if (createdReq) await AdministrativeRequest.deleteOne({ _id: createdReq._id });
    if (createdMaintConv) {
      await Message.deleteMany({ conversationId: createdMaintConv._id });
      await Conversation.deleteOne({ _id: createdMaintConv._id });
    }
    if (createdReqConv) {
      await Message.deleteMany({ conversationId: createdReqConv._id });
      await Conversation.deleteOne({ _id: createdReqConv._id });
    }
    await Conversation.deleteMany({ organizationId: orgId });
    await Message.deleteMany({ organizationId: orgId });
    await Organization.deleteOne({ _id: orgId });
    await runArtifactCleanup({ isExecute: true });

    console.log('\n======================================================');
    console.log(`📊 PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 5 Test Suite Failed:', err);
    process.exit(1);
  }
};

testPhase5();
