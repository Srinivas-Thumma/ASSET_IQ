import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Notification from '../models/Notification.js';

import { createTicket } from '../services/ticket.service.js';
import { getNotificationsForUser, markNotificationAsRead } from '../services/notification.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const testStage2 = async () => {
  console.log('======================================================');
  console.log('🧪 STAGE 2 VERIFICATION — PER-TICKET UNREAD INDICATORS');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const emp = await User.findOne({ role: 'employee', status: 'active' }).lean();
  const mgr = await User.findOne({ role: 'asset_manager', organizationId: emp.organizationId, status: 'active' }).lean();

  if (!emp || !mgr) throw new Error('Test users missing');

  console.log(`Test Employee: ${emp.email} | Test Manager: ${mgr.email}`);

  // Create Ticket A and Ticket B
  const ticketA = await createTicket({ title: 'Stage 2 Ticket A', description: 'Unread test A', type: 'repair' }, emp);
  const ticketB = await createTicket({ title: 'Stage 2 Ticket B', description: 'Unread test B', type: 'repair' }, emp);

  console.log(`Created Ticket A (${ticketA.ticketNumber}) and Ticket B (${ticketB.ticketNumber}).`);

  // Create unread notifications for Manager on Ticket A and Ticket B
  const notifA = await Notification.create({
    userId: mgr._id,
    organizationId: emp.organizationId,
    type: 'ticket_created',
    title: 'New Ticket Raised',
    message: 'Test message for Ticket A',
    read: false,
    relatedId: ticketA._id,
    relatedType: 'ticket'
  });

  const notifB = await Notification.create({
    userId: mgr._id,
    organizationId: emp.organizationId,
    type: 'ticket_created',
    title: 'New Ticket Raised',
    message: 'Test message for Ticket B',
    read: false,
    relatedId: ticketB._id,
    relatedType: 'ticket'
  });

  console.log(`Created unread notifications for Manager: Notif A (${notifA._id}) & Notif B (${notifB._id}).`);

  // Query notifications for Manager
  let userNotifs = await getNotificationsForUser(mgr._id);

  const hasUnreadA_before = userNotifs.some((n) => !n.read && String(n.relatedId) === String(ticketA._id));
  const hasUnreadB_before = userNotifs.some((n) => !n.read && String(n.relatedId) === String(ticketB._id));

  console.log(`Before opening Ticket A: Ticket A unread=${hasUnreadA_before} | Ticket B unread=${hasUnreadB_before}`);
  if (!hasUnreadA_before || !hasUnreadB_before) {
    throw new Error('Initial unread indicators failed');
  }

  // Simulate opening Ticket A (marking all unread notifications for Ticket A as read)
  console.log('\nOpening Ticket A (marking Ticket A notifications as read)...');
  const notifsToClear = userNotifs.filter((n) => !n.read && String(n.relatedId) === String(ticketA._id));
  for (const n of notifsToClear) {
    await markNotificationAsRead(n._id, mgr._id);
  }

  userNotifs = await getNotificationsForUser(mgr._id);
  const hasUnreadA_after = userNotifs.some((n) => !n.read && String(n.relatedId) === String(ticketA._id));
  const hasUnreadB_after = userNotifs.some((n) => !n.read && String(n.relatedId) === String(ticketB._id));

  console.log(`After opening Ticket A: Ticket A unread=${hasUnreadA_after} | Ticket B unread=${hasUnreadB_after}`);

  // Cleanup test data
  await Ticket.deleteMany({ _id: { $in: [ticketA._id, ticketB._id] } });
  await Notification.deleteMany({ _id: { $in: [notifA._id, notifB._id] } });
  console.log('🧹 Cleaned up temporary test tickets and notifications.');

  if (hasUnreadA_after !== false || hasUnreadB_after !== true) {
    throw new Error('STAGE 2 FAIL: Opening Ticket A incorrectly altered Ticket B unread status or failed to clear Ticket A!');
  }

  console.log('\n======================================================');
  console.log('✅ STAGE 2 VERIFICATION PASSED 100%');
  console.log('======================================================');

  await mongoose.disconnect();
};

testStage2().catch((err) => {
  console.error(err);
  process.exit(1);
});
