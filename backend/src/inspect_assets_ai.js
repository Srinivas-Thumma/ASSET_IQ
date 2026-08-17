import mongoose from 'mongoose';
import Asset from './models/Asset.js';
import Ticket from './models/Ticket.js';
import Category from './models/Category.js';
import Vendor from './models/Vendor.js';
import Location from './models/Location.js';
import Employee from './models/Employee.js';
import { gatherAssetContext, calculateHeuristicHealth } from './services/ai.service.js';

await mongoose.connect('mongodb://localhost:27017/assetowl_dev');

const assets = await Asset.find({}).populate('categoryId').lean();
console.log(`Found ${assets.length} assets in dev DB:\n`);

for (const a of assets) {
  const { context } = await gatherAssetContext(a._id, a.organizationId);
  const heuristic = calculateHeuristicHealth(context);
  console.log(`[${a.assetCode}] ${a.name} | Status: ${a.status} | Age: ${context.ageInMonths}m | Lifespan: ${context.expectedLifespan}m | Repairs: ${context.repairCount} | Warranty: ${context.warrantyStatus} | Current AI Health: ${a.ai?.healthScore} | Calculated Heuristic: ${heuristic.healthScore}% (${heuristic.replacementRecommendation})`);
}

await mongoose.disconnect();
