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
import Organization from './models/Organization.js';
import AdministrativeRequest from './models/AdministrativeRequest.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Ticket from './models/Ticket.js';
import TicketMessage from './models/TicketMessage.js';

const testPhase10 = async () => {
  console.log('\n======================================================');
  console.log('🧪 ASSETOWL PHASE 10 RELEASE VALIDATION SUITE');
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

    // 1. Post-Cleanup Count Reconciliation
    const legacyTickets = await Ticket.find({}).lean();
    const legacyMsgs = await TicketMessage.find({}).lean();
    const requests = await AdministrativeRequest.find({}).lean();
    const convs = await Conversation.find({}).lean();
    const msgs = await Message.find({}).lean();
    const orgs = await Organization.find({}).lean();

    assert(legacyTickets.length === 27, '1. Legacy Tickets count matches expected production baseline (27)');
    assert(legacyMsgs.length === 48, '2. Legacy TicketMessages count matches expected baseline (48: 46 active + 2 historical orphaned)');
    assert(requests.length === 5, '3. Migrated AdministrativeRequests count matches expected baseline (5)');
    assert(convs.length === 29, '4. Unified Conversations count matches exact active tickets + requests + org channels (22 + 5 + 2 = 29)');
    assert(msgs.length === 46, '5. Unified Messages count matches migrated active ticket messages (46)');
    assert(orgs.length === 4, '6. Active Organizations count matches expected baseline (4)');

    // 2. Referential Integrity Verification
    let orphanConvFound = false;
    for (const c of convs) {
      if (c.contextType === 'request') {
        const reqExists = await AdministrativeRequest.exists({ _id: c.contextId });
        if (!reqExists) orphanConvFound = true;
      } else if (c.contextType === 'ticket') {
        const tktExists = await Ticket.exists({ _id: c.contextId });
        if (!tktExists) orphanConvFound = true;
      }
    }
    assert(!orphanConvFound, '7. Zero orphaned Conversations found in active dataset');

    let orphanMsgFound = false;
    for (const m of msgs) {
      const convExists = await Conversation.exists({ _id: m.conversationId });
      if (!convExists) orphanMsgFound = true;
    }
    assert(!orphanMsgFound, '8. Zero orphaned Messages found in active dataset');

    // 3. Documented Legacy Orphan Check
    const orphanLegacyMsgs = await TicketMessage.find({ _id: { $in: ['6a855c57a86d7f76130d5f58', '6a85847be3779f7944bf20e5'] } }).lean();
    assert(orphanLegacyMsgs.length === 2, '9. Exactly 2 documented orphaned legacy TicketMessages remain safely preserved');

    // 4. Physical Index Verification
    const convIndexes = await db.collection('conversations').indexes();
    const queryIdx = convIndexes.find(i => i.name === 'idx_query_context_lookup');
    assert(Boolean(queryIdx), '10. Physical MongoDB query index (idx_query_context_lookup) verified in assetowl_dev');

    console.log('\n======================================================');
    console.log(`📊 PHASE 10 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 10 Release Validation Suite Failed:', err);
    process.exit(1);
  }
};

testPhase10();
