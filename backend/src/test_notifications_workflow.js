import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from './models/User.js';
import Organization from './models/Organization.js';
import Ticket from './models/Ticket.js';
import AdministrativeRequest from './models/AdministrativeRequest.js';
import Notification from './models/Notification.js';

import { createTicket, escalateTicket } from './services/ticket.service.js';
import { createRequest } from './services/request.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

const runNotificationTests = async () => {
  console.log('======================================================');
  console.log('🧪 TESTING NOTIFICATIONS WORKFLOW');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔌 Connected to MongoDB:', mongoose.connection.name);

  try {
    // 1. Fetch test actors
    const orgAdmin = await User.findOne({ role: 'org_admin', status: 'active' }).lean();
    const assetManager = await User.findOne({ role: 'asset_manager', organizationId: orgAdmin.organizationId, status: 'active' }).lean();
    const employee = await User.findOne({ role: 'employee', organizationId: orgAdmin.organizationId, status: 'active' }).lean();
    const superAdmin = await User.findOne({ role: 'super_admin', status: 'active' }).lean();

    if (!orgAdmin || !assetManager || !employee || !superAdmin) {
      throw new Error('Required test users (orgAdmin, assetManager, employee, superAdmin) not found in DB');
    }

    console.log('Test Users Verified:');
    console.log(` - Employee: ${employee.email}`);
    console.log(` - Asset Manager: ${assetManager.email}`);
    console.log(` - Org Admin: ${orgAdmin.email}`);
    console.log(` - Super Admin: ${superAdmin.email}\n`);

    // TEST 1: Employee raises a ticket -> Asset Manager should receive notification (SuperAdmin excluded)
    console.log('Test 1: Raising a new ticket by Employee for Asset Manager...');
    const ticket = await createTicket(
      {
        title: 'Test Notification Keyboard Issue',
        description: 'Keycap detached from board',
        type: 'repair',
        priority: 'p3',
        issueType: 'hardware'
      },
      employee
    );

    const mgrNotif = await Notification.findOne({
      userId: assetManager._id,
      relatedId: ticket._id,
      type: 'ticket_created'
    }).lean();

    const saNotifTicket = await Notification.findOne({
      userId: superAdmin._id,
      relatedId: ticket._id,
      type: 'ticket_created'
    }).lean();

    if (mgrNotif) {
      console.log('  ✅ Asset Manager received ticket_created notification:', mgrNotif.message);
    } else {
      console.error('  ❌ Asset Manager failed to receive ticket_created notification');
    }

    if (!saNotifTicket) {
      console.log('  ✅ Super Admin correctly excluded from operational ticket notification');
    } else {
      console.error('  ❌ Super Admin incorrectly received operational ticket_created notification');
    }

    // TEST 2: Asset Manager escalates ticket -> Org Admin should receive ticket_escalated notification
    console.log('\nTest 2: Escalating ticket by Asset Manager...');
    await escalateTicket(ticket._id, assetManager);

    const adminEscNotif = await Notification.findOne({
      userId: orgAdmin._id,
      relatedId: ticket._id,
      type: 'ticket_escalated'
    }).lean();

    if (adminEscNotif) {
      console.log('  ✅ Org Admin received ticket_escalated notification:', adminEscNotif.message);
    } else {
      console.error('  ❌ Org Admin failed to receive ticket_escalated notification');
    }

    // TEST 3: Asset Manager raises an administrative procurement request -> Super Admin should receive request_created notification
    console.log('\nTest 3: Creating administrative request by Asset Manager...');
    const request = await createRequest(
      {
        category: 'procurement',
        title: 'Test Notification Procurement Request',
        description: 'New monitors for design team',
        priority: 'p2',
        payload: {
          itemCategory: 'Hardware - Monitors',
          itemCount: 2,
          estimatedBudget: 600,
          justification: 'Expansion of design team'
        }
      },
      assetManager
    );

    const saNotifReq = await Notification.findOne({
      userId: superAdmin._id,
      relatedId: request._id,
      type: 'request_created'
    }).lean();

    if (saNotifReq) {
      console.log('  ✅ Super Admin received request_created notification:', saNotifReq.message);
    } else {
      console.error('  ❌ Super Admin failed to receive request_created notification');
    }

    // Clean up created test records
    await Ticket.deleteOne({ _id: ticket._id });
    await AdministrativeRequest.deleteOne({ _id: request._id });
    await Notification.deleteMany({ relatedId: { $in: [ticket._id, request._id] } });
    console.log('\n🧹 Cleaned up temporary test records from MongoDB.');

    if (mgrNotif && !saNotifTicket && adminEscNotif && saNotifReq) {
      console.log('\n======================================================');
      console.log('🎉 ALL NOTIFICATION TESTS PASSED SUCCESSFULLY 100%');
      console.log('======================================================');
    } else {
      throw new Error('One or more notification assertions failed');
    }
  } finally {
    await mongoose.disconnect();
  }
};

runNotificationTests().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
