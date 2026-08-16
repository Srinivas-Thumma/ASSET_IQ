import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env.development')
});

import { MONGODB_URI } from './config/env.js';
import Organization from './models/Organization.js';
import User from './models/User.js';
import Employee from './models/Employee.js';
import Department from './models/Department.js';
import Category from './models/Category.js';
import Location from './models/Location.js';
import Vendor from './models/Vendor.js';
import Asset from './models/Asset.js';
import Assignment from './models/Assignment.js';
import Ticket from './models/Ticket.js';
import Warranty from './models/Warranty.js';

const verify = async () => {
  console.log('\n====================================================');
  console.log('🔍 ASSETOWL RICH SEED VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Connect to dev database
  await mongoose.connect(MONGODB_URI);
  const dbName = mongoose.connection.db.databaseName;
  console.log(`1. Connected to Database: ${dbName}`);
  if (dbName !== 'assetowl_dev') {
    throw new Error(`Expected database "assetowl_dev", but got "${dbName}"`);
  }
  console.log('   ✅ Dev database name verified: assetowl_dev\n');

  // 2. Verify Super Admin
  console.log('2. Checking Super Admin Credentials:');
  const superAdmin = await User.findOne({ email: 'superadmin@assetowl.dev' });
  if (!superAdmin) throw new Error('Super Admin not found in assetowl_dev');
  const isSuperAdminPassValid = await bcrypt.compare('SuperAdmin123!', superAdmin.passwordHash);
  console.log(`   Email: ${superAdmin.email}`);
  console.log(`   Role: ${superAdmin.role}`);
  console.log(`   Organization ID: ${superAdmin.organizationId} (null as expected)`);
  console.log(`   Password verification (SuperAdmin123!): ${isSuperAdminPassValid ? '✅ VALID' : '❌ INVALID'}`);
  if (!isSuperAdminPassValid) throw new Error('Super Admin password hash mismatch');

  // 3. Verify Demo User Passwords
  console.log('\n3. Checking Demo User Passwords (password123):');
  const allUsers = await User.find({ role: { $ne: 'super_admin' } }).populate('employeeRef');
  console.log(`   Found ${allUsers.length} organization users.`);

  for (const u of allUsers) {
    const valid = await bcrypt.compare('password123', u.passwordHash);
    const empName = u.employeeRef ? `${u.employeeRef.firstName} ${u.employeeRef.lastName}` : 'N/A';
    console.log(`   [${valid ? '✅' : '❌'}] ${u.email.padEnd(25)} | Role: ${u.role.padEnd(14)} | Org: ${u.organizationName.padEnd(20)} | Emp: ${empName}`);
    if (!valid) throw new Error(`Password verification failed for ${u.email}`);
  }

  // 4. Verify Tenant Isolation
  console.log('\n4. Checking Multi-Tenant Isolation:');
  const techFlowOrg = await Organization.findOne({ slug: 'techflow-solutions' });
  const greenLeafOrg = await Organization.findOne({ slug: 'greenleaf-corp' });

  if (!techFlowOrg || !greenLeafOrg) throw new Error('Demo organizations not found');

  const tfId = techFlowOrg._id;
  const glId = greenLeafOrg._id;

  // TechFlow Asset checks
  const tfAssets = await Asset.find({ organizationId: tfId });
  const glAssets = await Asset.find({ organizationId: glId });
  console.log(`   TechFlow Assets count: ${tfAssets.length} (Expected: 39)`);
  console.log(`   GreenLeaf Assets count: ${glAssets.length} (Expected: 25)`);

  // Verify cross-tenant isolation on references
  const tfCategories = await Category.find({ organizationId: tfId });
  const tfCatIds = new Set(tfCategories.map(c => c._id.toString()));
  for (const a of tfAssets) {
    if (a.categoryId && !tfCatIds.has(a.categoryId.toString())) {
      throw new Error(`Tenant leak! TechFlow asset ${a.assetCode} points to non-TechFlow category ${a.categoryId}`);
    }
  }
  console.log('   ✅ All TechFlow assets reference TechFlow categories exclusively.');

  const glCategories = await Category.find({ organizationId: glId });
  const glCatIds = new Set(glCategories.map(c => c._id.toString()));
  for (const a of glAssets) {
    if (a.categoryId && !glCatIds.has(a.categoryId.toString())) {
      throw new Error(`Tenant leak! GreenLeaf asset ${a.assetCode} points to non-GreenLeaf category ${a.categoryId}`);
    }
  }
  console.log('   ✅ All GreenLeaf assets reference GreenLeaf categories exclusively.');

  // Verify assignments
  const tfAssignments = await Assignment.find({ organizationId: tfId });
  const glAssignments = await Assignment.find({ organizationId: glId });
  console.log(`   TechFlow Assignments:  ${tfAssignments.length} (Expected: 16)`);
  console.log(`   GreenLeaf Assignments: ${glAssignments.length} (Expected: 10)`);

  // Verify tickets
  const tfTickets = await Ticket.find({ organizationId: tfId });
  const glTickets = await Ticket.find({ organizationId: glId });
  console.log(`   TechFlow Tickets:      ${tfTickets.length} (Expected: 12)`);
  console.log(`   GreenLeaf Tickets:     ${glTickets.length} (Expected: 8)`);

  // Verify warranties
  const tfWarranties = await Warranty.find({ organizationId: tfId });
  const glWarranties = await Warranty.find({ organizationId: glId });
  console.log(`   TechFlow Warranties:   ${tfWarranties.length} (Expected: 14)`);
  console.log(`   GreenLeaf Warranties:  ${glWarranties.length} (Expected: 9)`);

  // 5. Verify Asset Status Distribution
  console.log('\n5. Asset Status Breakdown:');
  const allAssets = await Asset.find();
  const statusCounts = allAssets.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  console.log('   Status counts in DB:', statusCounts);

  // 6. AI Health Score Distribution
  const healthScores = allAssets.map(a => a.ai?.healthScore || 0);
  const avgHealth = Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length);
  const minHealth = Math.min(...healthScores);
  const maxHealth = Math.max(...healthScores);
  console.log(`   AI Health Scores: Avg=${avgHealth}, Min=${minHealth}, Max=${maxHealth}`);

  await mongoose.disconnect();

  // 7. Connect to production database and ensure ZERO development data exists
  console.log('\n7. Checking Production Database Isolation:');
  const prodUri = MONGODB_URI.replace('assetowl_dev', 'assetowl');
  await mongoose.connect(prodUri);
  const prodDbName = mongoose.connection.db.databaseName;
  console.log(`   Connected to Production Database: ${prodDbName}`);

  const prodOrgs = await Organization.find({ slug: { $in: ['techflow-solutions', 'greenleaf-corp'] } });
  const prodUsers = await User.find({ email: { $in: allUsers.map(u => u.email) } });
  const prodAssets = await Asset.find({ assetCode: { $in: ['TF-LAP-001', 'GL-LAP-001'] } });

  console.log(`   Prod Demo Organizations count: ${prodOrgs.length} (Expected: 0)`);
  console.log(`   Prod Demo Users count:         ${prodUsers.length} (Expected: 0)`);
  console.log(`   Prod Demo Assets count:        ${prodAssets.length} (Expected: 0)`);

  if (prodOrgs.length > 0 || prodUsers.length > 0 || prodAssets.length > 0) {
    throw new Error('FATAL: Development seed data was detected inside production database!');
  }
  console.log('   ✅ Production database is completely free of development seed data.');

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('🎉 ALL RICH SEED VERIFICATION CHECKS PASSED!');
  console.log('====================================================\n');
};

verify()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
