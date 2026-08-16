import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load development env config
dotenv.config({
  path: path.resolve(__dirname, '../../.env.development')
});

import { MONGODB_URI, NODE_ENV } from '../config/env.js';
import { seedDevelopmentData } from './development.seed.js';

export const resetDevelopmentDatabase = async () => {
  console.log('\n====================================================');
  console.log('🚨 ASSETOWL DEVELOPMENT DATABASE RESET');
  console.log(`   Environment: ${NODE_ENV}`);
  console.log('====================================================\n');

  // Hard safety guard 1: Node environment check
  if (NODE_ENV !== 'development') {
    console.error(`❌ ABORTING: Reset script is ONLY permitted in NODE_ENV=development. Current NODE_ENV is "${NODE_ENV}".`);
    process.exit(1);
  }

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  const dbName = mongoose.connection.db.databaseName;
  console.log(`🔌 Connected to database: ${dbName}`);

  // Hard safety guard 2: Database name check
  if (dbName === 'assetowl' || !dbName.includes('dev')) {
    console.error(`❌ ABORTING: Refusing to reset database "${dbName}". Database name must contain "dev" and cannot be production "assetowl".`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`🧹 Dropping entire development database "${dbName}"...`);
  await mongoose.connection.db.dropDatabase();
  console.log(`✅ Successfully dropped database "${dbName}".\n`);

  await mongoose.disconnect();

  console.log('🌱 Triggering fresh development seed...');
  await seedDevelopmentData();
  console.log('✨ Development database reset and re-seed complete!');
};

// Execute if run directly
const isDirectRun = process.argv[1] && (
  path.resolve(process.argv[1]).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase() ||
  process.argv[1].endsWith('reset-dev.seed.js')
);

if (isDirectRun) {
  resetDevelopmentDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Reset development database failed:', err);
      process.exit(1);
    });
}

export default resetDevelopmentDatabase;
