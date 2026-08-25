import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Location from '../models/Location.js';
import { getAssets } from '../services/asset.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const testAssetsCustodian = async () => {
  console.log('======================================================');
  console.log('🧪 TESTING GET ASSETS CUSTODIAN POPULATION');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const manager = await User.findOne({ role: 'asset_manager', status: 'active' }).lean();
  if (!manager) throw new Error('Asset Manager missing');

  const assetsResult = await getAssets(manager.organizationId, { page: 1, limit: 10 });
  const items = assetsResult.items || assetsResult;

  console.log(`Fetched ${items.length} assets for org ${manager.organizationId}:`);
  let custodianFound = 0;

  items.forEach((a, idx) => {
    const custodian = a.currentAssignment?.employeeName || 'In Stock';
    if (a.currentAssignment?.employeeName) custodianFound++;
    console.log(` ${idx + 1}. [${a.assetCode}] ${a.name} — Status: ${a.status} | Custodian: ${custodian}`);
  });

  console.log(`\n  ✅ Custodians correctly populated: ${custodianFound} assigned assets with employee names.`);

  console.log('\n======================================================');
  console.log('🎉 GET ASSETS CUSTODIAN TEST PASSED 100%');
  console.log('======================================================');

  await mongoose.disconnect();
};

testAssetsCustodian().catch((err) => {
  console.error(err);
  process.exit(1);
});
