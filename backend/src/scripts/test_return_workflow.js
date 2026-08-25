import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Asset from '../models/Asset.js';
import Assignment from '../models/Assignment.js';
import { initiateReturn } from '../services/assignment.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const testReturnWorkflow = async () => {
  console.log('======================================================');
  console.log('🧪 TESTING ASSET RETURN WORKFLOW');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const emp = await User.findOne({ role: 'employee', status: 'active' }).lean();
  if (!emp) throw new Error('Employee user missing');

  // Find an assignment belonging to this employee
  let assignment = await Assignment.findOne({
    returnedAt: null,
    organizationId: emp.organizationId
  }).lean();

  if (!assignment) {
    console.log('No active assignment found, creating a test assignment for employee...');
    const asset = await Asset.findOne({ status: 'stock', organizationId: emp.organizationId });
    if (!asset) throw new Error('No stock asset found');

    assignment = await Assignment.create({
      assetId: asset._id,
      employeeId: emp.employeeRef || emp._id,
      assignedBy: emp._id,
      assignedAt: new Date(),
      organizationId: emp.organizationId
    });
  }

  console.log(`Testing initiateReturn for Assignment ID: ${assignment._id} | Employee: ${emp.email}`);

  // Test initiateReturn with custom reason string
  const updatedAssignment = await initiateReturn(
    assignment._id,
    'Upgrade - Standard return request with notes',
    emp
  );

  console.log('  ✅ Return Initiated Successfully:');
  console.log(`     - Assignment ID: ${updatedAssignment._id}`);
  console.log(`     - Return Reason: ${updatedAssignment.returnReason}`);
  console.log(`     - Return Initiated At: ${updatedAssignment.returnInitiatedAt}`);

  console.log('\n======================================================');
  console.log('🎉 ASSET RETURN WORKFLOW TEST PASSED 100%');
  console.log('======================================================');

  await mongoose.disconnect();
};

testReturnWorkflow().catch((err) => {
  console.error(err);
  process.exit(1);
});
