import requestApi from './request.api.js';
import conversationApi from './conversation.api.js';
import ticketApi from './ticket.api.js';

export const runPhase6ApiTests = () => {
  console.log('\n======================================================');
  console.log('🧪 ASSETOWL PHASE 6 FRONTEND API CLIENT TEST SUITE');
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

  // 1. Verify requestApi exported methods
  assert(typeof requestApi.createRequest === 'function', 'requestApi.createRequest exported');
  assert(typeof requestApi.getRequests === 'function', 'requestApi.getRequests exported');
  assert(typeof requestApi.getRequestById === 'function', 'requestApi.getRequestById exported');
  assert(typeof requestApi.updateRequestStatus === 'function', 'requestApi.updateRequestStatus exported');
  assert(typeof requestApi.approveRequest === 'function', 'requestApi.approveRequest exported');
  assert(typeof requestApi.rejectRequest === 'function', 'requestApi.rejectRequest exported');
  assert(typeof requestApi.completeRequest === 'function', 'requestApi.completeRequest exported');

  // 2. Verify conversationApi exported methods
  assert(typeof conversationApi.getOrganizationConversation === 'function', 'conversationApi.getOrganizationConversation exported');
  assert(typeof conversationApi.getConversationById === 'function', 'conversationApi.getConversationById exported');
  assert(typeof conversationApi.getConversationMessages === 'function', 'conversationApi.getConversationMessages exported');
  assert(typeof conversationApi.sendMessage === 'function', 'conversationApi.sendMessage exported');
  assert(typeof conversationApi.markAsRead === 'function', 'conversationApi.markAsRead exported');

  // 3. Verify ticketApi backward compatibility
  assert(typeof ticketApi.getTickets === 'function', 'ticketApi.getTickets exported');
  assert(typeof ticketApi.getTicketById === 'function', 'ticketApi.getTicketById exported');
  assert(typeof ticketApi.createTicket === 'function', 'ticketApi.createTicket exported');
  assert(typeof ticketApi.claimTicket === 'function', 'ticketApi.claimTicket exported');
  assert(typeof ticketApi.resolveTicket === 'function', 'ticketApi.resolveTicket exported');
  assert(typeof ticketApi.getMessages === 'function', 'ticketApi.getMessages exported');

  console.log('\n======================================================');
  console.log(`📊 PHASE 6 API CLIENT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  return { passed, failed };
};

runPhase6ApiTests();
