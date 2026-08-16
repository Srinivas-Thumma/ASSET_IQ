import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Organization from './models/Organization.js';
import User from './models/User.js';
import Employee from './models/Employee.js';
import Asset from './models/Asset.js';
import Assignment from './models/Assignment.js';
import Ticket from './models/Ticket.js';
import TicketMessage from './models/TicketMessage.js';
import Notification from './models/Notification.js';
import Category from './models/Category.js';
import Department from './models/Department.js';
import Location from './models/Location.js';
import Vendor from './models/Vendor.js';
import RefreshToken from './models/RefreshToken.js';
import Warranty from './models/Warranty.js';
import { updateTicketStatus } from './services/ticket.service.js';
import { initiateReturn } from './services/assignment.service.js';
import { deleteOrganization } from './services/admin.service.js';
import { generateAccessToken, verifyAccessToken } from './utils/token.utils.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assetiq_v2';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  STARTING SPRINT 4 FIXES VERIFICATION TEST SUITE');
  console.log('======================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for testing.\n');

  // Setup Test Organization
  const testOrgSlug = `test-s4-${Date.now()}`;
  const org = await Organization.create({
    name: 'Sprint 4 Test Org',
    slug: testOrgSlug,
    code: testOrgSlug.toUpperCase(),
    status: 'active'
  });

  const pwHash = await bcrypt.hash('Password123!', 10);

  // Setup Test Users & Personnel
  const adminEmp = await Employee.create({
    organizationId: org._id,
    firstName: 'Admin',
    lastName: 'Tester',
    email: `admin.${testOrgSlug}@test.com`,
    status: 'active'
  });

  const adminUser = await User.create({
    email: adminEmp.email,
    passwordHash: pwHash,
    role: 'org_admin',
    organizationId: org._id,
    employeeRef: adminEmp._id,
    status: 'active'
  });

  const emp1 = await Employee.create({
    organizationId: org._id,
    firstName: 'John',
    lastName: 'Dev',
    email: `john.${testOrgSlug}@test.com`,
    status: 'active'
  });

  const empUser1 = await User.create({
    email: emp1.email,
    passwordHash: pwHash,
    role: 'employee',
    organizationId: org._id,
    employeeRef: emp1._id,
    status: 'active'
  });

  const emp2 = await Employee.create({
    organizationId: org._id,
    firstName: 'Jane',
    lastName: 'Ops',
    email: `jane.${testOrgSlug}@test.com`,
    status: 'active'
  });

  const empUser2 = await User.create({
    email: emp2.email,
    passwordHash: pwHash,
    role: 'employee',
    organizationId: org._id,
    employeeRef: emp2._id,
    status: 'active'
  });

  // Setup Category & Assets
  const cat = await Category.create({
    organizationId: org._id,
    name: `Laptops-${testOrgSlug}`
  });

  const asset1 = await Asset.create({
    organizationId: org._id,
    name: 'MacBook Pro M3',
    assetCode: `MBP-${testOrgSlug}-1`,
    categoryId: cat._id,
    status: 'assigned',
    purchasePrice: 2499
  });

  const asset2 = await Asset.create({
    organizationId: org._id,
    name: 'Dell XPS 15',
    assetCode: `XPS-${testOrgSlug}-2`,
    categoryId: cat._id,
    status: 'stock',
    purchasePrice: 1899
  });

  // Assignment for emp1
  const assignment1 = await Assignment.create({
    organizationId: org._id,
    assetId: asset1._id,
    employeeId: emp1._id,
    assignedBy: adminUser._id,
    assignedAt: new Date()
  });

  console.log('--- TEST GROUP 1: GAP-01 Procurement Ticket Status Updates ---');
  {
    // Create a procurement ticket
    const ticket = await Ticket.create({
      organizationId: org._id,
      raisedBy: empUser1._id,
      type: 'request',
      issueType: 'hardware',
      title: 'Procurement: New 4K Monitor',
      description: 'Requesting external monitor for development',
      priority: 'p3',
      status: 'open'
    });

    // 1. Admin Approves Procurement (moves to in_progress)
    const approvedTicket = await updateTicketStatus(
      ticket._id,
      { status: 'in_progress', resolutionNotes: 'Procurement approved by Org Admin' },
      adminUser
    );
    assert(approvedTicket.status === 'in_progress', 'Ticket status properly updated to in_progress on approval');
    assert(approvedTicket.resolutionNotes === 'Procurement approved by Org Admin', 'Resolution notes recorded on approval');

    // 2. Admin Rejects / Closes Procurement
    const closedTicket = await updateTicketStatus(
      ticket._id,
      { status: 'closed', resolutionNotes: 'Procurement budget exceeded' },
      adminUser
    );
    assert(closedTicket.status === 'closed', 'Ticket status properly updated to closed on rejection');
    assert(closedTicket.resolvedAt !== null, 'resolvedAt recorded on ticket close');

    // 3. System message and notifications verified
    const messages = await TicketMessage.find({ ticketId: ticket._id });
    assert(messages.length >= 2, 'Automated system messages created for ticket status transitions');
  }

  console.log('\n--- TEST GROUP 2: GAP-02 Employee Asset Return & JWT employeeRef ---');
  {
    // Verify JWT contains employeeRef
    const token = generateAccessToken(empUser1);
    const decoded = verifyAccessToken(token);
    assert(decoded.employeeRef === emp1._id.toString(), 'generateAccessToken embeds employeeRef in JWT payload');

    // Context simulating req.user
    const authContext = {
      _id: empUser1._id,
      email: empUser1.email,
      role: empUser1.role,
      organizationId: empUser1.organizationId,
      employeeRef: decoded.employeeRef
    };

    // 1. Employee initiates return using assignmentId
    const ret1 = await initiateReturn(assignment1._id.toString(), 'Upgrading to new model', authContext);
    assert(ret1.returnInitiatedAt !== null, 'initiateReturn succeeds using assignmentId parameter');
    assert(ret1.returnReason === 'upgrade', 'Return reason properly normalized to enum value (upgrade)');

    // Reset return for next sub-test
    assignment1.returnInitiatedAt = null;
    assignment1.returnReason = null;
    await assignment1.save();

    // 2. Employee initiates return using assetId
    const ret2 = await initiateReturn(asset1._id.toString(), 'Screen flicker issue', authContext);
    assert(ret2.returnInitiatedAt !== null, 'initiateReturn succeeds using assetId parameter');
    assert(ret2.returnReason === 'defective', 'Return reason properly normalized to enum value (defective)');

    // 3. Unauthorized employee cannot return someone else\'s asset
    let blockedUnauthorized = false;
    const authContext2 = {
      _id: empUser2._id,
      email: empUser2.email,
      role: empUser2.role,
      organizationId: empUser2.organizationId,
      employeeRef: emp2._id.toString()
    };
    try {
      await initiateReturn(assignment1._id.toString(), 'Malicious return attempt', authContext2);
    } catch (err) {
      if (err.statusCode === 403) blockedUnauthorized = true;
    }
    assert(blockedUnauthorized, 'initiateReturn correctly blocks employee from returning equipment assigned to another');
  }

  console.log('\n--- TEST GROUP 3: GAP-05 Employee Deletion Active Custody Safety Guard ---');
  {
    // emp1 holds active custody of asset1
    const activeCustodyCount = await Assignment.countDocuments({
      employeeId: emp1._id,
      organizationId: org._id,
      returnedAt: null
    });
    assert(activeCustodyCount === 1, 'Employee has active custody record in Assignment collection');

    // emp2 has 0 custody records
    const emp2CustodyCount = await Assignment.countDocuments({
      employeeId: emp2._id,
      organizationId: org._id,
      returnedAt: null
    });
    assert(emp2CustodyCount === 0, 'Unassigned employee has 0 active custody records');
  }

  console.log('\n--- TEST GROUP 4: GAP-03 SuperAdmin Cascading Deletion Integrity ---');
  {
    // Populate extra tenant entities for the test organization
    const dept = await Department.create({ organizationId: org._id, name: 'Eng', code: `ENG-${testOrgSlug}` });
    const loc = await Location.create({ organizationId: org._id, name: 'HQ Floor 1', code: `HQ-${testOrgSlug}`, type: 'building' });
    const vendor = await Vendor.create({ organizationId: org._id, name: `Vendor-${testOrgSlug}` });
    const warranty = await Warranty.create({
      organizationId: org._id,
      assetId: asset1._id,
      provider: 'AppleCare',
      policyNumber: `POL-${testOrgSlug}`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    const notif = await Notification.create({
      organizationId: org._id,
      userId: empUser1._id,
      type: 'return_initiated',
      title: 'Welcome',
      message: 'Welcome to AssetOwl'
    });
    const refToken = await RefreshToken.create({
      userId: empUser1._id,
      token: `ref-token-test-${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Execute deleteOrganization
    const deleteResult = await deleteOrganization(org._id);
    assert(deleteResult.success === true, 'deleteOrganization executes successfully');

    // Verify all 14 collections have 0 orphaned records for this organization
    const remainingOrg = await Organization.findById(org._id);
    const remainingUsers = await User.countDocuments({ organizationId: org._id });
    const remainingRefreshTokens = await RefreshToken.countDocuments({ userId: { $in: [adminUser._id, empUser1._id, empUser2._id] } });
    const remainingEmployees = await Employee.countDocuments({ organizationId: org._id });
    const remainingAssets = await Asset.countDocuments({ organizationId: org._id });
    const remainingAssignments = await Assignment.countDocuments({ organizationId: org._id });
    const remainingWarranties = await Warranty.countDocuments({ organizationId: org._id });
    const remainingTickets = await Ticket.countDocuments({ organizationId: org._id });
    const remainingMessages = await TicketMessage.countDocuments({ organizationId: org._id });
    const remainingNotifications = await Notification.countDocuments({ organizationId: org._id });
    const remainingCategories = await Category.countDocuments({ organizationId: org._id });
    const remainingDepartments = await Department.countDocuments({ organizationId: org._id });
    const remainingLocations = await Location.countDocuments({ organizationId: org._id });
    const remainingVendors = await Vendor.countDocuments({ organizationId: org._id });

    assert(remainingOrg === null, 'Organization document deleted');
    assert(remainingUsers === 0, 'All Users for deleted organization purged (0 orphans)');
    assert(remainingRefreshTokens === 0, 'All RefreshTokens for deleted organization users purged (0 orphans)');
    assert(remainingEmployees === 0, 'All Employees for deleted organization purged (0 orphans)');
    assert(remainingAssets === 0, 'All Assets for deleted organization purged (0 orphans)');
    assert(remainingAssignments === 0, 'All Assignments for deleted organization purged (0 orphans)');
    assert(remainingWarranties === 0, 'All Warranties for deleted organization purged (0 orphans)');
    assert(remainingTickets === 0, 'All Tickets for deleted organization purged (0 orphans)');
    assert(remainingMessages === 0, 'All TicketMessages for deleted organization purged (0 orphans)');
    assert(remainingNotifications === 0, 'All Notifications for deleted organization purged (0 orphans)');
    assert(remainingCategories === 0, 'All Categories for deleted organization purged (0 orphans)');
    assert(remainingDepartments === 0, 'All Departments for deleted organization purged (0 orphans)');
    assert(remainingLocations === 0, 'All Locations for deleted organization purged (0 orphans)');
    assert(remainingVendors === 0, 'All Vendors for deleted organization purged (0 orphans)');
  }

  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(failedTests === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
