import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const backfill = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const tickets = await db.collection('tickets').find({}).toArray();
  console.log('Total tickets found in DB:', tickets.length);

  for (const t of tickets) {
    const code = t.ticketCode || t.ticketNumber || `TKT-${t._id.toString().slice(-6).toUpperCase()}`;
    await db.collection('tickets').updateOne(
      { _id: t._id },
      { $set: { ticketCode: code, ticketNumber: code } }
    );
  }

  const allTickets = await db.collection('tickets').find({}).toArray();
  const codes = allTickets.map((t) => t.ticketCode);
  const uniqueCodes = new Set(codes);

  console.log(`Successfully updated ${allTickets.length} tickets.`);
  console.log(`Unique ticket codes: ${uniqueCodes.size} / ${allTickets.length}`);
  console.log('Sample ticket codes:', codes.slice(0, 8));

  await mongoose.disconnect();
};

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
