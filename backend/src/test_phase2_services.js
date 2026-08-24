import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env.development')
});

import { MONGODB_URI } from './config/env.js';
import { validateRequestPayload } from './validators/request.validator.js';
import {
  verifyConversationAccess,
  sanitizeMessagesForUser,
  getOrCreateOrganizationConversation
} from './services/conversation.service.js';
import AdministrativeRequest from './models/AdministrativeRequest.js';
import Conversation from './models/Conversation.js';
import ApiError from './utils/ApiError.js';

const testPhase2 = async () => {
  console.log('\n======================================================');
  console.log('🧪 ASSETOWL PHASE 2 SERVICES & VALIDATION TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  };

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`🔌 Connected to MongoDB: ${mongoose.connection.db.databaseName}\n`);

    // ─────────────────────────────────────────────────────────────
    // 1. REQUEST PAYLOAD VALIDATION TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. Request Payload Validation ---');

    // Valid Procurement Payload
    const procPayload = {
      itemCategory: 'Laptops',
      itemCount: 10,
      estimatedBudget: 15000,
      justification: 'New engineering team onboarding'
    };
    const validProc = validateRequestPayload('procurement', procPayload);
    assert(validProc.itemCategory === 'Laptops' && validProc.itemCount === 10, 'Valid procurement payload accepted');

    // Malformed Procurement Payload Rejection
    let procErrorCaught = false;
    try {
      validateRequestPayload('procurement', { itemCategory: '', itemCount: -5, estimatedBudget: 0, justification: 'x' });
    } catch (err) {
      procErrorCaught = err instanceof ApiError && err.statusCode === 400;
    }
    assert(procErrorCaught, 'Malformed procurement payload correctly rejected with HTTP 400');

    // Valid Plan Upgrade Payload
    const planPayload = { targetPlanId: 'enterprise', billingCycle: 'annual' };
    const validPlan = validateRequestPayload('plan_upgrade', planPayload);
    assert(validPlan.targetPlanId === 'enterprise' && validPlan.billingCycle === 'annual', 'Valid plan_upgrade payload accepted');

    // Malformed Plan Upgrade Payload Rejection
    let planErrorCaught = false;
    try {
      validateRequestPayload('plan_upgrade', { targetPlanId: '', billingCycle: 'weekly' });
    } catch (err) {
      planErrorCaught = err instanceof ApiError && err.statusCode === 400;
    }
    assert(planErrorCaught, 'Invalid billingCycle in plan_upgrade payload correctly rejected');

    // Valid Quota Increase Payload
    const quotaPayload = { additionalEmployees: 25, additionalAssets: 50 };
    const validQuota = validateRequestPayload('quota_increase', quotaPayload);
    assert(validQuota.additionalEmployees === 25, 'Valid quota_increase payload accepted');

    // Malformed Quota Increase Rejection (zero added)
    let quotaErrorCaught = false;
    try {
      validateRequestPayload('quota_increase', { additionalEmployees: 0, additionalAssets: 0 });
    } catch (err) {
      quotaErrorCaught = err instanceof ApiError && err.statusCode === 400;
    }
    assert(quotaErrorCaught, 'Quota payload with 0 additional capacity correctly rejected');

    // ─────────────────────────────────────────────────────────────
    // 2. CONVERSATION AUTHORIZATION GUARD TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Conversation Authorization Guards ---');

    const orgIdA = new mongoose.Types.ObjectId();
    const orgIdB = new mongoose.Types.ObjectId();

    const employeeUser = { _id: new mongoose.Types.ObjectId(), role: 'employee', organizationId: orgIdA };
    const assetManagerUser = { _id: new mongoose.Types.ObjectId(), role: 'asset_manager', organizationId: orgIdA };
    const orgAdminUser = { _id: new mongoose.Types.ObjectId(), role: 'org_admin', organizationId: orgIdA };
    const superAdminUser = { _id: new mongoose.Types.ObjectId(), role: 'super_admin', organizationId: null };

    // Cross-tenant Access Denial Test
    const convOrgB = { _id: new mongoose.Types.ObjectId(), organizationId: orgIdB, contextType: 'organization' };
    const crossTenantCheck = await verifyConversationAccess(convOrgB, orgAdminUser);
    assert(!crossTenantCheck.authorized && crossTenantCheck.reason.includes('Cross-tenant'), 'Org Admin accessing Org B conversation correctly DENIED (Cross-tenant)');

    // Employee Access to Request Conversation Test
    const reqConv = { _id: new mongoose.Types.ObjectId(), organizationId: orgIdA, contextType: 'request' };
    const empReqCheck = await verifyConversationAccess(reqConv, employeeUser);
    assert(!empReqCheck.authorized, 'Employee accessing request conversation correctly DENIED');

    // Asset Manager Access to Procurement Request vs Plan Upgrade Request
    const procReqDoc = await AdministrativeRequest.create({
      organizationId: orgIdA,
      requestCode: `REQ-TEST-${Date.now()}`,
      category: 'procurement',
      title: 'Test Procurement Request',
      description: 'Need monitors',
      raisedBy: assetManagerUser._id
    });
    const procConv = { _id: new mongoose.Types.ObjectId(), organizationId: orgIdA, contextType: 'request', contextId: procReqDoc._id };
    const mgrProcCheck = await verifyConversationAccess(procConv, assetManagerUser);
    assert(mgrProcCheck.authorized, 'Asset Manager accessing procurement request conversation ALLOWED');

    const planReqDoc = await AdministrativeRequest.create({
      organizationId: orgIdA,
      requestCode: `REQ-PLAN-${Date.now()}`,
      category: 'plan_upgrade',
      title: 'Test Plan Request',
      description: 'Need enterprise plan',
      raisedBy: orgAdminUser._id
    });
    const planConv = { _id: new mongoose.Types.ObjectId(), organizationId: orgIdA, contextType: 'request', contextId: planReqDoc._id };
    const mgrPlanCheck = await verifyConversationAccess(planConv, assetManagerUser);
    assert(!mgrPlanCheck.authorized, 'Asset Manager accessing plan_upgrade request conversation correctly DENIED');

    // Organization Channel Derived Access Test
    const orgConv = { _id: new mongoose.Types.ObjectId(), organizationId: orgIdA, contextType: 'organization' };
    const empOrgCheck = await verifyConversationAccess(orgConv, employeeUser);
    const mgrOrgCheck = await verifyConversationAccess(orgConv, assetManagerUser);
    const adminOrgCheck = await verifyConversationAccess(orgConv, orgAdminUser);
    const saOrgCheck = await verifyConversationAccess(orgConv, superAdminUser);

    assert(!empOrgCheck.authorized, 'Employee accessing organization channel correctly DENIED');
    assert(!mgrOrgCheck.authorized, 'Asset Manager accessing organization channel correctly DENIED');
    assert(adminOrgCheck.authorized, 'Org Admin accessing organization channel ALLOWED (Derived)');
    assert(saOrgCheck.authorized, 'SuperAdmin accessing organization channel ALLOWED');

    // Lazy Channel Creation Test
    const lazyChannel = await getOrCreateOrganizationConversation(orgIdA);
    assert(lazyChannel && lazyChannel.contextType === 'organization', 'Lazy Organization Conversation created successfully');

    // ─────────────────────────────────────────────────────────────
    // 3. INTERNAL MESSAGE VISIBILITY SANITIZATION TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Internal Message Visibility Rules ---');

    const rawMessages = [
      { _id: 1, content: 'Public comment', isInternal: false },
      { _id: 2, content: 'Internal staff note on hardware diagnostics', isInternal: true },
      { _id: 3, content: 'Another public message', isInternal: false }
    ];

    const empMessages = sanitizeMessagesForUser(rawMessages, employeeUser);
    assert(empMessages.length === 2 && !empMessages.some(m => m.isInternal), 'Employee receives ONLY public messages (isInternal filtered out)');

    const mgrMessages = sanitizeMessagesForUser(rawMessages, assetManagerUser);
    assert(mgrMessages.length === 3 && mgrMessages.some(m => m.isInternal), 'Asset Manager receives ALL messages including internal staff notes');

    // Clean up test documents
    await AdministrativeRequest.deleteMany({ requestCode: { $regex: 'REQ-TEST|REQ-PLAN' } });
    await Conversation.deleteMany({ organizationId: orgIdA });

    console.log('\n======================================================');
    console.log(`📊 PHASE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 2 Test Suite Failed:', err);
    process.exit(1);
  }
};

testPhase2();
