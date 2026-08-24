import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env.development')
});

import { MONGODB_URI } from '../config/env.js';
import Organization from '../models/Organization.js';
import AdministrativeRequest from '../models/AdministrativeRequest.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Ticket from '../models/Ticket.js';

export const runArtifactCleanup = async (options = {}) => {
  const isExecute = options.isExecute || process.argv.includes('--execute');
  const isDryRun = !isExecute;

  console.log('\n==================================================');
  console.log(`ASSETIQ PHASE 10 TEST ARTIFACT CLEANUP [${isDryRun ? 'DRY RUN' : 'EXECUTE'}]`);
  console.log('==================================================\n');

  if (!mongoose.connection.readyState) {
    await mongoose.connect(MONGODB_URI);
  }

  const db = mongoose.connection.db;
  console.log(`🔌 Database: ${db.databaseName}`);
  console.log(`⚙️  Mode: ${isDryRun ? 'DRY RUN (No mutations)' : 'EXECUTE (Applying mutations)'}\n`);

  // 1. Identify Test Organizations & Test Tickets
  const allOrgs = await Organization.find({}).lean();
  const testOrgs = allOrgs.filter(o =>
    /migration-test|p7-test|p8-test|p9-test|hard-org|test-org|test-tenant/i.test(o.name) ||
    /migration-test|p7-test|p8-test|p9-test|hard-org|test-org|test-tenant/i.test(o.slug)
  );
  const testOrgIds = testOrgs.map(o => String(o._id));

  const testTickets = await Ticket.find({
    $or: [
      { organizationId: { $in: testOrgIds } },
      { title: { $regex: /TEST - 01|Hardening Ticket|Procurement: New 4K Monitor|testing 1|Testing - SA|HELP - 2/i } }
    ]
  }).lean();
  const testTicketIds = testTickets.map(t => String(t._id));

  // 2. Identify Orphaned Test Request Conversations
  const allReqConvs = await Conversation.find({ contextType: 'request' }).lean();
  const orphanedReqConvs = [];
  for (const conv of allReqConvs) {
    const reqExists = await AdministrativeRequest.exists({ conversationId: conv._id });
    if (!reqExists) {
      orphanedReqConvs.push(conv);
    }
  }

  // 3. Identify Test & Orphaned Messages
  const allConvs = await Conversation.find({}).lean();
  const validConvIds = new Set(allConvs.map(c => String(c._id)));
  const allMsgs = await Message.find({}).lean();
  const testMsgs = allMsgs.filter(m =>
    !validConvIds.has(String(m.conversationId)) || testOrgIds.includes(String(m.organizationId))
  );

  // 4. Summary Report
  console.log('--- CANDIDATE TEST ARTIFACTS CLASSIFIED ---');
  console.log(`Test Organizations Found:          ${testOrgs.length}`);
  console.log(`Orphaned Test Conversations Found: ${orphanedReqConvs.length}`);
  console.log(`Test Messages Found:               ${testMsgs.length}\n`);

  for (const o of testOrgs) {
    console.log(`  [Organization] ID: ${o._id} | Name: "${o.name}" | Reason: Matched test naming pattern`);
  }
  for (const c of orphanedReqConvs) {
    console.log(`  [Conversation] ID: ${c._id} | Context: ${c.contextType}:${c.contextId} | Reason: Orphaned test request conversation (No matching AdministrativeRequest)`);
  }
  for (const m of testMsgs) {
    console.log(`  [Message] ID: ${m._id} | ConvID: ${m.conversationId} | Reason: Linked to test organization or orphaned test conversation`);
  }

  if (isDryRun) {
    console.log('\n==================================================');
    console.log('DRY RUN COMPLETE. Zero database mutations were performed.');
    console.log('To execute cleanup, run: node src/scripts/clean_test_artifacts.js --execute');
    console.log('==================================================\n');
    return {
      isDryRun: true,
      testOrgsCount: testOrgs.length,
      orphanedConvsCount: orphanedReqConvs.length,
      testMsgsCount: testMsgs.length
    };
  }

  // Execute Mode Cleanup
  console.log('\n--- EXECUTING TEST ARTIFACT DELETION ---');
  const orphanedConvIds = orphanedReqConvs.map(c => c._id);
  const ticketDel = await Ticket.deleteMany({ _id: { $in: testTicketIds } });
  const orgDel = await Organization.deleteMany({ _id: { $in: testOrgIds } });
  const convDel = await Conversation.deleteMany({
    $or: [
      { _id: { $in: orphanedConvIds } },
      { contextType: 'ticket', contextId: { $in: testTicketIds } }
    ]
  });
  const msgDel = await Message.deleteMany({ _id: { $in: testMsgs.map(m => m._id) } });

  console.log(`Deleted Test Tickets:           ${ticketDel.deletedCount}`);
  console.log(`Deleted Test Organizations:     ${orgDel.deletedCount}`);
  console.log(`Deleted Orphaned Conversations: ${convDel.deletedCount}`);
  console.log(`Deleted Test Messages:          ${msgDel.deletedCount}`);

  console.log('\n==================================================');
  console.log('EXECUTE COMPLETE. Test artifacts safely cleaned up.');
  console.log('==================================================\n');

  return {
    isDryRun: false,
    deletedOrgs: orgDel.deletedCount,
    deletedConvs: convDel.deletedCount,
    deletedMsgs: msgDel.deletedCount
  };
};

if (process.argv[1] && process.argv[1].endsWith('clean_test_artifacts.js')) {
  runArtifactCleanup()
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error('❌ Cleanup failed:', err);
      process.exit(1);
    });
}

export default runArtifactCleanup;
