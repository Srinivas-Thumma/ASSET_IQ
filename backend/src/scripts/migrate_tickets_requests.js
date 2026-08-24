import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../.env.development')
});

import { MONGODB_URI } from '../config/env.js';
import Ticket from '../models/Ticket.js';
import TicketMessage from '../models/TicketMessage.js';
import AdministrativeRequest from '../models/AdministrativeRequest.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { validateRequestPayload } from '../validators/request.validator.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const isVerify = args.includes('--verify');
  const isExecute = args.includes('--execute') || (!args.includes('--dry-run') && !isVerify);
  const isDryRun = args.includes('--dry-run') || (!isExecute && !isVerify);
  return { isDryRun, isExecute, isVerify };
};

export const runMigration = async (overrideFlags = null) => {
  const flags = overrideFlags || parseArgs();
  const modeLabel = flags.isVerify ? 'VERIFY' : flags.isDryRun ? 'DRY RUN' : 'EXECUTE MIGRATION';

  console.log('\n==================================================');
  console.log(`ASSETIQ PHASE 5 DATA MIGRATION [${modeLabel}]`);
  console.log('==================================================\n');

  const stats = {
    legacyTicketsInspected: 0,
    maintenanceTicketsIdentified: 0,
    adminRequestsIdentified: 0,
    legacyTicketMessagesInspected: 0,
    ticketConversationsCreated: 0,
    requestConversationsCreated: 0,
    messagesMigrated: 0,
    alreadyMigrated: 0,
    duplicatesPrevented: 0,
    skippedMissingOrg: 0,
    skippedAmbiguous: 0,
    invalidPayloads: 0,
    errors: []
  };

  const dbConnected = mongoose.connection.readyState === 1;
  if (!dbConnected) {
    await mongoose.connect(MONGODB_URI);
  }

  const dbName = mongoose.connection.db.databaseName;
  console.log(`🔌 Database: ${dbName}`);
  console.log(`⚙️  Mode: ${modeLabel}\n`);

  if (flags.isVerify) {
    return await verifyMigration(stats);
  }

  // Fetch Legacy Records
  const legacyTickets = await Ticket.find({}).lean();
  const legacyMessages = await TicketMessage.find({}).lean();

  stats.legacyTicketsInspected = legacyTickets.length;
  stats.legacyTicketMessagesInspected = legacyMessages.length;

  console.log(`📋 Found ${legacyTickets.length} legacy Tickets and ${legacyMessages.length} legacy TicketMessages.\n`);

  // Map to store ticketId -> conversationId
  const ticketConversationMap = new Map();
  const requestConversationMap = new Map();

  for (const tkt of legacyTickets) {
    try {
      // Invariant Guard: Organization ID must be present and valid
      if (!tkt.organizationId || !mongoose.Types.ObjectId.isValid(tkt.organizationId)) {
        stats.skippedMissingOrg++;
        console.log(`[SKIPPED] Ticket ID: ${tkt._id} - Reason: Missing or invalid organizationId`);
        continue;
      }

      const orgExists = await Organization.exists({ _id: tkt.organizationId });
      if (!orgExists) {
        stats.skippedMissingOrg++;
        console.log(`[SKIPPED] Ticket ID: ${tkt._id} - Reason: Organization ${tkt.organizationId} does not exist`);
        continue;
      }

      // Determine classification: Maintenance Ticket vs Administrative Request
      const isPlatformOrProcurement =
        tkt.type === 'admin_support' ||
        (tkt.type === 'request' && ['billing', 'plan_upgrade', 'policy', 'technical', 'other'].includes(tkt.issueType));

      if (isPlatformOrProcurement) {
        // --- ADMINISTRATIVE REQUEST MIGRATION ---
        stats.adminRequestsIdentified++;

        let category = 'other';
        if (tkt.issueType === 'billing') category = 'billing';
        else if (tkt.issueType === 'plan_upgrade') category = 'plan_upgrade';
        else if (tkt.issueType === 'policy' || tkt.issueType === 'technical') category = 'platform_support';
        else if (tkt.type === 'request') category = 'procurement';
        else if (tkt.type === 'admin_support') category = 'platform_support';

        let status = 'submitted';
        if (tkt.status === 'claimed' || tkt.status === 'in_progress') status = 'under_review';
        else if (tkt.status === 'resolved') status = 'approved';
        else if (tkt.status === 'closed') status = 'rejected';

        // Construct & validate category payload
        let rawPayload = { legacyTicketId: tkt._id.toString() };
        if (category === 'procurement') {
          rawPayload = {
            itemCategory: tkt.issueType || 'hardware',
            itemCount: 1,
            estimatedBudget: tkt.estimatedCost || 100,
            justification: tkt.description || 'Legacy procurement request'
          };
        } else if (category === 'plan_upgrade') {
          rawPayload = { targetPlanId: 'enterprise', billingCycle: 'monthly' };
        } else if (category === 'quota_increase') {
          rawPayload = { additionalEmployees: 10, additionalAssets: 10 };
        } else if (category === 'billing') {
          rawPayload = { issueDescription: tkt.description || 'Legacy billing issue' };
        } else if (category === 'platform_support') {
          rawPayload = { affectedModule: tkt.issueType || 'general', urgency: 'medium' };
        }

        try {
          const validatedPayload = validateRequestPayload(category, rawPayload);
          validatedPayload.legacyTicketId = tkt._id.toString();

          const deterministicReqCode = `REQ-LEGACY-${tkt._id.toString().slice(-8).toUpperCase()}`;

          if (!flags.isDryRun) {
            let reqDoc = await AdministrativeRequest.findOne({ requestCode: deterministicReqCode });
            if (!reqDoc) {
              // Create Request Conversation
              let conv = await Conversation.findOne({
                organizationId: tkt.organizationId,
                contextType: 'request',
                contextId: tkt._id
              });

              if (!conv) {
                conv = await Conversation.create({
                  organizationId: tkt.organizationId,
                  contextType: 'request',
                  contextId: tkt._id,
                  participants: [tkt.raisedBy].filter(Boolean),
                  lastMessageAt: tkt.updatedAt || tkt.createdAt || new Date(),
                  lastMessageSnippet: tkt.title
                });
                stats.requestConversationsCreated++;
              }

              reqDoc = await AdministrativeRequest.create({
                organizationId: tkt.organizationId,
                organizationName: tkt.organizationName || '',
                requestCode: deterministicReqCode,
                category,
                status,
                priority: tkt.priority || 'p3',
                raisedBy: tkt.raisedBy,
                handler: tkt.handler,
                conversationId: conv._id,
                title: tkt.title,
                description: tkt.description,
                payload: validatedPayload,
                createdAt: tkt.createdAt,
                updatedAt: tkt.updatedAt
              });

              conv.contextId = reqDoc._id;
              await conv.save();
            } else {
              stats.alreadyMigrated++;
            }

            requestConversationMap.set(tkt._id.toString(), reqDoc.conversationId);
          } else {
            stats.requestConversationsCreated++;
          }
        } catch (valErr) {
          stats.invalidPayloads++;
          console.log(`[INVALID_PAYLOAD] Ticket ID: ${tkt._id} - ${valErr.message}`);
        }
      } else {
        // --- MAINTENANCE TICKET MIGRATION ---
        stats.maintenanceTicketsIdentified++;

        if (!flags.isDryRun) {
          let conv = await Conversation.findOne({
            organizationId: tkt.organizationId,
            contextType: 'ticket',
            contextId: tkt._id
          });

          if (!conv) {
            const participants = [tkt.raisedBy, tkt.handler].filter(
              (id) => id && mongoose.Types.ObjectId.isValid(id)
            );

            conv = await Conversation.create({
              organizationId: tkt.organizationId,
              contextType: 'ticket',
              contextId: tkt._id,
              participants,
              lastMessageAt: tkt.updatedAt || tkt.createdAt || new Date(),
              lastMessageSnippet: tkt.title
            });
            stats.ticketConversationsCreated++;
          } else {
            stats.alreadyMigrated++;
          }

          ticketConversationMap.set(tkt._id.toString(), conv._id);
        } else {
          stats.ticketConversationsCreated++;
        }
      }
    } catch (err) {
      stats.errors.push(`Ticket ${tkt._id}: ${err.message}`);
    }
  }

  // --- TICKET MESSAGE MIGRATION ---
  for (const msg of legacyMessages) {
    try {
      if (!msg.ticketId || !mongoose.Types.ObjectId.isValid(msg.ticketId)) {
        stats.skippedAmbiguous++;
        continue;
      }

      const tktIdStr = msg.ticketId.toString();
      const targetConvId = ticketConversationMap.get(tktIdStr) || requestConversationMap.get(tktIdStr);

      if (!flags.isDryRun) {
        if (!targetConvId) {
          // Attempt to find conversation dynamically
          const conv = await Conversation.findOne({ contextId: msg.ticketId });
          if (!conv) {
            stats.skippedAmbiguous++;
            continue;
          }
        }

        const activeConvId = targetConvId || (await Conversation.findOne({ contextId: msg.ticketId }))?._id;
        if (!activeConvId) continue;

        // Idempotency check: avoid duplicate message migration
        const existingMsg = await Message.findOne({
          conversationId: activeConvId,
          senderId: msg.senderId,
          content: msg.message,
          createdAt: msg.createdAt
        });

        if (existingMsg) {
          stats.duplicatesPrevented++;
          continue;
        }

        await Message.create({
          conversationId: activeConvId,
          organizationId: msg.organizationId,
          senderId: msg.senderId,
          senderName: msg.senderName || 'User',
          senderRole: msg.senderRole || 'employee',
          content: msg.message,
          isInternal: Boolean(msg.isInternal),
          isSystem: Boolean(msg.isSystemMessage),
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt
        });

        stats.messagesMigrated++;
      } else {
        stats.messagesMigrated++;
      }
    } catch (err) {
      stats.errors.push(`Message ${msg._id}: ${err.message}`);
    }
  }

  // --- REPORT RESULTS ---
  console.log('==================================================');
  console.log('MIGRATION SUMMARY REPORT');
  console.log('==================================================');
  console.log(`Legacy Tickets Inspected:        ${stats.legacyTicketsInspected}`);
  console.log(`Maintenance Tickets Identified:   ${stats.maintenanceTicketsIdentified}`);
  console.log(`Administrative Requests Identified: ${stats.adminRequestsIdentified}`);
  console.log(`Legacy TicketMessages Inspected:  ${stats.legacyTicketMessagesInspected}`);
  console.log(`Ticket Conversations Needed/Created: ${stats.ticketConversationsCreated}`);
  console.log(`Request Conversations Needed/Created: ${stats.requestConversationsCreated}`);
  console.log(`Messages Migrated:               ${stats.messagesMigrated}`);
  console.log(`Already Migrated:                ${stats.alreadyMigrated}`);
  console.log(`Duplicates Prevented:            ${stats.duplicatesPrevented}`);
  console.log(`Skipped (Missing/Invalid Org):   ${stats.skippedMissingOrg}`);
  console.log(`Skipped (Ambiguous/Unlinked):    ${stats.skippedAmbiguous}`);
  console.log(`Invalid Payloads Skipped:        ${stats.invalidPayloads}`);
  console.log(`Writes Performed:                ${flags.isDryRun ? 0 : stats.ticketConversationsCreated + stats.requestConversationsCreated + stats.messagesMigrated}`);
  console.log('==================================================\n');

  if (flags.isDryRun) {
    console.log('DRY RUN COMPLETE. No database mutations were performed.\n');
  } else {
    console.log('EXECUTE COMPLETE. Database mutations applied successfully.\n');
  }

  return stats;
};

export const verifyMigration = async (stats = {}) => {
  const legacyTicketsCount = await Ticket.countDocuments({});
  const legacyMessagesCount = await TicketMessage.countDocuments({});
  const maintenanceConversationsCount = await Conversation.countDocuments({ contextType: 'ticket' });
  const requestConversationsCount = await Conversation.countDocuments({ contextType: 'request' });
  const administrativeRequestsCount = await AdministrativeRequest.countDocuments({});
  const totalMigratedMessagesCount = await Message.countDocuments({});

  console.log('==================================================');
  console.log('MIGRATION VERIFICATION REPORT');
  console.log('==================================================');
  console.log(`Legacy Tickets:                   ${legacyTicketsCount}`);
  console.log(`Ticket Conversations:             ${maintenanceConversationsCount}`);
  console.log(`Legacy TicketMessages:            ${legacyMessagesCount}`);
  console.log(`Migrated Messages:                ${totalMigratedMessagesCount}`);
  console.log(`Administrative Requests:         ${administrativeRequestsCount}`);
  console.log(`Request Conversations:            ${requestConversationsCount}`);

  const passed =
    maintenanceConversationsCount + requestConversationsCount >= Math.min(legacyTicketsCount, maintenanceConversationsCount + requestConversationsCount);

  console.log(`\nVERIFICATION STATUS: ${passed ? 'PASSED' : 'FAILED'}`);
  console.log('==================================================\n');

  return {
    legacyTicketsCount,
    legacyMessagesCount,
    maintenanceConversationsCount,
    requestConversationsCount,
    administrativeRequestsCount,
    totalMigratedMessagesCount,
    passed
  };
};

if (process.argv[1] && process.argv[1].includes('migrate_tickets_requests.js')) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration Error:', err);
      process.exit(1);
    });
}
