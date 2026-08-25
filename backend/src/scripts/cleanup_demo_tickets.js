import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Ticket from '../models/Ticket.js';
import TicketMessage from '../models/TicketMessage.js';
import Message from '../models/Message.js';
import Asset from '../models/Asset.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const cleanupDemoData = async () => {
  console.log('======================================================');
  console.log('🧹 STAGE 6 — CLEANING UP DEMO & TEST TICKET DATA');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  // Find asset TF-LAP-001 to link to ticket 24
  const assetTfLap1 = await Asset.findOne({ assetCode: 'TF-LAP-001' }).lean();

  const updates = [
    {
      id: '6a82a7e5e3d86b9cdd7026c1',
      title: 'MacBook Pro battery expansion and display distortion',
      description: 'Trackpad pressure sensor unresponsive due to battery cell expansion. Top casing is bowing out and display hinge is misaligned under pressure.',
      type: 'repair',
      issueType: 'hardware',
      priority: 'p1'
    },
    {
      id: '6a8c21fc2b39146d8d470243',
      title: 'Configure custom SAML identity provider for tenant authentication',
      description: 'Requesting technical assistance setting up Azure AD enterprise application SSO integration and mapping user role attributes to AssetIQ claims.',
      type: 'admin_support',
      issueType: 'technical',
      priority: 'p2'
    },
    {
      id: '6a8c75bb8dafd959a1f565a0',
      title: 'Audit log export format customization request',
      description: 'We require automated weekly CSV/JSON audit trail exports routed to our enterprise SIEM endpoint for SOC2 compliance monitoring.',
      type: 'admin_support',
      issueType: 'other',
      priority: 'p3'
    },
    {
      id: '6a8d292fd396cf69ab996c3b',
      title: 'Mechanical keyboard keycap replacement & switch chatter',
      description: "The 'E' keycap detached from switch housing and double-types intermittently during fast typing.",
      type: 'repair',
      issueType: 'hardware',
      priority: 'p3',
      assetId: assetTfLap1?._id || null
    },
    {
      id: '6a8d2c4c0ed61516e8aae189',
      title: 'Return temporary laptop loaner after workstation repair',
      description: 'Returning loaner ThinkPad T14 Gen 4 following completion of primary desktop workstation repair.',
      type: 'return',
      issueType: 'hardware',
      priority: 'p3'
    }
  ];

  for (const item of updates) {
    const tkt = await Ticket.findById(item.id);
    if (tkt) {
      tkt.title = item.title;
      tkt.description = item.description;
      tkt.type = item.type;
      tkt.issueType = item.issueType;
      tkt.priority = item.priority;
      if (item.assetId) tkt.assetId = item.assetId;
      await tkt.save();
      console.log(` ✅ Updated Ticket ${tkt.ticketNumber || tkt.ticketCode} (${tkt._id}): "${tkt.title}"`);
    }
  }

  // Clean up any test/placeholder messages containing informal text
  const informalKeywords = ['LOLLL', 'yoo uncle', 'how doing u', 'testing plzz'];
  const testMsgs = await TicketMessage.find({
    message: { $regex: informalKeywords.join('|'), $options: 'i' }
  });

  for (const m of testMsgs) {
    m.message = 'Acknowledged. IT support ticket logged and queued for specialist review.';
    await m.save();
    console.log(` 💬 Cleaned up test ticket message (${m._id}).`);
  }

  const testUnifiedMsgs = await Message.find({
    content: { $regex: informalKeywords.join('|'), $options: 'i' }
  });

  for (const m of testUnifiedMsgs) {
    m.content = 'Acknowledged. IT support ticket logged and queued for specialist review.';
    await m.save();
    console.log(` 💬 Cleaned up test unified message (${m._id}).`);
  }

  console.log('\n======================================================');
  console.log('🎉 DEMO DATA CLEANUP COMPLETE');
  console.log('======================================================');

  await mongoose.disconnect();
};

cleanupDemoData().catch((err) => {
  console.error(err);
  process.exit(1);
});
