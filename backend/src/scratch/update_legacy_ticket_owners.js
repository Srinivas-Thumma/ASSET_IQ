import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

import { MONGODB_URI } from '../config/env.js';

const updateLegacyTickets = async () => {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const alice = await db.collection('users').findOne({ email: 'alice@techflow.dev' });
  const bob = await db.collection('users').findOne({ email: 'bob@techflow.dev' });

  if (alice) {
    const res1 = await db.collection('tickets').updateMany(
      { $or: [{ raisedBy: { $exists: false } }, { raisedBy: null }] },
      { $set: { raisedBy: alice._id, createdBy: alice._id } }
    );
    console.log(`Updated ${res1.modifiedCount} legacy unassigned tickets to owner Alice (${alice.email})`);
  }

  await mongoose.disconnect();
};

updateLegacyTickets().catch(console.error);
