import assert from 'node:assert';
import mongoose from 'mongoose';
import Asset from './models/Asset.js';
import Category from './models/Category.js';
import Ticket from './models/Ticket.js';
import Warranty from './models/Warranty.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Employee from './models/Employee.js';
import Vendor from './models/Vendor.js';
import Location from './models/Location.js';
import AuditLog from './models/AuditLog.js';
import { analyzeAssetHealth, calculateHeuristicHealth, gatherAssetContext } from './services/ai.service.js';

console.log('🧪 Starting AI Health Dynamic Scoring Test...\n');

await mongoose.connect('mongodb://localhost:27017/assetowl_dev');

try {
  const org = await Organization.findOne({ slug: 'techflow-solutions' });
  const user = await User.findOne({ organizationId: org._id, role: 'org_admin' });
  const category = await Category.findOne({ organizationId: org._id, name: 'Laptops' });

  // Test 1: Brand new asset in stock
  console.log('1. Testing pristine new laptop (0m age, 0 tickets, stock)...');
  const pristineAsset = await Asset.create({
    organizationId: org._id,
    name: 'Test AI MacBook Pro 2026',
    assetCode: `TEST-AI-NEW-${Date.now()}`,
    categoryId: category._id,
    purchaseDate: new Date(),
    expectedLifespanMonths: 36,
    status: 'stock',
    purchasePrice: 2499
  });

  const res1 = await analyzeAssetHealth(pristineAsset._id, org._id, user, { force: true });
  console.log(`   -> Score: ${res1.healthScore}%, Risk: ${res1.failureRiskPercent}%, Rec: ${res1.replacementRecommendation}`);
  assert(res1.healthScore >= 80, `Pristine asset should have high health score, got ${res1.healthScore}`);
  assert(res1.replacementRecommendation === 'keep', `Pristine asset recommendation should be 'keep', got ${res1.replacementRecommendation}`);

  // Test 2: Asset in repair with active hardware tickets
  console.log('\n2. Testing broken asset in repair status with active defect tickets...');
  const brokenAsset = await Asset.create({
    organizationId: org._id,
    name: 'Test AI Broken Laptop',
    assetCode: `TEST-AI-BROKEN-${Date.now()}`,
    categoryId: category._id,
    purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 24), // 24 months old
    expectedLifespanMonths: 36,
    status: 'repair',
    purchasePrice: 1500
  });

  await Ticket.create({
    organizationId: org._id,
    raisedBy: user._id,
    title: 'Cracked screen and swollen battery',
    description: 'Hardware defect',
    type: 'repair',
    issueType: 'hardware',
    status: 'open',
    priority: 'p1',
    assetId: brokenAsset._id
  });

  const res2 = await analyzeAssetHealth(brokenAsset._id, org._id, user, { force: true });
  console.log(`   -> Score: ${res2.healthScore}%, Risk: ${res2.failureRiskPercent}%, Rec: ${res2.replacementRecommendation}`);
  assert(res2.healthScore <= 45, `Broken asset should have low health score (<= 45), got ${res2.healthScore}`);
  assert(res2.replacementRecommendation === 'repair' || res2.replacementRecommendation === 'replace', `Broken asset recommendation should be repair or replace, got ${res2.replacementRecommendation}`);

  // Test 3: Overdue asset beyond lifespan
  console.log('\n3. Testing legacy asset past manufacturer lifespan (80 months / 36m lifespan)...');
  const legacyAsset = await Asset.create({
    organizationId: org._id,
    name: 'Test AI Legacy Laptop 2018',
    assetCode: `TEST-AI-LEGACY-${Date.now()}`,
    categoryId: category._id,
    purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 80), // 80 months old
    expectedLifespanMonths: 36,
    status: 'stock',
    purchasePrice: 1200
  });

  const res3 = await analyzeAssetHealth(legacyAsset._id, org._id, user, { force: true });
  console.log(`   -> Score: ${res3.healthScore}%, Risk: ${res3.failureRiskPercent}%, Rec: ${res3.replacementRecommendation}`);
  assert(res3.healthScore <= 40, `Legacy asset should have score <= 40, got ${res3.healthScore}`);
  assert(res3.replacementRecommendation === 'replace', `Legacy asset recommendation should be 'replace', got ${res3.replacementRecommendation}`);

  // Test 4: Decommissioned / retired asset
  console.log('\n4. Testing retired asset...');
  const retiredAsset = await Asset.create({
    organizationId: org._id,
    name: 'Test AI Retired Equipment',
    assetCode: `TEST-AI-RET-${Date.now()}`,
    categoryId: category._id,
    purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 60),
    expectedLifespanMonths: 36,
    status: 'retired',
    purchasePrice: 800
  });

  const res4 = await analyzeAssetHealth(retiredAsset._id, org._id, user, { force: true });
  console.log(`   -> Score: ${res4.healthScore}%, Risk: ${res4.failureRiskPercent}%, Rec: ${res4.replacementRecommendation}`);
  assert(res4.healthScore <= 15, `Retired asset should have score <= 15, got ${res4.healthScore}`);
  assert(res4.replacementRecommendation === 'replace', `Retired asset recommendation should be 'replace', got ${res4.replacementRecommendation}`);

  // Test 5: Verify scores are distinct across asset conditions
  console.log('\n5. Verifying score variance across asset conditions:');
  console.log(`   - Pristine (${res1.healthScore}%) vs Broken (${res2.healthScore}%) vs Legacy (${res3.healthScore}%) vs Retired (${res4.healthScore}%)`);
  assert(res1.healthScore > res2.healthScore, 'Pristine asset score must be higher than broken asset score');
  assert(res1.healthScore > res3.healthScore, 'Pristine asset score must be higher than legacy asset score');
  assert(res2.healthScore > res4.healthScore || res3.healthScore > res4.healthScore, 'Active assets must have higher score than retired');

  // Cleanup test documents
  await Asset.deleteMany({ _id: { $in: [pristineAsset._id, brokenAsset._id, legacyAsset._id, retiredAsset._id] } });
  await Ticket.deleteMany({ assetId: brokenAsset._id });

  console.log('\n✅ ALL AI HEALTH DYNAMIC SCORING TESTS PASSED (5/5)!');
} catch (err) {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
} finally {
  await mongoose.disconnect();
}
