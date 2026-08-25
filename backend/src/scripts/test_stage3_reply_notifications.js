import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Notification from '../models/Notification.js';

import { createTicket } from '../services/ticket.service.js';
import { createMessage } from '../services/message.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const testStage3 = async () => {
  console.log('======================================================');
  console.log('🧪 STAGE 3 VERIFICATION — REPLY NOTIFICATIONS');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const emp = await User.findOne({ role: 'employee', status: 'active' }).lean();
  const mgr = await User.findOne({ role: 'asset_manager', organizationId: emp.organizationId, status: 'active' }).lean();

  if (!emp || !mgr) throw new Error('Test users missing');

  console.log(`Employee (Ticket Raiser): ${emp.email}`);
  console.log(`Manager (Replier): ${mgr.email}\n`);

  // Step 1: Employee creates a ticket
  console.log('Step 1: Employee creates a repair ticket...');
  const ticket = await createTicket(
    {
      title: 'Stage 3 Test Laptop Keyboard Replacement',
      description: 'Sticky keys on top row',
      type: 'repair',
      priority: 'p3'
    },
    emp
  );
  console.log(` -> Ticket Created: ID=${ticket._id} (${ticket.ticketNumber || ticket.ticketCode})\n`);

  // Clear initial creation notifications for clean assertion
  await Notification.deleteMany({ relatedId: ticket._id });

  // Step 2: Manager posts a public reply to the ticket
  console.log('Step 2: Asset Manager posts a public reply to the employee ticket...');
  const replyMessage = await createMessage(
    {
      ticketId: ticket._id,
      message: 'Hello, please drop off your laptop at IT Desk B for inspection.',
      isInternal: false
    },
    mgr
  );
  console.log(` -> Reply Posted: MessageID=${replyMessage._id}\n`);

  // Step 3: Verify notification document created for Employee
  console.log('Step 3: Verifying notification document created for Employee...');
  const empNotif = await Notification.findOne({
    userId: emp._id,
    relatedId: ticket._id
  }).lean();

  if (!empNotif) {
    throw new Error('STAGE 3 FAIL: Employee did not receive a Notification document for manager reply!');
  }

  console.log('  ✅ Notification Found:');
  console.log(`     - Recipient: ${emp.email}`);
  console.log(`     - Title: ${empNotif.title}`);
  console.log(`     - Message: ${empNotif.message}`);
  console.log(`     - Related Ticket: ${empNotif.relatedId}`);

  // Step 4: Manager posts an internal note -> Employee should NOT be notified
  console.log('\nStep 4: Manager posts an internal note...');
  const internalMessage = await createMessage(
    {
      ticketId: ticket._id,
      message: 'Internal Note: Vendor replacement parts ordered',
      isInternal: true
    },
    mgr
  );

  const newEmpNotifs = await Notification.find({
    userId: emp._id,
    relatedId: ticket._id
  }).lean();

  if (newEmpNotifs.length !== 1) {
    throw new Error(`STAGE 3 FAIL: Internal note incorrectly generated a notification for Employee! Expected 1, found ${newEmpNotifs.length}`);
  }
  console.log('  ✅ Internal note correctly suppressed from Employee notifications.');

  // Cleanup test ticket and notifications
  await Ticket.deleteOne({ _id: ticket._id });
  await Notification.deleteMany({ relatedId: ticket._id });
  console.log('\n🧹 Cleaned up temporary stage 3 test records.');

  console.log('\n======================================================');
  console.log('✅ STAGE 3 VERIFICATION PASSED 100%');
  console.log('======================================================');

  await mongoose.disconnect();
};

testStage3().catch((err) => {
  console.error(err);
  process.exit(1);
});
