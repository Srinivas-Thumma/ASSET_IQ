import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runPhase6NodeTest = () => {
  console.log('\n======================================================');
  console.log('🧪 ASSETOWL PHASE 6 FRONTEND API CLIENT DEFINITION TEST');
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

  const reqApiPath = path.resolve(__dirname, '../../frontend/src/api/request.api.js');
  const convApiPath = path.resolve(__dirname, '../../frontend/src/api/conversation.api.js');
  const tktApiPath = path.resolve(__dirname, '../../frontend/src/api/ticket.api.js');

  assert(fs.existsSync(reqApiPath), '1. request.api.js exists in frontend/src/api');
  assert(fs.existsSync(convApiPath), '2. conversation.api.js exists in frontend/src/api');
  assert(fs.existsSync(tktApiPath), '3. ticket.api.js exists in frontend/src/api');

  const reqContent = fs.readFileSync(reqApiPath, 'utf-8');
  const convContent = fs.readFileSync(convApiPath, 'utf-8');
  const tktContent = fs.readFileSync(tktApiPath, 'utf-8');

  // Verify request.api.js endpoint paths
  assert(reqContent.includes("api.post('/requests'"), 'request.api.js maps POST /api/requests');
  assert(reqContent.includes("api.get('/requests'"), 'request.api.js maps GET /api/requests');
  assert(reqContent.includes("api.get(`/requests/${id}`)"), 'request.api.js maps GET /api/requests/:id');
  assert(reqContent.includes("api.patch(`/requests/${id}/status`"), 'request.api.js maps PATCH /api/requests/:id/status');
  assert(reqContent.includes("api.post(`/requests/${id}/approve`"), 'request.api.js maps POST /api/requests/:id/approve');
  assert(reqContent.includes("api.post(`/requests/${id}/reject`"), 'request.api.js maps POST /api/requests/:id/reject');
  assert(reqContent.includes("api.post(`/requests/${id}/complete`"), 'request.api.js maps POST /api/requests/:id/complete');

  // Verify conversation.api.js endpoint paths
  assert(convContent.includes("api.get('/conversations/organization'"), 'conversation.api.js maps GET /api/conversations/organization');
  assert(convContent.includes("api.get(`/conversations/${id}`)"), 'conversation.api.js maps GET /api/conversations/:id');
  assert(convContent.includes("api.get(`/conversations/${id}/messages`)"), 'conversation.api.js maps GET /api/conversations/:id/messages');
  assert(convContent.includes("api.post(`/conversations/${id}/messages`"), 'conversation.api.js maps POST /api/conversations/:id/messages');
  assert(convContent.includes("api.post(`/conversations/${id}/read`"), 'conversation.api.js maps POST /api/conversations/:id/read');

  // Verify ticket.api.js preservation
  assert(tktContent.includes("api.get('/tickets'"), 'ticket.api.js preserves GET /api/tickets');
  assert(tktContent.includes("api.get('/tickets/my'"), 'ticket.api.js preserves GET /api/tickets/my');

  console.log('\n======================================================');
  console.log(`📊 PHASE 6 API TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
};

runPhase6NodeTest();
