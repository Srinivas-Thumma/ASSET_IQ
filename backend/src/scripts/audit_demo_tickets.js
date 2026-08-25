import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Ticket from '../models/Ticket.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const auditTickets = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const tickets = await Ticket.find({})
    .populate('raisedBy', 'name email role')
    .populate('assetId', 'name assetCode status')
    .lean();

  console.log(`Found ${tickets.length} total tickets in DB.\n`);

  tickets.forEach((t, index) => {
    console.log(`[${index + 1}] Code: ${t.ticketCode || t.ticketNumber || 'N/A'} | ID: ${t._id}`);
    console.log(`    Title: "${t.title}"`);
    console.log(`    Type: ${t.type} | IssueType: ${t.issueType} | Priority: ${t.priority || 'N/A'} | Status: ${t.status}`);
    console.log(`    RaisedBy: ${t.raisedBy?.email || 'N/A'}`);
    console.log(`    Asset: ${t.assetId ? `${t.assetId.name} (${t.assetId.assetCode})` : 'None (General Inquiry)'}`);
    console.log(`    Description: "${t.description}"\n`);
  });

  await mongoose.disconnect();
};

auditTickets().catch((err) => {
  console.error(err);
  process.exit(1);
});
