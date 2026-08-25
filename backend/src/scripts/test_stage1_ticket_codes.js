import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import { createTicket } from '../services/ticket.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const testStage1 = async () => {
  console.log('======================================================');
  console.log('🧪 STAGE 1 VERIFICATION — TICKET CODE UNIQUENESS');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const emp = await User.findOne({ role: 'employee', status: 'active' }).lean();
  if (!emp) throw new Error('No employee found for stage 1 verification test');

  console.log('Creating 5 new tickets in rapid succession...');
  const createdTickets = [];
  for (let i = 1; i <= 5; i++) {
    const tkt = await createTicket(
      {
        title: `Stage 1 Verification Test Ticket ${i}`,
        description: `Rapid creation uniqueness test ${i}`,
        type: 'repair',
        priority: 'p3',
        issueType: 'hardware'
      },
      emp
    );
    createdTickets.push(tkt);
    console.log(` - Created Ticket ${i}: ID=${tkt._id} | ticketNumber=${tkt.ticketNumber} | ticketCode=${tkt.ticketCode}`);
  }

  const generatedCodes = createdTickets.map((t) => t.ticketNumber || t.ticketCode);
  const uniqueSet = new Set(generatedCodes);

  console.log(`\nGenerated ${generatedCodes.length} codes:`, generatedCodes);
  console.log(`Unique code count: ${uniqueSet.size} / ${generatedCodes.length}`);

  // Cleanup test tickets
  const ids = createdTickets.map((t) => t._id);
  await Ticket.deleteMany({ _id: { $in: ids } });
  console.log('🧹 Cleaned up temporary stage 1 verification test tickets.');

  if (uniqueSet.size !== generatedCodes.length) {
    throw new Error('STAGE 1 FAIL: Duplicate ticket code collision detected!');
  }

  // Check database for any duplicate ticketNumbers across the entire collection
  const allDbTickets = await Ticket.find({}).select('ticketNumber ticketCode _id').lean();
  const allCodes = allDbTickets.map((t) => t.ticketNumber || t.ticketCode || `TKT-${t._id.toString().slice(-6).toUpperCase()}`);
  const allUnique = new Set(allCodes);

  console.log(`\nGlobal Database Unique Check: ${allUnique.size} unique codes across ${allDbTickets.length} total tickets.`);

  if (allUnique.size !== allDbTickets.length) {
    throw new Error('STAGE 1 FAIL: Global database contains duplicate ticket codes!');
  }

  console.log('\n======================================================');
  console.log('✅ STAGE 1 VERIFICATION PASSED 100%');
  console.log('======================================================');

  await mongoose.disconnect();
};

testStage1().catch((err) => {
  console.error(err);
  process.exit(1);
});
